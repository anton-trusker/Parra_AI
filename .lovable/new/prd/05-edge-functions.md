# 05 — Edge Functions Reference

**Complete Supabase Edge Functions Specification**

This document defines all Edge Functions (Deno/TypeScript) for the Wine Inventory Platform.

---

## Table of Contents

1. [Edge Functions Overview](#edge-functions-overview)
2. [Authentication Functions](#authentication-functions)
3. [Syrve Integration Functions](#syrve-integration-functions)
4. [Inventory Functions](#inventory-functions)
5. [AI Recognition Functions](#ai-recognition-functions)
6. [Admin Functions](#admin-functions)
7. [Common Patterns](#common-patterns)

---

## Edge Functions Overview

### **Purpose**

Edge Functions handle:
- **External API calls** (Syrve, AI providers)
- **Complex business logic** (inventory aggregation, permission checks)
- **Sensitive operations** (credential encryption, Syrve authentication)
- **Custom authentication** (username/password login)

### **Technology**

- **Runtime**: Deno (V8-based)
- **Language**: TypeScript
- **Deployment**: `supabase functions deploy <function-name>`
- **Invocation**: `POST /functions/v1/<function-name>`

### **Function Naming Convention**

**Canonical names** (kebab-case):
- `auth-login-username`
- `syrve-connect-test`
- `syrve-bootstrap-sync`
- `inventory-load-baseline`
- `ai-scan`

### **Common Headers**

```typescript
// All functions require authentication except public ones
const headers = {
  'Authorization': `Bearer ${userJWT}`,
  'Content-Type': 'application/json'
};
```

### **Error Response Format**

```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "Session not found",
    "details": {}
  }
}
```

---

## Authentication Functions

### **`auth-login-username`**

**Purpose**: Username/password login via synthetic email pattern

**Endpoint**: `POST /functions/v1/auth-login-username`

**Request**:
```json
{
  "username": "staff1",
  "password": "secure-password"
}
```

**Implementation**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { username, password } = await req.json();
  
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Missing credentials' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Convert to synthetic email
  const syntheticEmail = `${username.toLowerCase()}@inventory.local`;
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: password
  });
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Fetch user profile and roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, user_roles(role:roles(*))')
    .eq('id', data.user.id)
    .single();
  
  return new Response(JSON.stringify({
    session: data.session,
    user: data.user,
    profile: profile
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Response**:
```json
{
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token",
    "expires_in": 3600
  },
  "user": {
    "id": "uuid",
    "email": "staff1@inventory.local"
  },
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "login_name": "staff1",
    "user_roles": [...]
  }
}
```

---

## Syrve Integration Functions

### **`syrve-connect-test`**

**Purpose**: Test Syrve credentials without saving

**Endpoint**: `POST /functions/v1/syrve-connect-test`

**Request**:
```json
{
  "server_url": "http://192.168.1.100:8080",
  "login": "api_user",
  "password": "plain_password"
}
```

**Implementation**:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createHash } from 'https://deno.land/std@0.168.0/hash/mod.ts';

async function loginToSyrve(baseUrl: string, login: string, password: string) {
  const passwordHash = createHash('sha1').update(password).toString();
  
  const response = await fetch(`${baseUrl}/resto/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, password_hash: passwordHash })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }
  
  return await response.json();
}

async function logoutFromSyrve(baseUrl: string, sessionKey: string) {
  await fetch(`${baseUrl}/resto/api/auth/logout?key=${sessionKey}`, {
    method: 'POST'
  });
}

serve(async (req) => {
  const { server_url, login, password } = await req.json();
  
  try {
    const loginData = await loginToSyrve(server_url, login, password);
    
    // Fetch stores to verify connection
    const storesResponse = await fetch(
      `${server_url}/resto/api/corporation/stores?key=${loginData.sessionKey}`
    );
    const stores = await storesResponse.json();
    
    await logoutFromSyrve(server_url, loginData.sessionKey);
    
    return new Response(JSON.stringify({
      success: true,
      server_version: loginData.serverVersion,
      stores: stores.corporateItemDtoes || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

**Response**:
```json
{
  "success": true,
  "server_version": "7.8.2",
  "stores": [
    {
      "id": "uuid",
      "name": "Main Restaurant"
    }
  ]
}
```

### **`syrve-save-config`**

**Purpose**: Encrypt and save Syrve configuration

**Request**:
```json
{
  "server_url": "http://192.168.1.100:8080",
  "login": "api_user",
  "password": "plain_password",
  "default_store_id": "uuid"
}
```

**Implementation**: Encrypts password using Supabase Vault, upserts singleton `syrve_config` row.

### **`syrve-bootstrap-sync`**

**Purpose**: Initial full catalog sync from Syrve

**Request**:
```json
{
  "include_categories": true,
  "include_products": true
}
```

**Workflow**:
1. Create `syrve_sync_runs` record (type='bootstrap', status='processing')
2. Login to Syrve
3. Fetch all entities (departments, stores, product groups, products)
4. Insert into `syrve_raw_objects` with payload hash
5. Parse and upsert canonical tables
6. Logout from Syrve
7. Update sync_runs (status='success', stats)

**Response**:
```json
{
  "sync_run_id": "uuid",
  "stats": {
    "stores_synced": 3,
    "categories_synced": 45,
    "products_synced": 523,
    "duration_ms": 12500
  }
}
```

### **`syrve-sync-products`**

**Purpose**: Incremental product catalog sync

**Request**:
```json
{
  "force_full_sync": false
}
```

**Workflow**:
1. Login to Syrve
2. Fetch `/products` endpoint
3. Compare with `products.synced_at`
4. Upsert changes to `syrve_raw_objects` and `products`
5. Update `syrve_sync_runs`

### **`syrve-stock-snapshot`**

**Purpose**: Capture current Syrve stock levels for variance analysis.
**Trigger**: Called by `inventory-load-baseline`.

**Request**:
```json
{
  "store_id": "uuid",
  "session_id": "uuid" (optional)
}
```

**Implementation**:
```typescript
serve(async (req) => {
  const { store_id, session_id } = await req.json();
  // ... auth check ...

  // 1. Fetch stock from Syrve /stock-and-sales
  const stockData = await syrveApi.getStock(store_id);

  // 2. Store raw response
  await supabase.from('syrve_raw_objects').insert({
    entity_type: 'stock_snapshot',
    payload: stockData
  });

  // 3. Update inventory baseline if session provided
  if (session_id) {
    await updateBaseline(session_id, stockData);
  }
});
```

### **`syrve-process-outbox`**

**Purpose**: Background processor for pending outbox jobs

**Trigger**: Cron (every 5 minutes) or manual

**Workflow**:
```typescript
serve(async (req) => {
  const supabase = createClient(...);
  
  // Get next pending job with row-level lock
  const { data: job } = await supabase
    .from('syrve_outbox_jobs')
    .select('*')
    .eq('status', 'pending')
    .lt('attempts', 5)
    .order('created_at')
    .limit(1)
    .single();
  
  if (!job) {
    return new Response(JSON.stringify({ message: 'No pending jobs' }));
  }
  
  // Mark processing
  await supabase
    .from('syrve_outbox_jobs')
    .update({ status: 'processing' })
    .eq('id', job.id);
  
  try {
    // Login to Syrve
    const syrveSession = await loginToSyrve(...);
    
    // Submit inventory XML
    const response = await fetch(
      `${syrveConfig.server_url}/resto/api/v2/documents/import/inventory?key=${syrveSession.sessionKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: job.payload_xml
      }
    );
    
    const result = await response.json();
    
    await logoutFromSyrve(...);
    
    // Mark success
    await supabase
      .from('syrve_outbox_jobs')
      .update({
        status: 'success',
        response_xml: JSON.stringify(result)
      })
      .eq('id', job.id);
    
    // Update inventory session
    await supabase
      .from('inventory_sessions')
      .update({
        status: 'synced',
        syrve_document_id: result.documentId,
        syrve_synced_at: new Date().toISOString()
      })
      .eq('id', job.session_id);
    
    return new Response(JSON.stringify({ success: true, job_id: job.id }));
  } catch (error) {
    // Mark failed, increment attempts
    await supabase
      .from('syrve_outbox_jobs')
      .update({
        status: 'pending', // Retry
        attempts: job.attempts + 1,
        last_error: error.message,
        last_attempt_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      will_retry: job.attempts < 4
    }), { status: 500 });
  }
});
```

---

## Inventory Functions

### **`inventory-create-session`**

**Purpose**: Create new inventory session

**Request**:
```json
{
  "store_id": "uuid",
  "title": "Weekly Count - Feb 13",
  "comment": "Full cellar inventory"
}
```

**Response**:
```json
{
  "session_id": "uuid"
}
```

### **`inventory-load-baseline`**

**Purpose**: Load expected stock from Syrve into baseline

**Request**:
```json
{
  "session_id": "uuid"
}
```

**Workflow**:
1. Validate session (status='draft')
2. Login to Syrve
3. Fetch `/stock-and-sales` for session's store
4. Insert `inventory_baseline_items` rows
5. Update session (status='in_progress', baseline_taken_at)
6. Logout

**Response**:
```json
{
  "baseline_loaded": true,
  "products_count": 234,
  "session_status": "in_progress"
}
```

### **`inventory-submit-to-syrve`**

**Purpose**: Create outbox job for approved session

**Request**:
```json
{
  "session_id": "uuid"
}
```

**Workflow**:
1. Validate session (status='approved')
2. Aggregate totals from `inventory_product_aggregates`
3. Build XML payload
4. Compute payload_hash
5. Insert `syrve_outbox_jobs` (status='pending')

**Response**:
```json
{
  "outbox_job_id": "uuid",
  "status": "queued",
  "message": "Inventory queued for submission to Syrve"
}
```

---

## AI Recognition Functions

### **`ai-scan`**

**Purpose**: Full AI label recognition pipeline

**Request**:
```json
{
  "session_id": "uuid",
  "image_path": "ai-scans/uuid/label.jpg"
}
```

**Workflow**:
```typescript
serve(async (req) => {
  const { session_id, image_path } = await req.json();
  const supabase = createClient(...);
  
  // 1. Create media asset
  const { data: asset } = await supabase
    .from('media_assets')
    .insert({
      bucket: 'ai-scans',
      path: image_path,
      created_by: req.headers.get('user-id')
    })
    .select()
    .single();
  
  // 2. Create AI run
  const { data: aiRun } = await supabase
    .from('ai_runs')
    .insert({
      run_type: 'label_recognition',
      status: 'running',
      input_asset_id: asset.id
    })
    .select()
    .single();
  
  try {
    // 3. Download image from storage
    const { data: imageBlob } = await supabase.storage
      .from('ai-scans')
      .download(image_path);
    
    // 4. OCR (Google Cloud Vision)
    const ocrResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${Deno.env.get('GOOGLE_VISION_API_KEY')}`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [{
            image: { content: await imageToBase64(imageBlob) },
            features: [{ type: 'TEXT_DETECTION' }]
          }]
        })
      }
    );
    const ocrData = await ocrResponse.json();
    const extractedText = ocrData.responses[0].fullTextAnnotation?.text || '';
    
    // 5. Generate embedding (OpenAI)
    const embeddingResponse = await fetch(
      'https://api.openai.com/v1/embeddings',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: extractedText,
          model: 'text-embedding-3-small'
        })
      }
    );
    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    
    // 6. Vector similarity search
    const { data: candidates } = await supabase.rpc('vector_search_products', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: 10
    });
    
    // 7. Vision verification (Gemini)
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${Deno.env.get('GEMINI_API_KEY')}`,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Which of these wine bottles matches the image? Candidates: ${JSON.stringify(candidates)}` },
              { inline_data: { mime_type: 'image/jpeg', data: await imageToBase64(imageBlob) } }
            ]
          }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      }
    );
    const geminiData = await geminiResponse.json();
    const topMatch = JSON.parse(geminiData.candidates[0].content.parts[0].text);
    
    // 8. Update AI run
    await supabase
      .from('ai_runs')
      .update({
        status: 'succeeded',
        confidence: topMatch.confidence,
        result: {
          ocr_text: extractedText,
          top_match: topMatch,
          candidates: candidates
        }
      })
      .eq('id', aiRun.id);
    
    // 9. Insert match candidates
    await supabase
      .from('ai_match_candidates')
      .insert(
        candidates.map((c, idx) => ({
          ai_run_id: aiRun.id,
          product_id: c.product_id,
          score: c.similarity,
          rank: idx + 1
        }))
      );
    
    return new Response(JSON.stringify({
      run_id: aiRun.id,
      top_match: topMatch,
      candidates: candidates,
      ocr_text: extractedText
    }));
  } catch (error) {
    await supabase
      .from('ai_runs')
      .update({ status: 'failed', result: { error: error.message } })
      .eq('id', aiRun.id);
    
    throw error;
  }
});
```

**Response**:
```json
{
  "run_id": "uuid",
  "top_match": {
    "product_id": "uuid",
    "confidence": 0.95,
    "name": "Château Margaux 2015"
  },
  "candidates": [...],
  "ocr_text": "Château Margaux\n2015\nMargaux..."
}
```

---

## Admin Functions

### **`admin-create-user`**

**Purpose**: Create user with synthetic email

**Request**:
```json
{
  "login_name": "staff2",
  "full_name": "Jane Smith",
  "password": "secure-password",
  "role_ids": ["staff-role-uuid"]
}
```

**Workflow**:
1. Validate requester has `users.manage` permission
2. Create auth user with synthetic email
3. Create profile record
4. Assign roles via `user_roles`

### **`admin-reindex-products`**

**Purpose**: Regenerate pgvector embeddings for all products

**Request**:
```json
{
  "batch_size": 50
}
```

**Workflow**: Fetch products in batches, generate embeddings, update `product_search_index`.

---

---

## Security Patterns

### **Standardized Auth Validation Template**

All Edge Functions should validate authentication and permissions:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ValidationConfig {
  requireAuth?: boolean;
  requiredModule?: string;
  requiredAction?: string;
  requiredLevel?: 'view' | 'edit' | 'full';
}

async function validateCallerPermissions(
  req: Request,
  config: ValidationConfig = {}
): Promise<{
  supabase: SupabaseClient;
  userId: string;
  profile: any;
  hasPermission: boolean;
}> {
  const {
    requireAuth = true,
    requiredModule,
    requiredAction,
    requiredLevel = 'edit'
  } = config;

  // Extract JWT from Authorization header
  const authHeader = req.headers.get('Authorization');
  if (requireAuth && !authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader! }
      }
    }
  );

  // Verify JWT and get user
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }

  // Fetch profile with roles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`
      *,
      user_roles!inner(
        role:roles(*)
      )
    `)
    .eq('id', user.id)
    .eq('is_active', true)
    .single();

  if (profileError || !profile) {
    throw new Error('User profile not found or inactive');
  }

  // Check permission if required
  let hasPermission = true;
  if (requiredModule && requiredAction) {
    hasPermission = await checkUserPermission(
      profile.user_roles,
      requiredModule,
      requiredAction,
      requiredLevel
    );
  }

  return {
    supabase,
    userId: user.id,
    profile,
    hasPermission
  };
}

function checkUserPermission(
  userRoles: any[],
  module: string,
  action: string,
  requiredLevel: string
): boolean {
  const levels = { 'none': 0, 'view': 1, 'edit': 2, 'full': 3 };
  const required = levels[requiredLevel] || 0;

  for (const ur of userRoles) {
    const role = ur.role;
    
    // Super admin bypass
    if (role.is_super_admin) return true;

    // Check wildcard
    if (role.permissions['*'] === 'full') return true;

    // Check specific permission
    const permKey = `${module}.${action}`;
    const permLevel = role.permissions[permKey] || role.permissions[module] || 'none';
    const current = levels[permLevel] || 0;

    if (current >= required) return true;
  }

  return false;
}

// Usage in Edge Functions:
serve(async (req) => {
  try {
    const { supabase, userId, hasPermission } = await validateCallerPermissions(req, {
      requiredModule: 'inventory',
      requiredAction: 'submit',
      requiredLevel: 'full'
    });

    if (!hasPermission) {
      return new Response(JSON.stringify({
        error: 'Insufficient permissions'
      }), { status: 403 });
    }

    // ... function logic
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 401 });
  }
});
```

### **Rate Limiting for AI Functions**

Prevent abuse of expensive AI endpoints:

```typescript
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const { maxRequests, windowMs, keyPrefix } = config;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Count requests in window
  const { count } = await supabase
    .from('ai_runs')
    .select('*', { count: 'exact',  head: true })
    .eq('created_by', userId)
    .gte('created_at', windowStart.toISOString());

  const remaining = Math.max(0, maxRequests - (count || 0));
  const resetAt = new Date(now.getTime() + windowMs);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt
  };
}

// Usage:
serve(async (req) => {
  const { supabase, userId } = await validateCallerPermissions(req);

  const rateLimit = await checkRateLimit(supabase, userId, {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    keyPrefix: 'ai-scan'
  });

  if (!rateLimit.allowed) {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      resetAt: rateLimit.resetAt
    }), { 
      status: 429,
      headers: { 'Retry-After': String(Math.ceil(rateLimit.resetAt.getTime() / 1000)) }
    });
  }

  // ... AI function logic
});
```

### **Audit Logging for Sensitive Operations**

Log critical operations for compliance and debugging:

```typescript
async function auditLog(
  supabase: SupabaseClient,
  event: {
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: any;
    ip_address?: string;
  }
): Promise<void> {
  await supabase
    .from('audit_logs')  // Create this table if needed
    .insert({
      actor_id: event.actor_id,
      action: event.action,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      metadata: event.metadata || {},
      ip_address: event.ip_address,
      created_at: new Date().toISOString()
    });
}

// Usage:
serve(async (req) => {
  const { supabase, userId } = await validateCallerPermissions(req, {
    requiredModule: 'users',
    requiredAction: 'manage',
    requiredLevel: 'full'
  });

  const { login_name } = await req.json();

  // Create user...
  const newUser = await createAuthUser(...);

  // Audit log
  await auditLog(supabase, {
    actor_id: userId,
    action: 'user.create',
    resource_type: 'user',
    resource_id: newUser.id,
    metadata: { login_name },
    ip_address: req.headers.get('x-forwarded-for') || 'unknown'
  });

  // ...
});
```

### **Exponential Backoff Retry Logic**

Robust retry strategy for external API calls:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxAttempts) {
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt - 1),
          maxDelayMs
        );

        if (onRetry) {
          onRetry(attempt, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage in Syrve sync:
serve(async (req) => {
  const syrveClient = new SyrveClient(...);

  const products = await retryWithBackoff(
    async () => {
      await syrveClient.login();
      const data = await syrveClient.fetchProducts();
      await syrveClient.logout();
      return data;
    },
    {
      maxAttempts: 3,
      baseDelayMs: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt}: ${error.message}`);
      }
    }
  );

  // ...
});
```

### **Secure Credential Handling**

Always use environment variables, never hardcode secrets:

```typescript
// ✅ CORRECT: Use Supabase Secrets
const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SYRVE_API_PASSWORD = Deno.env.get('SYRVE_API_PASSWORD_ENCRYPTED');

if (!GOOGLE_VISION_API_KEY) {
  throw new Error('Missing GOOGLE_VISION_API_KEY secret');
}

// ❌ WRONG: Never hardcode
const API_KEY = 'sk-proj-abc123...'; // NEVER DO THIS
```

Set secrets via Supabase CLI:
```bash
supabase secrets set GOOGLE_VISION_API_KEY=your-key-here
supabase secrets set OPENAI_API_KEY=sk-proj-...
supabase secrets set GEMINI_API_KEY=AIza...
```

---

## Common Patterns

### **Permission Checking**

```typescript
async function checkPermission(
  supabase: SupabaseClient,
  userId: string,
  module: string,
  action: string,
  requiredLevel: string
): Promise<boolean> {
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('role:roles(*)')
    .eq('user_id', userId);
  
  for (const ur of userRoles) {
    if (ur.role.is_super_admin) return true;
    
    const permKey = `${module}.${action}`;
    const permLevel = ur.role.permissions[permKey];
    
    if (checkLevel(permLevel, requiredLevel)) {
      return true;
    }
  }
  
  return false;
}
```

### **Syrve Session Management**

```typescript
class SyrveClient {
  private sessionKey?: string;
  
  async login() {
    const hash = createHash('sha1').update(this.password).toString();
    const response = await fetch(`${this.baseUrl}/resto/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ login: this.login, password_hash: hash })
    });
    const data = await response.json();
    this.sessionKey = data.sessionKey;
  }
  
  async logout() {
    if (this.sessionKey) {
      await fetch(`${this.baseUrl}/resto/api/auth/logout?key=${this.sessionKey}`, {
        method: 'POST'
      });
      this.sessionKey = undefined;
    }
  }
  
  async withSession<T>(fn: () => Promise<T>): Promise<T> {
    try {
      await this.login();
      return await fn();
    } finally {
      await this.logout();
    }
  }
}
```

---

## Next Steps

- Review [06-ai-recognition.md](06-ai-recognition.md) for AI pipeline details
- Study [07-inventory-management.md](07-inventory-management.md) for inventory workflow
- Examine [08-deployment-guide.md](08-deployment-guide.md) for function deployment
