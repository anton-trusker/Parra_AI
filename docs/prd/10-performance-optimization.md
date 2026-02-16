# 10 — Performance Optimization

**Backend Performance Best Practices**

This document consolidates all performance optimization strategies for the Wine Inventory Platform backend.

This is a **single-tenant deployment** - all optimizations assume one business per Supabase project (no `business_id` filtering).

---

## Table of Contents

1. [Database Optimization](#database-optimization)
2. [Edge Function Optimization](#edge-function-optimization)
3. [AI Pipeline Optimization](#ai-pipeline-optimization)
4. [Deployment Best Practices](#deployment-best-practices)

---

## Database Optimization

### **Materialized Views**

Pre-computed aggregates for fast dashboard queries.

#### **Inventory Session Summary**

```sql
CREATE MATERIALIZED VIEW inventory_session_summary AS
SELECT 
    s.id AS session_id,
    s.store_id,
    s.status,
    s.title,
    s.created_by,
    COUNT(DISTINCT ice.product_id) AS products_counted,
    SUM(ice.bottles_unopened) AS total_bottles_counted,
    SUM(ice.open_liters) AS total_open_liters_counted,
    COUNT(ice.id) AS total_count_events,
    MIN(ice.created_at) AS first_count_at,
    MAX(ice.created_at) AS last_count_at,
    COUNT(DISTINCT ice.counted_by) AS counters_involved,
    s.created_at,
    s.completed_at
FROM inventory_sessions s
LEFT JOIN inventory_count_events ice ON ice.session_id = s.id
WHERE s.status IN ('in_progress', 'pending_review', 'approved', 'synced')
GROUP BY s.id, s.store_id, s.status, s.title, s.created_by, s.created_at, s.completed_at;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_inventory_session_summary_id 
    ON inventory_session_summary(session_id);
```

**Refresh Strategy**:
```sql
-- Refresh after session status changes (non-blocking)
REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_session_summary;
```

**Usage Benefits**:
- **10-100x faster** than aggregating thousands of count events on page load
- Supports concurrent refresh (no table locks)
- Perfect for dashboards and reporting

### **Index Strategy**

Single-tenant optimized indexes (no composite `business_id` columns needed):

```sql
-- Fast barcode lookup
CREATE INDEX idx_product_barcodes_lookup 
    ON product_barcodes(barcode) 
    WHERE is_primary = true;

-- Fast active wine product queries
CREATE INDEX idx_wines_active 
    ON wines(product_id) 
    WHERE is_active = true;

-- Fast session lookup by status
CREATE INDEX idx_inventory_sessions_active 
    ON inventory_sessions(status, created_at DESC) 
    WHERE status IN ('draft', 'in_progress', 'pending_review');

-- Composite index for count events
CREATE INDEX idx_count_events_composite 
    ON inventory_count_events(session_id, product_id, created_at DESC);

-- Product search by category + active status
CREATE INDEX idx_products_category_active 
    ON products(category_id, is_active);
```

### **Query Optimization Functions**

#### **Aggregate Refresh Function**

```sql
CREATE OR REPLACE FUNCTION refresh_inventory_aggregates(p_session_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM inventory_product_aggregates WHERE session_id = p_session_id;
    
    INSERT INTO inventory_product_aggregates (
        session_id, product_id,
        counted_unopened_total,
        counted_open_liters_total,
        counted_total_liters,
        updated_at
    )
    SELECT 
        session_id, product_id,
        SUM(bottles_unopened),
        SUM(open_liters),
        SUM(bottles_unopened * p.unit_capacity_liters) + SUM(open_liters),
        NOW()
    FROM inventory_count_events ice
    JOIN products p ON p.id = ice.product_id
    WHERE session_id = p_session_id
    GROUP BY session_id, product_id;
    
    UPDATE inventory_sessions SET updated_at = NOW() WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Usage: call after adding count events
SELECT refresh_inventory_aggregates('session-uuid');
```

#### **Fuzzy Product Matching**

```sql
CREATE OR REPLACE FUNCTION find_syrve_product_match(
    p_syrve_name TEXT,
    p_syrve_sku TEXT,
    p_syrve_barcode TEXT
)
RETURNS TABLE (
    product_id UUID,
    confidence_score NUMERIC,
    match_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        CASE 
            WHEN pb.barcode = p_syrve_barcode AND p_syrve_barcode IS NOT NULL THEN 1.0
            WHEN p.sku = p_syrve_sku AND p_syrve_sku IS NOT NULL THEN 0.95
            WHEN similarity(p.name, p_syrve_name) > 0.8 THEN 0.75
            WHEN similarity(p.name, p_syrve_name) > 0.6 THEN 0.50
            ELSE 0.0
        END,
        CASE 
            WHEN pb.barcode = p_syrve_barcode THEN 'barcode_exact'
            WHEN p.sku = p_syrve_sku THEN 'sku_exact'
            WHEN similarity(p.name, p_syrve_name) > 0.8 THEN 'name_high_similarity'
            ELSE 'name_medium_similarity'
        END
    FROM products p
    LEFT JOIN product_barcodes pb ON pb.product_id = p.id
    WHERE p.is_active AND NOT p.is_deleted
    AND (
        pb.barcode = p_syrve_barcode 
        OR p.sku = p_syrve_sku 
        OR similarity(p.name, p_syrve_name) > 0.6
    )
    ORDER BY 2 DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **Query Patterns**

#### **Event-Sourced Aggregation**

```sql
-- ❌ SLOW: Aggregating on every query
SELECT product_id, SUM(bottles_unopened)
FROM inventory_count_events
WHERE session_id = 'uuid'
GROUP BY product_id;

-- ✅ FAST: Use pre-computed aggregates
SELECT product_id, counted_unopened_total
FROM inventory_product_aggregates
WHERE session_id = 'uuid';
```

#### **Vector Similarity Search**

```sql
-- Efficient pgvector query
SELECT 
    p.id,
    p.name,
    1 - (psi.embedding <=> query_embedding) AS similarity
FROM product_search_index psi
JOIN products p ON p.id = psi.product_id
WHERE p.is_active = true
ORDER BY psi.embedding <=> query_embedding
LIMIT 10;
```

### **Maintenance**

```sql
-- Weekly: Update table statistics
ANALYZE products;
ANALYZE inventory_count_events;
ANALYZE product_search_index;

-- Monthly: Vacuum large tables
VACUUM ANALYZE inventory_count_events;

-- Tune pgvector index for dataset size
-- lists = sqrt(row_count)
-- 10K products → lists ≈ 100
-- 100K products → lists ≈ 316
REINDEX INDEX idx_product_search_embedding;
```

---

## Edge Function Optimization

### **Security Validation Template**

Standardized auth/permission checking:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function validateCallerPermissions(
  req: Request,
  config: {
    requireAuth?: boolean;
    requiredModule?: string;
    requiredAction?: string;
    requiredLevel?: 'view' | 'edit' | 'full';
  } = {}
) {
  const authHeader = req.headers.get('Authorization');
  if (config.requireAuth && !authHeader) {
    throw new Error('Missing authorization header');
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Invalid or expired token');

  // Fetch profile + roles
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, user_roles!inner(role:roles(*))')
    .eq('id', user.id)
    .eq('is_active', true)
    .single();

  if (!profile) throw new Error('User profile not found');

  // Check permissions if required
  let hasPermission = true;
  if (config.requiredModule && config.requiredAction) {
    hasPermission = checkUserPermission(
      profile.user_roles,
      config.requiredModule,
      config.requiredAction,
      config.requiredLevel || 'edit'
    );
  }

  return { supabase, userId: user.id, profile, hasPermission };
}
```

### **Rate Limiting**

Protect expensive endpoints:

```typescript
async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  config: {
    maxRequests: number;
    windowMs: number;
    keyPrefix: string;
  }
) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);

  const { count } = await supabase
    .from('ai_runs')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .gte('created_at', windowStart.toISOString());

  const remaining = Math.max(0, config.maxRequests - (count || 0));

  return {
    allowed: remaining > 0,
    remaining,
    resetAt: new Date(now.getTime() + config.windowMs)
  };
}

// Usage in AI scan function
const rateLimit = await checkRateLimit(supabase, userId, {
  maxRequests: 50,
  windowMs: 3600000, // 1 hour
  keyPrefix: 'ai-scan'
});

if (!rateLimit.allowed) {
  return new Response(JSON.stringify({
    error: 'Rate limit exceeded',
    resetAt: rateLimit.resetAt
  }), { status: 429 });
}
```

### **Exponential Backoff Retry**

Robust external API calls:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 1000, maxDelayMs = 10000 } = options;
  
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
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Usage in Syrve sync
const products = await retryWithBackoff(
  async () => await fetchSyrveProducts(),
  { maxAttempts: 3, baseDelayMs: 1000 }
);
```

### **Audit Logging**

Track sensitive operations:

```typescript
async function auditLog(
  supabase: SupabaseClient,
  event: {
    actor_id: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    metadata?: any;
  }
) {
  await supabase.from('audit_logs').insert({
    actor_id: event.actor_id,
    action: event.action,
    resource_type: event.resource_type,
    resource_id: event.resource_id,
    metadata: event.metadata || {},
    created_at: new Date().toISOString()
  });
}

// Usage
await auditLog(supabase, {
  actor_id: userId,
  action: 'user.create',
  resource_type: 'user',
  resource_id: newUser.id,
  metadata: { login_name: 'staff2' }
});
```

---

## AI Pipeline Optimization

### **Rate Limiting**

50 scans/hour per user:

```typescript
const rateLimit = await checkRateLimit(supabase, userId, {
  maxRequests: 50,
  windowMs: 3600000,
  keyPrefix: 'ai-scan'
});
```

### **Cost Tracking**

Track AI costs per scan:

```sql
ALTER TABLE ai_runs 
ADD COLUMN cost_usd NUMERIC(10, 4),
ADD COLUMN provider_usage JSONB DEFAULT '{}';

-- Cost calculation example
UPDATE ai_runs
SET cost_usd = (
    (ocr_chars / 1000.0 * 0.0015) +  -- Google Vision
    (embedding_tokens / 1000000.0 * 0.02) +  -- OpenAI
    (vision_calls * 0.000075)  -- Gemini Flash
);
```

### **Provider Configuration**

Multi-provider support via `ai_config`:

```sql
UPDATE ai_config
SET 
  ocr_provider = 'google_vision',
  vision_provider = 'gemini',
  embedding_provider = 'openai',
  model_config = '{
    "confidence_thresholds": {
      "vector_search_min": 0.7,
      "vision_verification_min": 0.75,
      "auto_accept_threshold": 0.95
    }
  }'::jsonb;
```

### **Image Pre-processing**

Reduce API costs:

```typescript
async function preprocessImage(imageBlob: Blob): Promise<Blob> {
  // Resize to max 1024px
  // Enhance contrast
  // Reduce file size
  return processedBlob;
}
```

### **pgvector Index Tuning**

```sql
-- Tune for dataset size: lists = sqrt(row_count)
CREATE INDEX idx_product_search_embedding 
  ON product_search_index 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);  -- Adjust based on product count
```

---

## Deployment Best Practices

### **Supabase Configuration**

```bash
# Connection pooling (default: enabled)
# No configuration needed - Supabase uses pgBouncer

# Set Edge Function secrets
supabase secrets set GOOGLE_VISION_API_KEY=...
supabase secrets set OPENAI_API_KEY=...
supabase secrets set GEMINI_API_KEY=...
supabase secrets set SYRVE_API_PASSWORD_ENCRYPTED=...
```

### **Database Maintenance Schedule**

```bash
# Daily: Refresh materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY inventory_session_summary;

# Weekly: Update statistics
ANALYZE products;
ANALYZE inventory_count_events;

# Monthly: Vacuum large tables
VACUUM ANALYZE inventory_count_events;
VACUUM ANALYZE ai_runs;
```

### **Monitoring Queries**

#### **Session Performance**

```sql
-- Average count events per session
SELECT
  AVG(event_count) AS avg_events_per_session,
  MAX(event_count) AS max_events_per_session
FROM (
  SELECT session_id, COUNT(*) AS event_count
  FROM inventory_count_events
  GROUP BY session_id
) sub;
```

#### **AI Pipeline Costs**

```sql
-- Monthly AI costs
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS total_scans,
  SUM(cost_usd) AS total_cost,
  AVG(cost_usd) AS avg_cost_per_scan
FROM ai_runs
WHERE run_type = 'label_recognition'
GROUP BY month
ORDER BY month DESC;
```

#### **Slow Queries**

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top 10 slowest queries
SELECT
  query,
  mean_exec_time,
  calls,
  total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### **Performance Checklist**

- [ ] Materialized views created and refreshed regularly
- [ ] All foreign keys indexed
- [ ] pgvector index tuned for dataset size (`lists = sqrt(rows)`)
- [ ] Rate limiting enabled on AI endpoints
- [ ] Edge Function security validation in place
- [ ] Audit logging configured for sensitive operations
- [ ] Connection pooling enabled (default in Supabase)
- [ ] Weekly `ANALYZE` scheduled
- [ ] Monthly `VACUUM` scheduled
- [ ] Cost tracking enabled for AI operations

---

## Performance Metrics

### **Target Metrics**

| Operation | Target | Notes |
|-----------|--------|-------|
| Product search (text) | < 100ms | With GIN index on name |
| Product search (vector) | < 200ms | pgvector with 10K products |
| Session aggregate query | < 50ms | Using materialized view |
| Count event insertion | < 20ms | Single insert |
| AI label scan (full pipeline) | < 5s | OCR + embedding + vision |
| Syrve bootstrap sync | < 30s | 500 products |
| Inventory submission to Syrve | < 10s | Via outbox pattern |

### **Monitoring**

Use Supabase Dashboard's built-in metrics:
- **Database**: Query performance, slow queries, index usage
- **API**: Request volume, error rates, response times
- **Edge Functions**: Invocation count, duration, errors
- **Storage**: Upload volume, bandwidth

---

## Next Steps

- Review [02-database-schema.md](02-database-schema.md) for schema details
- Study [05-edge-functions.md](05-edge-functions.md) for security patterns
- Examine [06-ai-recognition.md](06-ai-recognition.md) for AI pipeline optimization
