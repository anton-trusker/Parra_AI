# Phase 6: Edge Functions

## Overview

Create Supabase Edge Functions for server-side operations requiring elevated privileges.

---

## Functions to Create

### 1. Create User Function

**File:** `supabase/functions/create-user/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller?.id)
      .single();

    if (callerRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, password, firstName, lastName, role } = await req.json();

    // Create user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: `${firstName} ${lastName}` },
    });

    if (createError) throw createError;

    // Update profile
    await supabaseAdmin.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
    }).eq("id", newUser.user.id);

    // Assign role
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: role || "staff",
    });

    return new Response(
      JSON.stringify({ user: newUser.user }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

### 2. Bulk Import Wines

**File:** `supabase/functions/bulk-import-wines/index.ts`

```typescript
serve(async (req) => {
  const { wines } = await req.json();
  
  const results = { success: 0, failed: 0, errors: [] };

  for (const wine of wines) {
    try {
      // Validate required fields
      if (!wine.name || !wine.sku) {
        throw new Error("Missing required fields");
      }

      // Check for duplicate SKU
      const { data: existing } = await supabaseAdmin
        .from("wines")
        .select("id")
        .eq("sku", wine.sku)
        .single();

      if (existing) {
        throw new Error(`Duplicate SKU: ${wine.sku}`);
      }

      // Insert wine
      await supabaseAdmin.from("wines").insert(wine);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({ sku: wine.sku, error: error.message });
    }
  }

  // Log import
  await supabaseAdmin.from("audit_logs").insert({
    action: "bulk_import",
    entity_type: "wines",
    description: `Imported ${results.success} wines, ${results.failed} failed`,
  });

  return new Response(JSON.stringify(results));
});
```

---

## Deployment

```bash
# Deploy function
supabase functions deploy create-user
supabase functions deploy bulk-import-wines

# Set secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

## Next Phase

→ [Phase 7: React Query Hooks](./phase-07-react-query-hooks.md)
