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
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

    const { server_url: rawServerUrl, api_login, api_password } = await req.json();
    if (!rawServerUrl || !api_login || !api_password) {
      return new Response(JSON.stringify({ error: "server_url, api_login, and api_password are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize server_url: ensure it ends with /api
    let server_url = rawServerUrl.replace(/\/+$/, '');
    if (!server_url.endsWith('/api')) {
      server_url = server_url + '/api';
    }

    // 1. Compute SHA1 hash of password
    const passHash = await sha1(api_password);

    // 2. Authenticate with Syrve
    const authUrl = `${server_url}/auth?login=${encodeURIComponent(api_login)}&pass=${passHash}`;
    const authResp = await fetch(authUrl);
    if (!authResp.ok) {
      const errText = await authResp.text();
      return new Response(JSON.stringify({ 
        error: "Syrve authentication failed", 
        details: errText,
        status_code: authResp.status 
      }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const syrveToken = (await authResp.text()).trim();
    if (!syrveToken || syrveToken.length < 10) {
      return new Response(JSON.stringify({ error: "Invalid token received from Syrve" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Fetch server version
    let serverVersion = "unknown";
    try {
      const versionResp = await fetch(`${server_url}/version?key=${syrveToken}`);
      if (versionResp.ok) {
        serverVersion = (await versionResp.text()).trim();
      }
    } catch { /* ignore */ }

    // 4. Fetch stores list
    let stores: any[] = [];
    try {
      const storesUrl = `${server_url}/corporation/stores?key=${syrveToken}`;
      const storesResp = await fetch(storesUrl);
      if (storesResp.ok) {
        const storesText = await storesResp.text();
        stores = parseStoresXml(storesText);
      }
    } catch (e) {
      console.error("Error fetching stores:", e);
    }

    // 5. Fetch departments and extract business info
    let departments: any[] = [];
    let businessInfo: any = null;
    try {
      const deptUrl = `${server_url}/corporation/departments?key=${syrveToken}`;
      const deptResp = await fetch(deptUrl);
      if (deptResp.ok) {
        const deptText = await deptResp.text();
        departments = parseStoresXml(deptText);
        businessInfo = parseDepartmentDetails(deptText);
      }
    } catch (e) {
      console.error("Error fetching departments:", e);
    }

    // 5b. Fetch measurement units
    let measurementUnits: any[] = [];
    try {
      const unitsUrl = `${server_url}/v2/entities/list?key=${syrveToken}&rootType=MeasureUnit`;
      const unitsResp = await fetch(unitsUrl);
      if (unitsResp.ok) {
        const unitsText = await unitsResp.text();
        try {
          measurementUnits = JSON.parse(unitsText);
          if (!Array.isArray(measurementUnits)) measurementUnits = [measurementUnits];
        } catch {
          measurementUnits = parseXmlItems(unitsText, "unitDto");
        }
      }
    } catch (e) {
      console.error("Error fetching measurement units:", e);
    }

    // Save measurement units to DB
    if (measurementUnits.length > 0) {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      for (const unit of measurementUnits) {
        const syrveId = unit.id;
        if (!syrveId) continue;
        await adminClient.from("measurement_units").upsert({
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
      }

      // Resolve main_unit_id references
      const { data: allUnits } = await adminClient.from("measurement_units").select("id, syrve_unit_id, main_unit_syrve_id");
      if (allUnits) {
        const lookup = new Map(allUnits.map((u: any) => [u.syrve_unit_id, u.id]));
        for (const u of allUnits) {
          if (u.main_unit_syrve_id && lookup.has(u.main_unit_syrve_id)) {
            await adminClient.from("measurement_units").update({ main_unit_id: lookup.get(u.main_unit_syrve_id) }).eq("id", u.id);
          }
        }
      }
    }

    // 6. Always logout to release license
    try {
      await fetch(`${server_url}/logout?key=${syrveToken}`);
    } catch (e) {
      console.error("Logout error:", e);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful",
      password_hash: passHash,
      server_version: serverVersion,
      stores,
      departments,
      business_info: businessInfo,
      measurement_units: measurementUnits.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("syrve-connect-test error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseStoresXml(xml: string): any[] {
  const stores: any[] = [];
  const itemRegex = /<corporateItemDto>([\s\S]*?)<\/corporateItemDto>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const getId = (tag: string) => {
      const m = item.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
      return m ? m[1] : null;
    };
    stores.push({
      id: getId("id"),
      name: getId("name"),
      code: getId("code"),
      type: getId("type"),
    });
  }
  return stores;
}

function parseXmlItems(xml: string, tagName: string): any[] {
  const items: any[] = [];
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "g");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const item = match[1];
    const obj: any = {};
    const fieldRegex = /<([a-zA-Z]+)>([^<]*)<\/\1>/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(item)) !== null) {
      obj[fieldMatch[1]] = fieldMatch[2];
    }
    if (Object.keys(obj).length > 0) items.push(obj);
  }
  return items;
}

/**
 * Parse department XML to extract business/legal entity information.
 * Looks for JURPERSON type items with jurPersonAdditionalPropertiesDto,
 * and DEPARTMENT type items with taxpayerIdNumber.
 */
function parseDepartmentDetails(xml: string): any {
  const result: any = {
    legal_name: null,
    business_name: null,
    taxpayer_id: null,
    registration_number: null,
    address: null,
    country: null,
    region: null,
    city: null,
    street: null,
    house: null,
    zip_code: null,
  };

  const getTag = (content: string, tag: string): string | null => {
    const m = content.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
    return m ? m[1].trim() : null;
  };

  const itemRegex = /<corporateItemDto>([\s\S]*?)<\/corporateItemDto>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const itemType = getTag(item, "type");

    // Extract taxpayerIdNumber from DEPARTMENT type
    if (itemType === "DEPARTMENT") {
      const tid = getTag(item, "taxpayerIdNumber");
      if (tid && !result.taxpayer_id) {
        result.taxpayer_id = tid;
      }
      // Use department name as business_name if not set
      const deptName = getTag(item, "name");
      if (deptName && !result.business_name) {
        result.business_name = deptName;
      }
    }

    // Extract rich legal data from JURPERSON type
    if (itemType === "JURPERSON") {
      const jurName = getTag(item, "name");
      if (jurName) result.legal_name = jurName;

      // Parse jurPersonAdditionalPropertiesDto block
      const jurBlock = item.match(/<jurPersonAdditionalPropertiesDto>([\s\S]*?)<\/jurPersonAdditionalPropertiesDto>/);
      if (jurBlock) {
        const jur = jurBlock[1];
        const jurTaxpayer = getTag(jur, "taxpayerId");
        if (jurTaxpayer) result.taxpayer_id = jurTaxpayer;

        const jurAddress = getTag(jur, "address");
        if (jurAddress) result.address = jurAddress;

        const jurRegNum = getTag(jur, "registrationNumber");
        if (jurRegNum) result.registration_number = jurRegNum;

        // Parse legalAddressDto
        const addrBlock = jur.match(/<legalAddressDto>([\s\S]*?)<\/legalAddressDto>/);
        if (addrBlock) {
          const addr = addrBlock[1];
          result.zip_code = getTag(addr, "zipCode") || result.zip_code;
          result.country = getTag(addr, "country") || result.country;
          result.region = getTag(addr, "region") || result.region;
          result.city = getTag(addr, "city") || result.city;
          result.street = getTag(addr, "street") || result.street;
          result.house = getTag(addr, "house") || result.house;
        }
      }
    }
  }

  // Build composite address if components exist but address is empty
  if (!result.address && (result.street || result.house)) {
    const parts = [result.street, result.house].filter(Boolean);
    result.address = parts.join(', ');
  }

  // Check if we found any useful data
  const hasData = Object.values(result).some(v => v !== null);
  return hasData ? result : null;
}
