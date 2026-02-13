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
    const stats = { stores: 0, categories: 0, products: 0, barcodes: 0, skipped: 0, errors: 0 };
    const selectedCategoryIds: string[] = config.selected_category_ids || [];

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
        await syncProducts(adminClient, serverUrl, syrveToken, syncRun?.id, stats, selectedCategoryIds);
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
  stats: any, selectedCategoryIds: string[]
) {
  const start = Date.now();
  const url = `${baseUrl}/v2/entities/products/list?includeDeleted=false&key=${token}`;
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

  for (const product of products) {
    const syrveId = product.id;
    if (!syrveId) continue;

    const parentGroupId = product.parent || product.parentId;

    // Category filtering: skip products not in selected categories
    if (selectedSyrveIds && parentGroupId && !selectedSyrveIds.has(parentGroupId)) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    const payloadHash = await sha1(JSON.stringify(product));

    const { data: existing } = await client.from("syrve_raw_objects")
      .select("payload_hash")
      .eq("entity_type", "product")
      .eq("syrve_id", syrveId)
      .maybeSingle();

    if (existing?.payload_hash === payloadHash) {
      stats.skipped = (stats.skipped || 0) + 1;
      continue;
    }

    await client.from("syrve_raw_objects").upsert({
      entity_type: "product",
      syrve_id: syrveId,
      payload: product,
      payload_hash: payloadHash,
      synced_at: new Date().toISOString(),
    }, { onConflict: "entity_type,syrve_id" });

    const categoryId = parentGroupId ? catLookup.get(parentGroupId) : null;

    // Extract vintage from name if present
    const vintageMatch = product.name?.match(/(19|20)\d{2}/);
    const vintage = vintageMatch ? parseInt(vintageMatch[0]) : null;

    // Extract container data for unit_capacity
    let unitCapacity = product.unitCapacity || null;
    const containers = product.containers || [];
    if (Array.isArray(containers) && containers.length > 0 && !unitCapacity) {
      const firstContainer = containers[0];
      if (firstContainer.count) {
        unitCapacity = parseFloat(firstContainer.count);
      }
    }

    // Build metadata with productCategory and cookingPlaceType
    const metadata: any = {
      vintage,
      extracted_at: new Date().toISOString(),
    };
    if (product.productCategory) metadata.productCategory = product.productCategory;
    if (product.cookingPlaceType) metadata.cookingPlaceType = product.cookingPlaceType;

    // Include container data in syrve_data
    const syrveData = { ...product };
    if (containers.length > 0) {
      syrveData.containers = containers;
    }

    const { data: upserted } = await client.from("products").upsert({
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
    }, { onConflict: "syrve_product_id" }).select("id").single();

    stats.products++;

    // Sync barcodes
    if (upserted && product.barcodes) {
      const barcodes = Array.isArray(product.barcodes) ? product.barcodes : [product.barcodes];
      for (const bc of barcodes) {
        const barcodeValue = bc.barcode || bc.barcodeContainer?.barcode || (typeof bc === "string" ? bc : null);
        if (!barcodeValue) continue;

        await client.from("product_barcodes").upsert({
          product_id: upserted.id,
          barcode: barcodeValue,
          container_name: bc.containerName || bc.barcodeContainer?.containerName || null,
          source: "syrve",
          is_primary: stats.barcodes === 0,
        }, { onConflict: "barcode" }).catch(() => { /* ignore duplicate */ });

        stats.barcodes++;
      }
    }
  }
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
