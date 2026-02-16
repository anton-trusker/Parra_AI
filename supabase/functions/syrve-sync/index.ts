import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sha1(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { sync_type } = await req.json();
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get Syrve config
    const { data: config, error: configErr } = await adminClient
      .from("syrve_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (configErr || !config) {
      return new Response(JSON.stringify({ error: "Syrve not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check sync lock
    if (config.sync_lock_until && new Date(config.sync_lock_until) > new Date()) {
      return new Response(JSON.stringify({ error: "Sync already in progress. Please wait." }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Set sync lock (5 minutes max)
    const lockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await adminClient.from("syrve_config").update({ sync_lock_until: lockUntil }).eq("id", config.id);

    // Handle clean_import: wipe all Syrve data first
    if (sync_type === "clean_import") {
      await cleanAllSyrveData(adminClient);
    }

    // Create sync run
    const runType = sync_type === "clean_import" ? "bootstrap" : (sync_type || "bootstrap");
    const { data: syncRun } = await adminClient
      .from("syrve_sync_runs")
      .insert({ run_type: runType, status: "running", triggered_by: user.id })
      .select()
      .single();

    let syrveToken: string | null = null;
    let serverUrl = '';
    const stats: any = { stores: 0, measurement_units: 0, categories: 0, products: 0, barcodes: 0, skipped: 0, errors: 0, deactivated: 0, deleted: 0, prices_updated: 0, stock_updated: 0, stage: 'authenticating', progress: 0 };
    const selectedCategoryIds: string[] = config.selected_category_ids || [];
    const productTypeFilters: string[] = config.product_type_filters || ['GOODS', 'DISH'];
    const importInactive: boolean = config.import_inactive_products || false;
    const fieldMapping = config.field_mapping || { extract_vintage: true, extract_volume: true, auto_map_category: true, sync_prices: true, sync_stock: true };
    const reimportMode: string = config.reimport_mode || 'merge';

    const updateProgress = async (stage: string, progress: number) => {
      stats.stage = stage;
      stats.progress = progress;
      await adminClient.from("syrve_sync_runs").update({ stats }).eq("id", syncRun?.id);
    };

    try {
      // Normalize server_url: ensure it ends with /api
      serverUrl = config.server_url.replace(/\/+$/, '');
      if (!serverUrl.endsWith('/api')) {
        serverUrl = serverUrl + '/api';
      }

      // 1. Login to Syrve
      await updateProgress('authenticating', 5);
      const authStart = Date.now();
      const authUrl = `${serverUrl}/auth?login=${encodeURIComponent(config.api_login)}&pass=${config.api_password_hash}`;
      const authResp = await fetch(authUrl);
      if (!authResp.ok) throw new Error(`Syrve auth failed: ${authResp.status}`);
      syrveToken = (await authResp.text()).trim();

      await logApi(adminClient, syncRun?.id, "AUTH", "success", authUrl, undefined, Date.now() - authStart);

      // 2. Sync based on type
      if (runType === "bootstrap" || runType === "stores") {
        await updateProgress('syncing_stores', 10);
        await syncStores(adminClient, serverUrl, syrveToken, syncRun?.id, stats);
      }

      // 2b. Sync measurement units
      if (runType === "bootstrap" || runType === "stores") {
        await updateProgress('syncing_units', 20);
        await syncMeasurementUnits(adminClient, serverUrl, syrveToken!, syncRun?.id, stats);
      }

      if (runType === "bootstrap" || runType === "categories") {
        await updateProgress('syncing_categories', 30);
        await syncCategories(adminClient, serverUrl, syrveToken, syncRun?.id, stats);
      }

      if (runType === "bootstrap" || runType === "products") {
        await updateProgress('importing_products', 45);
        const importedSyrveIds = await syncProducts(adminClient, serverUrl, syrveToken, syncRun?.id, stats, selectedCategoryIds, productTypeFilters, importInactive, fieldMapping);

        // Fetch prices if enabled
        if (fieldMapping.sync_prices !== false) {
          await updateProgress('fetching_prices', 80);
          await syncPrices(adminClient, serverUrl, syrveToken!, syncRun?.id, stats);
        }

        // Fetch stock for ALL selected stores (or all stores if none selected)
        if (fieldMapping.sync_stock !== false) {
          await updateProgress('fetching_stock', 85);
          let storeIds = config.selected_store_ids || [];
          if (storeIds.length === 0 && config.default_store_id) {
            storeIds = [config.default_store_id];
          }
          // If still no specific stores, fetch all from DB
          if (storeIds.length === 0) {
            const { data: allStores } = await adminClient.from("stores").select("syrve_store_id").eq("is_active", true);
            storeIds = (allStores || []).map((s: any) => s.syrve_store_id);
          }
          for (const sid of storeIds) {
            await syncStock(adminClient, serverUrl, syrveToken!, syncRun?.id, stats, sid);
          }
        }

        await updateProgress('applying_reimport_mode', 90);
        // Default behavior: soft-deactivate non-matching products (preserve data)
        if (importedSyrveIds && importedSyrveIds.length > 0) {
          await applyReimportMode(adminClient, importedSyrveIds, reimportMode, stats);
        }
      }

      // Prices & stock only mode (no product re-import)
      if (runType === "prices_stock") {
        await updateProgress('fetching_prices', 30);
        await syncPrices(adminClient, serverUrl, syrveToken!, syncRun?.id, stats);

        let psStoreIds = config.selected_store_ids || [];
        if (psStoreIds.length === 0 && config.default_store_id) psStoreIds = [config.default_store_id];
        if (psStoreIds.length === 0) {
          const { data: allStores } = await adminClient.from("stores").select("syrve_store_id").eq("is_active", true);
          psStoreIds = (allStores || []).map((s: any) => s.syrve_store_id);
        }
        if (psStoreIds.length > 0) {
          await updateProgress('fetching_stock', 60);
          for (const sid of psStoreIds) {
            await syncStock(adminClient, serverUrl, syrveToken!, syncRun?.id, stats, sid);
          }
        }
      }

      // Wine enrichment stage: auto-create wines from wine-category products
      if (runType === "bootstrap" || runType === "products" || runType === "prices_stock") {
        await updateProgress('enriching_wines', 90);
        await enrichWinesFromProducts(adminClient, config, stats);

        // AI enrichment: detect country, region, grape variety, wine type
        await updateProgress('ai_enriching', 95);
        await aiEnrichNewWines(adminClient, stats);
      }

      // Update sync run as success
      stats.stage = 'completed';
      stats.progress = 100;
      await adminClient.from("syrve_sync_runs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        stats,
      }).eq("id", syncRun?.id);

    } catch (syncError) {
      console.error("Sync error:", syncError);
      stats.errors++;
      stats.stage = 'failed';
      await adminClient.from("syrve_sync_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: syncError instanceof Error ? syncError.message : "Unknown error",
        stats,
      }).eq("id", syncRun?.id);
      throw syncError;
    } finally {
      // Always logout and release lock
      if (syrveToken && serverUrl) {
        try {
          await fetch(`${serverUrl}/logout?key=${syrveToken}`);
          await logApi(adminClient, syncRun?.id, "LOGOUT", "success", "");
        } catch (e) { console.error("Logout error:", e); }
      }
      await adminClient.from("syrve_config").update({ sync_lock_until: null }).eq("id", config.id);
    }

    return new Response(JSON.stringify({ success: true, stats, sync_run_id: syncRun?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-sync error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── Clean All Syrve Data ───

async function cleanAllSyrveData(client: any) {
  console.log("Clean import: wiping all Syrve data...");
  // Order matters: delete dependent tables first
  await client.from("stock_levels").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("product_barcodes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await client.from("syrve_raw_objects").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Clean import: data wiped successfully");
}

async function logApi(
  client: any, syncRunId: string | null, action: string, status: string, 
  url: string, error?: string, durationMs?: number, responsePreview?: string
) {
  await client.from("syrve_api_logs").insert({
    sync_run_id: syncRunId,
    action_type: action,
    status,
    request_url: url,
    request_method: "GET",
    error_message: error,
    duration_ms: durationMs || null,
    response_payload_preview: responsePreview?.substring(0, 500) || null,
  });
}

async function syncStores(client: any, baseUrl: string, token: string, syncRunId: string | null, stats: any) {
  const start = Date.now();
  const url = `${baseUrl}/corporation/stores?key=${token}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    await logApi(client, syncRunId, "FETCH_STORES", "error", url, `HTTP ${resp.status}`, Date.now() - start);
    throw new Error(`Failed to fetch stores: ${resp.status}`);
  }

  const xml = await resp.text();
  await logApi(client, syncRunId, "FETCH_STORES", "success", url, undefined, Date.now() - start, xml.substring(0, 500));

  const stores = parseXmlItems(xml, "corporateItemDto");
  for (const store of stores) {
    const syrveId = store.id;
    if (!syrveId) continue;

    const payloadHash = await sha1(JSON.stringify(store));

    const { data: existing } = await client.from("syrve_raw_objects")
      .select("payload_hash")
      .eq("entity_type", "store")
      .eq("syrve_id", syrveId)
      .maybeSingle();

    if (existing?.payload_hash === payloadHash) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    await client.from("syrve_raw_objects").upsert({
      entity_type: "store",
      syrve_id: syrveId,
      payload: store,
      payload_hash: payloadHash,
      synced_at: new Date().toISOString(),
    }, { onConflict: "entity_type,syrve_id" });

    await client.from("stores").upsert({
      syrve_store_id: syrveId,
      name: store.name || "Unknown",
      code: store.code || null,
      store_type: store.type || null,
      syrve_data: store,
      synced_at: new Date().toISOString(),
    }, { onConflict: "syrve_store_id" });

    stats.stores++;
  }
}

async function syncMeasurementUnits(client: any, baseUrl: string, token: string, syncRunId: string | null, stats: any) {
  const start = Date.now();
  const url = `${baseUrl}/v2/entities/list?key=${token}&rootType=MeasureUnit`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      await logApi(client, syncRunId, "FETCH_UNITS", "error", url, `HTTP ${resp.status}`, Date.now() - start);
      console.error(`Failed to fetch measurement units: ${resp.status}`);
      return;
    }

    const text = await resp.text();
    await logApi(client, syncRunId, "FETCH_UNITS", "success", url, undefined, Date.now() - start, text.substring(0, 500));

    let units: any[];
    try {
      units = JSON.parse(text);
      if (!Array.isArray(units)) units = [units];
    } catch {
      units = parseXmlItems(text, "unitDto");
    }

    for (const unit of units) {
      const syrveId = unit.id;
      if (!syrveId) continue;

      await client.from("measurement_units").upsert({
        syrve_unit_id: syrveId,
        name: unit.name || "Unknown",
        short_name: unit.shortName || unit.short_name || null,
        code: unit.code || null,
        main_unit_syrve_id: unit.mainUnitId || unit.main_unit_id || null,
        is_main: unit.isMain || unit.is_main || false,
        factor: unit.factor || unit.ratio || 1,
        syrve_data: unit,
        synced_at: new Date().toISOString(),
      }, { onConflict: "syrve_unit_id" });

      stats.measurement_units = (stats.measurement_units || 0) + 1;
    }

    // Resolve main_unit_id references
    const { data: allUnits } = await client.from("measurement_units").select("id, syrve_unit_id, main_unit_syrve_id");
    if (allUnits) {
      const lookup = new Map(allUnits.map((u: any) => [u.syrve_unit_id, u.id]));
      for (const u of allUnits) {
        if (u.main_unit_syrve_id && lookup.has(u.main_unit_syrve_id)) {
          await client.from("measurement_units").update({ main_unit_id: lookup.get(u.main_unit_syrve_id) }).eq("id", u.id);
        }
      }
    }

    console.log(`Measurement units: imported ${stats.measurement_units}`);
  } catch (e) {
    console.error("syncMeasurementUnits error:", e);
    await logApi(client, syncRunId, "FETCH_UNITS", "error", url, e instanceof Error ? e.message : "Unknown", Date.now() - start);
  }
}

async function syncCategories(client: any, baseUrl: string, token: string, syncRunId: string | null, stats: any) {
  const start = Date.now();
  // Use includeDeleted=true to get ALL groups, then mark deleted ones as inactive
  const url = `${baseUrl}/v2/entities/products/group/list?includeDeleted=true&key=${token}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    await logApi(client, syncRunId, "FETCH_CATEGORIES", "error", url, `HTTP ${resp.status}`, Date.now() - start);
    throw new Error(`Failed to fetch categories: ${resp.status}`);
  }

  const text = await resp.text();
  await logApi(client, syncRunId, "FETCH_CATEGORIES", "success", url, undefined, Date.now() - start, text.substring(0, 500));

  let groups: any[];
  try {
    groups = JSON.parse(text);
    if (!Array.isArray(groups)) groups = [groups];
  } catch {
    groups = parseXmlItems(text, "groupDto");
  }

  let rootCount = 0;
  let childCount = 0;

  for (const group of groups) {
    const syrveId = group.id || group.groupId;
    if (!syrveId) continue;

    const payloadHash = await sha1(JSON.stringify(group));

    const { data: existing } = await client.from("syrve_raw_objects")
      .select("payload_hash")
      .eq("entity_type", "product_group")
      .eq("syrve_id", syrveId)
      .maybeSingle();

    if (existing?.payload_hash === payloadHash) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    await client.from("syrve_raw_objects").upsert({
      entity_type: "product_group",
      syrve_id: syrveId,
      payload: group,
      payload_hash: payloadHash,
      synced_at: new Date().toISOString(),
    }, { onConflict: "entity_type,syrve_id" });

    const parentSyrveId = group.parentId || group.parent || null;
    const isDeleted = group.deleted === true || group.isDeleted === true;

    await client.from("categories").upsert({
      syrve_group_id: syrveId,
      name: group.name || "Unknown",
      parent_syrve_id: parentSyrveId,
      is_deleted: isDeleted,
      is_active: !isDeleted,
      syrve_data: group,
      synced_at: new Date().toISOString(),
    }, { onConflict: "syrve_group_id" });

    stats.categories++;
    if (parentSyrveId) childCount++;
    else rootCount++;
  }

  // Resolve ALL parent_id references (re-resolve everything to catch orphans)
  const { data: allCats } = await client.from("categories").select("id, syrve_group_id, parent_syrve_id");
  if (allCats) {
    const lookup = new Map(allCats.map((c: any) => [c.syrve_group_id, c.id]));
    let resolved = 0;
    let orphans = 0;
    for (const cat of allCats) {
      if (cat.parent_syrve_id) {
        const parentId = lookup.get(cat.parent_syrve_id);
        if (parentId) {
          await client.from("categories").update({ parent_id: parentId }).eq("id", cat.id);
          resolved++;
        } else {
          await client.from("categories").update({ parent_id: null }).eq("id", cat.id);
          orphans++;
        }
      } else {
        await client.from("categories").update({ parent_id: null }).eq("id", cat.id);
      }
    }
    console.log(`Categories: ${stats.categories} new/updated (${rootCount} root, ${childCount} child), resolved ${resolved} parents, ${orphans} orphans`);
  }
}

async function syncProducts(
  client: any, baseUrl: string, token: string, syncRunId: string | null, 
  stats: any, selectedCategoryIds: string[], productTypeFilters: string[],
  importInactive: boolean, fieldMapping: any
): Promise<string[]> {
  const start = Date.now();
  const includeDeleted = importInactive ? 'true' : 'false';
  const url = `${baseUrl}/v2/entities/products/list?includeDeleted=${includeDeleted}&key=${token}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    await logApi(client, syncRunId, "FETCH_PRODUCTS", "error", url, `HTTP ${resp.status}`, Date.now() - start);
    throw new Error(`Failed to fetch products: ${resp.status}`);
  }

  const text = await resp.text();
  await logApi(client, syncRunId, "FETCH_PRODUCTS", "success", url, undefined, Date.now() - start, text.substring(0, 500));

  let products: any[];
  try {
    products = JSON.parse(text);
    if (!Array.isArray(products)) products = [products];
  } catch {
    products = parseXmlItems(text, "productDto");
  }

  // Get category mapping
  const { data: categories } = await client.from("categories").select("id, syrve_group_id");
  const catLookup = new Map((categories || []).map((c: any) => [c.syrve_group_id, c.id]));

  // Build set of selected category syrve IDs for filtering
  let selectedSyrveIds: Set<string> | null = null;
  if (selectedCategoryIds.length > 0) {
    const { data: selectedCats } = await client.from("categories")
      .select("syrve_group_id")
      .in("id", selectedCategoryIds);
    if (selectedCats) {
      selectedSyrveIds = new Set(selectedCats.map((c: any) => c.syrve_group_id));
    }
  }

  // Pre-fetch existing hashes for all products in one query
  const productSyrveIds = products.map((p: any) => p.id).filter(Boolean);
  const { data: existingRaw } = await client.from("syrve_raw_objects")
    .select("syrve_id, payload_hash")
    .eq("entity_type", "product")
    .in("syrve_id", productSyrveIds);
  const existingHashMap = new Map((existingRaw || []).map((r: any) => [r.syrve_id, r.payload_hash]));

  // Prepare batches
  const BATCH_SIZE = 50;
  const rawBatch: any[] = [];
  const productBatch: any[] = [];
  const productSyrveIdOrder: string[] = [];
  const barcodeQueue: { syrveId: string; barcodes: any[] }[] = [];

  for (const product of products) {
    const syrveId = product.id;
    if (!syrveId) continue;

    const parentGroupId = product.parent || product.parentId;

    // Category filter: skip if product HAS a category but it's not in the selected set
    // Products WITHOUT a category (null/empty parentGroupId) are always imported
    if (selectedSyrveIds && parentGroupId && !selectedSyrveIds.has(parentGroupId)) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    // Product type filter
    const pType = (product.type || product.productType || '').toUpperCase();
    if (productTypeFilters.length > 0 && pType && !productTypeFilters.includes(pType)) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    // Skip inactive unless configured
    if (!importInactive && (product.deleted === true || product.isDeleted === true)) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    const payloadHash = await sha1(JSON.stringify(product));

    if (existingHashMap.get(syrveId) === payloadHash) {
      // Even if hash matches, track the ID as "imported" for reimport mode
      productSyrveIdOrder.push(syrveId);
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    rawBatch.push({
      entity_type: "product",
      syrve_id: syrveId,
      payload: product,
      payload_hash: payloadHash,
      synced_at: new Date().toISOString(),
    });

    const categoryId = (fieldMapping.auto_map_category !== false && parentGroupId) ? catLookup.get(parentGroupId) : null;
    
    // Extract vintage based on field_mapping
    let vintage: number | null = null;
    if (fieldMapping.extract_vintage !== false) {
      const vintageMatch = product.name?.match(/(19|20)\d{2}/);
      vintage = vintageMatch ? parseInt(vintageMatch[0]) : null;
    }

    // Extract volume based on field_mapping
    let unitCapacity = product.unitCapacity || null;
    if (fieldMapping.extract_volume !== false) {
      const containers = product.containers || [];
      if (Array.isArray(containers) && containers.length > 0 && !unitCapacity) {
        const firstContainer = containers[0];
        if (firstContainer.count) unitCapacity = parseFloat(firstContainer.count);
      }
    }

    const metadata: any = { vintage, extracted_at: new Date().toISOString(), product_type: pType };
    if (product.productCategory) metadata.productCategory = product.productCategory;
    if (product.cookingPlaceType) metadata.cookingPlaceType = product.cookingPlaceType;

    const productContainers = product.containers || [];
    const syrveData = { ...product };
    if (Array.isArray(productContainers) && productContainers.length > 0) syrveData.containers = productContainers;

    // Resolve main_unit_id: look up the Syrve mainUnit GUID in measurement_units
    const syrveMainUnit = product.mainUnit || null;

    productBatch.push({
      syrve_product_id: syrveId,
      category_id: categoryId || null,
      name: product.name || "Unknown",
      description: product.description || null,
      sku: product.num || null,
      code: product.code || null,
      product_type: product.type || product.productType || null,
      main_unit_id: syrveMainUnit,
      unit_capacity: unitCapacity,
      default_sale_price: product.defaultSalePrice || null,
      not_in_store_movement: product.notInStoreMovement || false,
      is_deleted: product.deleted || false,
      is_active: !(product.deleted || false),
      syrve_data: syrveData,
      metadata,
      synced_at: new Date().toISOString(),
    });
    productSyrveIdOrder.push(syrveId);

    if (product.barcodes) {
      barcodeQueue.push({ syrveId, barcodes: Array.isArray(product.barcodes) ? product.barcodes : [product.barcodes] });
    }

    stats.products++;
  }

  // Batch upsert raw objects
  for (let i = 0; i < rawBatch.length; i += BATCH_SIZE) {
    await client.from("syrve_raw_objects").upsert(rawBatch.slice(i, i + BATCH_SIZE), { onConflict: "entity_type,syrve_id" });
  }

  // Batch upsert products
  for (let i = 0; i < productBatch.length; i += BATCH_SIZE) {
    await client.from("products").upsert(productBatch.slice(i, i + BATCH_SIZE), { onConflict: "syrve_product_id" });
  }

  // Fetch product IDs for barcode linking
  if (barcodeQueue.length > 0) {
    const bcSyrveIds = barcodeQueue.map(b => b.syrveId);
    const { data: productRows } = await client.from("products")
      .select("id, syrve_product_id")
      .in("syrve_product_id", bcSyrveIds);
    const prodIdMap = new Map((productRows || []).map((p: any) => [p.syrve_product_id, p.id]));

    const barcodeBatch: any[] = [];
    for (const { syrveId, barcodes } of barcodeQueue) {
      const productId = prodIdMap.get(syrveId);
      if (!productId) continue;
      for (const bc of barcodes) {
        const barcodeValue = bc.barcode || bc.barcodeContainer?.barcode || (typeof bc === "string" ? bc : null);
        if (!barcodeValue) continue;
        barcodeBatch.push({
          product_id: productId,
          barcode: barcodeValue,
          container_name: bc.containerName || bc.barcodeContainer?.containerName || null,
          source: "syrve",
          is_primary: false,
        });
        stats.barcodes++;
      }
    }

    for (let i = 0; i < barcodeBatch.length; i += BATCH_SIZE) {
      await client.from("product_barcodes").upsert(barcodeBatch.slice(i, i + BATCH_SIZE), { onConflict: "barcode" }).catch(() => {});
    }
  }

  // After products are upserted, resolve main_unit_id to measurement_units.id
  const { data: allUnits } = await client.from("measurement_units").select("id, syrve_unit_id");
  if (allUnits && allUnits.length > 0) {
    const unitLookup = new Map(allUnits.map((u: any) => [u.syrve_unit_id, u.id]));
    const { data: prodsWithUnit } = await client.from("products")
      .select("id, main_unit_id")
      .not("main_unit_id", "is", null);

    if (prodsWithUnit) {
      const updateBatch: any[] = [];
      let unresolved = 0;
      for (const p of prodsWithUnit) {
        const resolvedId = unitLookup.get(p.main_unit_id);
        if (resolvedId && p.main_unit_id !== resolvedId) {
          updateBatch.push({ id: p.id, main_unit_id: resolvedId });
        } else if (!resolvedId && p.main_unit_id && p.main_unit_id.length > 30) {
          // Looks like a Syrve GUID that couldn't be resolved
          unresolved++;
        }
      }
      for (let i = 0; i < updateBatch.length; i += 50) {
        const chunk = updateBatch.slice(i, i + 50);
        for (const item of chunk) {
          await client.from("products").update({ main_unit_id: item.main_unit_id }).eq("id", item.id);
        }
      }
      console.log(`Linked ${updateBatch.length} products to measurement units${unresolved > 0 ? `, ${unresolved} unresolved` : ''}`);
    }
  }

  return productSyrveIdOrder;
}

async function syncPrices(client: any, _baseUrl: string, _token: string, syncRunId: string | null, stats: any) {
  const start = Date.now();
  try {
    let offset = 0;
    const BATCH = 200;
    let totalUpdated = 0;

    while (true) {
      const { data: rawProducts, error } = await client.from("syrve_raw_objects")
        .select("syrve_id, payload")
        .eq("entity_type", "product")
        .eq("is_deleted", false)
        .range(offset, offset + BATCH - 1);

      if (error || !rawProducts || rawProducts.length === 0) break;

      for (const raw of rawProducts) {
        const payload = raw.payload as any;
        const defaultSalePrice = parseFloat(payload?.defaultSalePrice || "0");
        const purchasePrice = parseFloat(payload?.purchasePrice || payload?.costPrice || "0");

        if (defaultSalePrice > 0 || purchasePrice > 0) {
          const updateData: any = { price_updated_at: new Date().toISOString() };
          if (defaultSalePrice > 0) {
            updateData.sale_price = defaultSalePrice;
            updateData.default_sale_price = defaultSalePrice;
          }
          if (purchasePrice > 0) {
            updateData.purchase_price = purchasePrice;
          }
          const { error: upErr } = await client.from("products")
            .update(updateData)
            .eq("syrve_product_id", raw.syrve_id);
          if (!upErr) totalUpdated++;
        }
      }

      offset += BATCH;
      if (rawProducts.length < BATCH) break;
    }

    stats.prices_updated = totalUpdated;
    await logApi(client, syncRunId, "SYNC_PRICES", "success", "syrve_raw_objects", undefined, Date.now() - start, `Updated ${totalUpdated} prices from stored data`);
    console.log(`Prices: updated ${totalUpdated} from raw objects`);
  } catch (e) {
    console.error("syncPrices error:", e);
    await logApi(client, syncRunId, "SYNC_PRICES", "error", "syrve_raw_objects", e instanceof Error ? e.message : "Unknown", Date.now() - start);
  }
}

async function syncStock(client: any, baseUrl: string, token: string, syncRunId: string | null, stats: any, storeId: string) {
  const start = Date.now();
  const today = new Date().toISOString().split("T")[0];
  const url = `${baseUrl}/reports/balance/stores?key=${token}&store=${storeId}&timestamp=${today}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      await logApi(client, syncRunId, "FETCH_STOCK", "error", url, `HTTP ${resp.status}`, Date.now() - start);
      console.error(`Stock balance fetch failed: ${resp.status}`);
      return;
    }

    const xml = await resp.text();
    await logApi(client, syncRunId, "FETCH_STOCK", "success", url, undefined, Date.now() - start, xml.substring(0, 500));

    const stockItems = parseStockBalanceXml(xml);

    const syrveProductIds = stockItems.map((s: any) => s.product_id).filter(Boolean);
    if (syrveProductIds.length === 0) {
      console.log(`Stock: no items returned for store ${storeId}`);
      return;
    }

    const productLookup = new Map<string, { id: string; main_unit_id: string | null }>();
    for (let i = 0; i < syrveProductIds.length; i += 200) {
      const batch = syrveProductIds.slice(i, i + 200);
      const { data: products } = await client.from("products")
        .select("id, syrve_product_id, main_unit_id")
        .in("syrve_product_id", batch);
      if (products) {
        for (const p of products) {
          productLookup.set(p.syrve_product_id, { id: p.id, main_unit_id: p.main_unit_id });
        }
      }
    }

    const { data: storeRow } = await client.from("stores").select("id").eq("syrve_store_id", storeId).maybeSingle();
    const internalStoreId = storeRow?.id;
    let unmatchedProducts = 0;

    const BATCH_SIZE = 50;
    const stockBatch: any[] = [];
    for (const item of stockItems) {
      const prod = productLookup.get(item.product_id);
      if (!prod) {
        unmatchedProducts++;
        continue;
      }

      await client.from("products").update({
        current_stock: item.amount,
        stock_updated_at: new Date().toISOString(),
      }).eq("id", prod.id);

      if (internalStoreId) {
        stockBatch.push({
          product_id: prod.id,
          store_id: internalStoreId,
          quantity: item.amount,
          unit_id: prod.main_unit_id || null,
          source: 'syrve',
          sync_run_id: syncRunId,
          last_synced_at: new Date().toISOString(),
        });
      }

      stats.stock_updated++;
    }

    for (let i = 0; i < stockBatch.length; i += BATCH_SIZE) {
      await client.from("stock_levels").upsert(
        stockBatch.slice(i, i + BATCH_SIZE),
        { onConflict: "product_id,store_id" }
      );
    }

    console.log(`Stock: parsed ${stockItems.length} items, matched ${stats.stock_updated} for store ${storeId}${unmatchedProducts > 0 ? `, ${unmatchedProducts} unmatched` : ''}`);
  } catch (e) {
    console.error("syncStock error:", e);
    await logApi(client, syncRunId, "FETCH_STOCK", "error", url, e instanceof Error ? e.message : "Unknown", Date.now() - start);
  }
}

function parseStockBalanceXml(xml: string): { product_id: string; amount: number }[] {
  const items: { product_id: string; amount: number }[] = [];
  const itemRegex = /<(?:item|remainItem|record)>([\s\S]*?)<\/(?:item|remainItem|record)>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const getField = (tag: string): string | null => {
      const m = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1].trim() : null;
    };
    const productId = getField("product") || getField("productId") || getField("id");
    const amount = parseFloat(getField("amount") || getField("endStore") || getField("balance") || "0");
    if (productId) {
      items.push({ product_id: productId, amount });
    }
  }
  return items;
}

async function applyReimportMode(client: any, importedSyrveIds: string[], mode: string, stats: any) {
  // Default behavior: soft-deactivate (same as 'hide' or 'merge' with deactivation)
  // 'merge' mode: keep everything, just add new - but still deactivate non-matching
  // 'replace' mode: delete non-matching products
  const effectiveMode = mode === 'merge' ? 'hide' : mode;
  
  if (effectiveMode === 'fresh') return; // fresh mode already handled before import

  const BATCH = 100;
  let offset = 0;
  const idsToProcess: string[] = [];
  
  while (true) {
    const { data: batch } = await client.from("products")
      .select("id, syrve_product_id")
      .not("syrve_product_id", "is", null)
      .eq("is_active", true)
      .range(offset, offset + BATCH - 1);
    
    if (!batch || batch.length === 0) break;
    
    for (const p of batch) {
      if (!importedSyrveIds.includes(p.syrve_product_id)) {
        idsToProcess.push(p.id);
      }
    }
    
    offset += BATCH;
    if (batch.length < BATCH) break;
  }

  if (idsToProcess.length === 0) return;

  if (effectiveMode === 'hide') {
    // Soft deactivate - set is_active = false, preserve data
    for (let i = 0; i < idsToProcess.length; i += BATCH) {
      const chunk = idsToProcess.slice(i, i + BATCH);
      await client.from("products").update({ is_active: false }).in("id", chunk);
      stats.deactivated += chunk.length;
    }
    console.log(`Reimport mode (hide/merge): deactivated ${stats.deactivated} non-matching products`);
  } else if (effectiveMode === 'replace') {
    for (let i = 0; i < idsToProcess.length; i += BATCH) {
      const chunk = idsToProcess.slice(i, i + BATCH);
      await client.from("product_barcodes").delete().in("product_id", chunk);
      await client.from("products").delete().in("id", chunk);
      stats.deleted += chunk.length;
    }
    console.log(`Reimport mode (replace): deleted ${stats.deleted} non-matching products`);
  }
}

async function deleteAllProducts(client: any, stats: any) {
  await client.from("product_barcodes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { count } = await client.from("products").select("*", { count: "exact", head: true });
  await client.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  stats.deleted = (stats.deleted || 0) + (count || 0);
}

// ─── Wine Enrichment Engine ───

function parseWineName(rawName: string, syrveData: any): {
  name: string; volume_ml: number | null; vintage: number | null;
  available_by_glass: boolean; raw_source_name: string;
} {
  const result = {
    name: '', volume_ml: null as number | null, vintage: null as number | null,
    available_by_glass: false, raw_source_name: rawName,
  };

  let text = rawName;

  if (/by\s*glass|бокал|по\s*бокал/i.test(text)) {
    result.available_by_glass = true;
    text = text.replace(/\s*(by\s*glass|бокал\w*|по\s*бокал\w*)\s*/gi, ' ');
  }

  const volMatch = text.match(/\b(\d{1,2})[.,](\d{1,3})\s*(l|lt|ltr|л)?\b/i);
  if (volMatch) {
    const litres = parseFloat(`${volMatch[1]}.${volMatch[2]}`);
    result.volume_ml = Math.round(litres * 1000);
    text = text.replace(volMatch[0], ' ');
  } else {
    const mlMatch = text.match(/\b(\d{3,4})\s*(ml|мл)\b/i);
    if (mlMatch) {
      result.volume_ml = parseInt(mlMatch[1]);
      text = text.replace(mlMatch[0], ' ');
    }
  }

  if (!result.volume_ml && syrveData?.containers) {
    const containers = Array.isArray(syrveData.containers) ? syrveData.containers : [];
    for (const c of containers) {
      const cName = (c.name || '').toLowerCase();
      if ((cName.includes('btl') || cName.includes('bottle') || cName.includes('бут')) && c.count) {
        result.volume_ml = Math.round(parseFloat(c.count) * 1000);
        break;
      }
    }
    if (!result.volume_ml && syrveData.unitCapacity && parseFloat(syrveData.unitCapacity) !== 1.0) {
      result.volume_ml = Math.round(parseFloat(syrveData.unitCapacity) * 1000);
    }
  }

  const vintageMatch = text.match(/\b(19|20)\d{2}\b/);
  if (vintageMatch) {
    const yr = parseInt(vintageMatch[0]);
    if (yr >= 1900 && yr <= 2099) {
      result.vintage = yr;
      text = text.replace(vintageMatch[0], ' ');
    }
  } else {
    const shortMatch = text.match(/[''](\d{2})\b/);
    if (shortMatch) {
      const yy = parseInt(shortMatch[1]);
      result.vintage = yy >= 50 ? 1900 + yy : 2000 + yy;
      text = text.replace(shortMatch[0], ' ');
    }
  }

  text = text.replace(/\s+/g, ' ').trim();
  result.name = text.split(' ').map(w => {
    if (w.length <= 2) return w.toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');

  return result;
}

async function enrichWinesFromProducts(client: any, config: any, stats: any) {
  const wineCategoryIds: string[] = config.settings?.wine_category_ids || [];
  if (wineCategoryIds.length === 0) {
    console.log('Wine enrichment: no wine_category_ids configured, skipping');
    return;
  }

  const { data: wineCats } = await client.from("categories")
    .select("syrve_group_id")
    .in("id", wineCategoryIds);
  if (!wineCats || wineCats.length === 0) return;
  const wineSyrveGroupIds = new Set(wineCats.map((c: any) => c.syrve_group_id));

  const { data: wineProducts } = await client.from("products")
    .select("id, syrve_product_id, name, sku, code, sale_price, purchase_price, default_sale_price, unit_capacity, syrve_data, current_stock, category_id, is_by_glass, primary_barcode:product_barcodes(barcode)")
    .eq("is_active", true)
    .eq("is_deleted", false);

  if (!wineProducts || wineProducts.length === 0) return;

  const { data: allCats } = await client.from("categories").select("id, syrve_group_id");
  const catToSyrve = new Map((allCats || []).map((c: any) => [c.id, c.syrve_group_id]));

  const eligibleProducts = wineProducts.filter((p: any) =>
    p.category_id && wineSyrveGroupIds.has(catToSyrve.get(p.category_id))
  );

  if (eligibleProducts.length === 0) return;

  const productIds = eligibleProducts.map((p: any) => p.id);
  const { data: existingWines } = await client.from("wines")
    .select("id, product_id")
    .in("product_id", productIds);
  const linkedProductIds = new Set((existingWines || []).map((w: any) => w.product_id));

  let created = 0;
  let updated = 0;
  const BATCH = 50;

  const newWines: any[] = [];
  for (const product of eligibleProducts) {
    if (linkedProductIds.has(product.id)) continue;

    const parsed = parseWineName(product.name, product.syrve_data);
    const barcode = Array.isArray(product.primary_barcode) && product.primary_barcode.length > 0
      ? product.primary_barcode[0].barcode : null;

    newWines.push({
      name: parsed.name,
      raw_source_name: parsed.raw_source_name,
      product_id: product.id,
      syrve_product_id: product.syrve_product_id,
      enrichment_source: 'syrve_auto',
      enrichment_status: 'enriched',
      volume_ml: parsed.volume_ml || 750,
      vintage: parsed.vintage,
      available_by_glass: parsed.available_by_glass || product.is_by_glass || false,
      sale_price: product.sale_price || product.default_sale_price || null,
      purchase_price: product.purchase_price || null,
      sku: product.sku || product.code || null,
      primary_barcode: barcode,
      current_stock_unopened: Math.max(0, Math.floor(product.current_stock || 0)),
      current_stock_opened: 0,
      is_active: true,
      is_archived: false,
      internal_code: product.code || null,
    });
  }

  for (let i = 0; i < newWines.length; i += BATCH) {
    const { error } = await client.from("wines").insert(newWines.slice(i, i + BATCH));
    if (error) {
      console.error('Wine enrichment insert error:', error.message);
      for (const wine of newWines.slice(i, i + BATCH)) {
        const { error: singleErr } = await client.from("wines").insert(wine);
        if (!singleErr) created++;
        else console.error(`Failed to create wine for product ${wine.product_id}: ${singleErr.message}`);
      }
    } else {
      created += newWines.slice(i, i + BATCH).length;
    }
  }

  for (const product of eligibleProducts) {
    if (!linkedProductIds.has(product.id)) continue;
    const { error } = await client.from("wines").update({
      current_stock_unopened: Math.max(0, Math.floor(product.current_stock || 0)),
      sale_price: product.sale_price || product.default_sale_price || null,
      purchase_price: product.purchase_price || null,
    }).eq("product_id", product.id);
    if (!error) updated++;
  }

  stats.wines_created = created;
  stats.wines_updated = updated;
  console.log(`Wine enrichment: created ${created}, updated ${updated} from ${eligibleProducts.length} eligible products`);
}

// ─── AI Enrichment Engine ───

async function aiEnrichNewWines(client: any, stats: any) {
  const { data: unenriched } = await client.from("wines")
    .select("id, name, raw_source_name, producer, vintage, volume_ml")
    .eq("enrichment_source", "syrve_auto")
    .is("country", null)
    .eq("is_active", true)
    .limit(50);

  if (!unenriched || unenriched.length === 0) {
    console.log("AI enrichment: no unenriched wines found");
    return;
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    console.log("AI enrichment: LOVABLE_API_KEY not configured, skipping");
    return;
  }

  console.log(`AI enrichment: processing ${unenriched.length} wines`);

  const BATCH = 10;
  let totalTokens = 0;
  let enriched = 0;

  for (let i = 0; i < unenriched.length; i += BATCH) {
    const batch = unenriched.slice(i, i + BATCH);
    const wineList = batch.map((w: any, idx: number) =>
      `${idx + 1}. "${w.raw_source_name || w.name}"${w.vintage ? ` (${w.vintage})` : ''}${w.producer ? ` by ${w.producer}` : ''}`
    ).join("\n");

    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a wine expert. For each wine product name, determine:
- country: wine-producing country (e.g. "France", "Italy", "Portugal")
- region: wine region (e.g. "Bordeaux", "Tuscany", "Douro")
- sub_region: sub-region or appellation if identifiable
- grape_varieties: array of grape variety names (e.g. ["Cabernet Sauvignon", "Merlot"])
- wine_type: one of "red", "white", "rosé", "sparkling", "dessert", "fortified", "orange"
- producer: producer/winery name if identifiable from the product name
- appellation: official appellation (DOC, AOC, etc.) if identifiable

If you cannot determine a field with reasonable confidence, use null.
Respond ONLY with the JSON array, no markdown.`
            },
            {
              role: "user",
              content: `Analyze these wine product names and return a JSON array with one object per wine:\n\n${wineList}`
            }
          ],
          temperature: 0.1,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`AI enrichment API error ${response.status}: ${errText}`);
        if (response.status === 429 || response.status === 402) break;
        continue;
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || "";
      const usage = result.usage || {};
      totalTokens += (usage.total_tokens || usage.prompt_tokens || 0) + (usage.completion_tokens || 0);

      let parsed: any[];
      try {
        const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch (parseErr) {
        console.error("AI enrichment: failed to parse response:", content.substring(0, 200));
        continue;
      }

      for (let j = 0; j < batch.length && j < parsed.length; j++) {
        const wine = batch[j];
        const ai = parsed[j];
        if (!ai) continue;

        const updateData: any = {};
        if (ai.country) updateData.country = ai.country;
        if (ai.region) updateData.region = ai.region;
        if (ai.sub_region) updateData.sub_region = ai.sub_region;
        if (ai.appellation) updateData.appellation = ai.appellation;
        if (ai.wine_type) {
          const typeMap: Record<string, string> = {
            red: "Red", white: "White", "rosé": "Rosé",
            sparkling: "Sparkling", dessert: "Dessert",
            fortified: "Fortified", orange: "Orange",
          };
          updateData.body = typeMap[ai.wine_type.toLowerCase()] || ai.wine_type;
        }
        if (ai.grape_varieties && Array.isArray(ai.grape_varieties) && ai.grape_varieties.length > 0) {
          updateData.grape_varieties = ai.grape_varieties;
        }
        if (ai.producer && !wine.producer) {
          updateData.producer = ai.producer;
        }

        if (Object.keys(updateData).length > 0) {
          updateData.enrichment_status = "ai_enriched";
          const { error } = await client.from("wines").update(updateData).eq("id", wine.id);
          if (!error) enriched++;
          else console.error(`AI enrichment update failed for wine ${wine.id}: ${error.message}`);
        }
      }
    } catch (e) {
      console.error("AI enrichment batch error:", e);
    }
  }

  const estimatedCost = (totalTokens / 1_000_000) * 0.30;

  stats.ai_enriched = enriched;
  stats.ai_tokens_used = totalTokens;
  stats.ai_estimated_cost_usd = Math.round(estimatedCost * 10000) / 10000;
  console.log(`AI enrichment: enriched ${enriched}/${unenriched.length} wines, ${totalTokens} tokens (~$${estimatedCost.toFixed(4)})`);
}

function parseXmlItems(xml: string, tagName: string): any[] {
  const items: any[] = [];
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "g");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const item: any = {};
    const content = match[1];

    const barcodesMatch = content.match(/<barcodes>([\s\S]*?)<\/barcodes>/);
    if (barcodesMatch) {
      const barcodeItems: any[] = [];
      const bcRegex = /<barcodeContainer>([\s\S]*?)<\/barcodeContainer>/g;
      let bcMatch;
      while ((bcMatch = bcRegex.exec(barcodesMatch[1])) !== null) {
        const bcItem: any = {};
        const bcFieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
        let bcFieldMatch;
        while ((bcFieldMatch = bcFieldRegex.exec(bcMatch[1])) !== null) {
          bcItem[bcFieldMatch[1]] = bcFieldMatch[2];
        }
        barcodeItems.push(bcItem);
      }
      if (barcodeItems.length > 0) item.barcodes = barcodeItems;
    }

    const containersMatch = content.match(/<containers>([\s\S]*?)<\/containers>/);
    if (containersMatch) {
      const containerItems: any[] = [];
      const cRegex = /<container>([\s\S]*?)<\/container>/g;
      let cMatch;
      while ((cMatch = cRegex.exec(containersMatch[1])) !== null) {
        const cItem: any = {};
        const cFieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
        let cFieldMatch;
        while ((cFieldMatch = cFieldRegex.exec(cMatch[1])) !== null) {
          const val = cFieldMatch[2];
          if (val === "true") cItem[cFieldMatch[1]] = true;
          else if (val === "false") cItem[cFieldMatch[1]] = false;
          else if (!isNaN(Number(val)) && val !== "") cItem[cFieldMatch[1]] = Number(val);
          else cItem[cFieldMatch[1]] = val;
        }
        containerItems.push(cItem);
      }
      if (containerItems.length > 0) item.containers = containerItems;
    }

    const fieldRegex = /<(\w+)>([^<]*)<\/\1>/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(content)) !== null) {
      if (['barcodes', 'barcodeContainer', 'containers', 'container'].includes(fieldMatch[1])) continue;
      const val = fieldMatch[2];
      if (val === "true") item[fieldMatch[1]] = true;
      else if (val === "false") item[fieldMatch[1]] = false;
      else if (!isNaN(Number(val)) && val !== "") item[fieldMatch[1]] = Number(val);
      else item[fieldMatch[1]] = val;
    }
    items.push(item);
  }
  return items;
}
