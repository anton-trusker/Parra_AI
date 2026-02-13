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

    // Create sync run
    const runType = sync_type || "bootstrap";
    const { data: syncRun } = await adminClient
      .from("syrve_sync_runs")
      .insert({ run_type: runType, status: "running", triggered_by: user.id })
      .select()
      .single();

    let syrveToken: string | null = null;
    const stats = { stores: 0, categories: 0, products: 0, barcodes: 0, skipped: 0, errors: 0, deactivated: 0, deleted: 0 };
    const selectedCategoryIds: string[] = config.selected_category_ids || [];
    const productTypeFilters: string[] = config.product_type_filters || ['GOODS', 'DISH'];
    const importInactive: boolean = config.import_inactive_products || false;
    const fieldMapping = config.field_mapping || { extract_vintage: true, extract_volume: true, auto_map_category: true };
    const reimportMode: string = config.reimport_mode || 'merge';

    try {
      // Normalize server_url: ensure it ends with /api
      let serverUrl = config.server_url.replace(/\/+$/, '');
      if (!serverUrl.endsWith('/api')) {
        serverUrl = serverUrl + '/api';
      }

      // 1. Login to Syrve
      const authStart = Date.now();
      const authUrl = `${serverUrl}/auth?login=${encodeURIComponent(config.api_login)}&pass=${config.api_password_hash}`;
      const authResp = await fetch(authUrl);
      if (!authResp.ok) throw new Error(`Syrve auth failed: ${authResp.status}`);
      syrveToken = (await authResp.text()).trim();

      await logApi(adminClient, syncRun?.id, "AUTH", "success", authUrl, undefined, Date.now() - authStart);

      // 2. Sync based on type
      if (runType === "bootstrap" || runType === "stores") {
        await syncStores(adminClient, serverUrl, syrveToken, syncRun?.id, stats);
      }

      if (runType === "bootstrap" || runType === "categories") {
        await syncCategories(adminClient, serverUrl, syrveToken, syncRun?.id, stats);
      }

      if (runType === "bootstrap" || runType === "products") {
        // Fresh mode: delete everything before importing
        if (reimportMode === 'fresh') {
          await deleteAllProducts(adminClient, stats);
        }

        const importedSyrveIds = await syncProducts(adminClient, serverUrl, syrveToken, syncRun?.id, stats, selectedCategoryIds, productTypeFilters, importInactive, fieldMapping);
        
        // Apply reimport mode for non-imported products (hide/replace)
        if ((reimportMode === 'hide' || reimportMode === 'replace') && importedSyrveIds && importedSyrveIds.length > 0) {
          await applyReimportMode(adminClient, importedSyrveIds, reimportMode, stats);
        }
      }

      // Update sync run as success
      await adminClient.from("syrve_sync_runs").update({
        status: "success",
        finished_at: new Date().toISOString(),
        stats,
      }).eq("id", syncRun?.id);

    } catch (syncError) {
      console.error("Sync error:", syncError);
      stats.errors++;
      await adminClient.from("syrve_sync_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: syncError instanceof Error ? syncError.message : "Unknown error",
        stats,
      }).eq("id", syncRun?.id);
      throw syncError;
    } finally {
      // Always logout and release lock
      if (syrveToken) {
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

async function syncCategories(client: any, baseUrl: string, token: string, syncRunId: string | null, stats: any) {
  const start = Date.now();
  const url = `${baseUrl}/v2/entities/products/group/list?includeDeleted=false&key=${token}`;
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

    await client.from("categories").upsert({
      syrve_group_id: syrveId,
      name: group.name || "Unknown",
      parent_syrve_id: group.parentId || group.parent || null,
      is_deleted: group.deleted || false,
      is_active: !(group.deleted || false),
      syrve_data: group,
      synced_at: new Date().toISOString(),
    }, { onConflict: "syrve_group_id" });

    stats.categories++;
  }

  // Resolve parent_id references
  const { data: allCats } = await client.from("categories").select("id, syrve_group_id, parent_syrve_id");
  if (allCats) {
    const lookup = new Map(allCats.map((c: any) => [c.syrve_group_id, c.id]));
    for (const cat of allCats) {
      if (cat.parent_syrve_id && lookup.has(cat.parent_syrve_id)) {
        await client.from("categories").update({ parent_id: lookup.get(cat.parent_syrve_id) }).eq("id", cat.id);
      }
    }
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

    productBatch.push({
      syrve_product_id: syrveId,
      category_id: categoryId || null,
      name: product.name || "Unknown",
      description: product.description || null,
      sku: product.num || null,
      code: product.code || null,
      product_type: product.type || product.productType || null,
      main_unit_id: product.mainUnit || null,
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

  return productSyrveIdOrder;
}

async function applyReimportMode(client: any, importedSyrveIds: string[], mode: string, stats: any) {
  const BATCH = 100;
  let offset = 0;
  const idsToProcess: string[] = [];
  
  while (true) {
    const { data: batch } = await client.from("products")
      .select("id, syrve_product_id")
      .not("syrve_product_id", "in", `(${importedSyrveIds.join(",")})`)
      .range(offset, offset + BATCH - 1);
    
    if (!batch || batch.length === 0) break;
    idsToProcess.push(...batch.map((p: any) => p.id));
    offset += BATCH;
    if (batch.length < BATCH) break;
  }

  if (idsToProcess.length === 0) return;

  if (mode === 'hide') {
    for (let i = 0; i < idsToProcess.length; i += BATCH) {
      const chunk = idsToProcess.slice(i, i + BATCH);
      await client.from("products").update({ is_active: false }).in("id", chunk);
      stats.deactivated += chunk.length;
    }
  } else if (mode === 'replace') {
    for (let i = 0; i < idsToProcess.length; i += BATCH) {
      const chunk = idsToProcess.slice(i, i + BATCH);
      await client.from("product_barcodes").delete().in("product_id", chunk);
      await client.from("products").delete().in("id", chunk);
      stats.deleted += chunk.length;
    }
  }
}

async function deleteAllProducts(client: any, stats: any) {
  // Delete all barcodes first, then all products
  await client.from("product_barcodes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { count } = await client.from("products").select("*", { count: "exact", head: true });
  await client.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  stats.deleted = (stats.deleted || 0) + (count || 0);
}

function parseXmlItems(xml: string, tagName: string): any[] {
  const items: any[] = [];
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "g");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const item: any = {};
    const content = match[1];

    // Parse nested barcodes
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

    // Parse nested containers
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

    // Parse simple fields
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
