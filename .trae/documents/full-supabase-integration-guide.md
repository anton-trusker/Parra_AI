# Full Supabase Integration Implementation Guide

## Overview
This guide provides complete implementation steps to replace all mock data with live Supabase integration, ensure all edge functions are properly configured and executable, and implement full backend connectivity for the wine inventory platform.

## Current State Analysis

### Mock Data Files to Replace
- `src/data/mockStockByStore.ts` - Stock levels across stores
- `src/data/mockInventoryChecks.ts` - Inventory session data  
- `src/data/mockCheckDetail.ts` - Detailed inventory counts
- `src/data/mockAiScans.ts` - AI recognition results
- `src/data/mockStores.ts` - Store/warehouse data
- `src/data/mockUsers.ts` - User management data

### Edge Functions Status
✅ **Implemented and Functional:**
- `syrve-sync` - Complete Syrve integration with products, categories, stock
- `ai-recognize-label` - AI wine label recognition with multi-strategy matching
- `inventory-create-session` - Session creation with baseline loading
- `inventory-load-baseline` - Baseline stock loading from Syrve
- `inventory-submit-to-syrve` - Final submission to Syrve

⚠️ **Needs Configuration/Testing:**
- `syrve-connect-test` - Connection testing
- `syrve-save-config` - Configuration saving
- `manage-users` - User management operations
- `ai-enrich-wine` - Wine enrichment
- `generate-wine-embeddings` - Embedding generation

## Implementation Steps

### 1. Replace Mock Data with Live Queries

#### Stock by Store Integration
Replace `mockStockByStore.ts` with live Supabase query:

```typescript
// src/hooks/useStockByStore.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StockByStore {
  product_id: string;
  product_name: string;
  category_name: string;
  sku: string;
  stores: {
    store_id: string;
    store_name: string;
    unopened: number;
    open_ml: number;
    last_counted: string | null;
  }[];
  total_unopened: number;
  total_open_ml: number;
}

export function useStockByStore(filters?: {
  storeIds?: string[];
  categoryIds?: string[];
  search?: string;
}) {
  return useQuery({
    queryKey: ['stock_by_store', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_stock_by_store', {
          p_store_ids: filters?.storeIds,
          p_category_ids: filters?.categoryIds,
          p_search: filters?.search
        });
      
      if (error) throw error;
      return data as StockByStore[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### Create Required Database Function
```sql
-- Function: get_stock_by_store
CREATE OR REPLACE FUNCTION get_stock_by_store(
  p_store_ids uuid[] DEFAULT NULL,
  p_category_ids uuid[] DEFAULT NULL,
  p_search text DEFAULT NULL
)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  category_name text,
  sku text,
  stores jsonb,
  total_unopened numeric,
  total_open_ml numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    c.name as category_name,
    p.sku,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'store_id', s.id,
          'store_name', s.name,
          'unopened', COALESCE(sl.quantity, 0),
          'open_ml', COALESCE(sl.open_quantity_ml, 0),
          'last_counted', sl.last_counted_at
        ) ORDER BY s.name
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) as stores,
    COALESCE(SUM(sl.quantity), 0) as total_unopened,
    COALESCE(SUM(sl.open_quantity_ml), 0) as total_open_ml
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN stock_levels sl ON p.id = sl.product_id
  LEFT JOIN stores s ON sl.store_id = s.id
  WHERE 
    p.is_deleted = false 
    AND p.is_active = true
    AND (p_store_ids IS NULL OR s.id = ANY(p_store_ids))
    AND (p_category_ids IS NULL OR p.category_id = ANY(p_category_ids))
    AND (p_search IS NULL OR 
         p.name ILIKE '%' || p_search || '%' OR
         p.sku ILIKE '%' || p_search || '%')
  GROUP BY p.id, p.name, c.name, p.sku
  HAVING COALESCE(SUM(sl.quantity), 0) > 0 OR COALESCE(SUM(sl.open_quantity_ml), 0) > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION get_stock_by_store TO authenticated;
GRANT EXECUTE ON FUNCTION get_stock_by_store TO anon;
```

### 2. Edge Function Configuration & Deployment

#### Environment Variables Setup
Add to Supabase project settings:

```bash
# Required for all edge functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Syrve Integration
SYRVE_ENCRYPTION_KEY=your-encryption-key

# AI Services
LOVABLE_API_KEY=your-lovable-api-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key

# Optional custom gateway
CUSTOM_AI_GATEWAY_URL=https://your-gateway.com/v1/chat/completions
```

#### Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy syrve-sync
supabase functions deploy ai-recognize-label
supabase functions deploy inventory-create-session
supabase functions deploy inventory-load-baseline
supabase functions deploy inventory-submit-to-syrve
supabase functions deploy syrve-connect-test
supabase functions deploy syrve-save-config
supabase functions deploy manage-users
supabase functions deploy ai-enrich-wine
supabase functions deploy generate-wine-embeddings
```

### 3. Real-time Collaboration (RTC) Setup

#### Enable Real-time Subscriptions
Configure Supabase real-time for inventory sessions:

```typescript
// src/hooks/useInventoryPresence.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useInventoryPresence(sessionId: string) {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<Record<string, any>>({});

  useEffect(() => {
    const channel = supabase.channel(`inventory:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setActiveUsers(Object.values(state).flat());
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            user_name: user.name,
            role: user.role,
            last_activity: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { activeUsers, userActivity };
}
```

#### Real-time Inventory Updates
```typescript
// src/hooks/useRealtimeInventory.ts
export function useRealtimeInventory(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`inventory_updates:${sessionId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_items', filter: `session_id=eq.${sessionId}` },
        (payload) => {
          queryClient.invalidateQueries(['inventory_items', sessionId]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);
}
```

### 4. Import Rules Configuration

#### Syrve Import Rules Engine
```typescript
// src/hooks/useImportRules.ts
export interface ImportRule {
  id: string;
  rule_type: 'category_filter' | 'product_type_filter' | 'price_range' | 'custom_condition';
  name: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  priority: number;
  is_active: boolean;
}

export function useImportRules() {
  return useQuery({
    queryKey: ['import_rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });
      
      if (error) throw error;
      return data as ImportRule[];
    },
  });
}
```

#### Inventory Rules Configuration
```sql
-- Table: import_rules
CREATE TABLE import_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('category_filter', 'product_type_filter', 'price_range', 'custom_condition')),
  name TEXT NOT NULL,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '{}',
  priority INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE import_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view import rules for their business" ON import_rules
  FOR SELECT USING (business_id = current_business_id());

CREATE POLICY "Managers can manage import rules" ON import_rules
  FOR ALL USING (
    business_id = current_business_id() 
    AND has_role('manager')
  );
```

### 5. Error Handling & Monitoring

#### Edge Function Error Handling
```typescript
// Enhanced error handling in edge functions
try {
  // Function logic
} catch (error) {
  console.error('Edge function error:', error);
  
  // Log to audit_logs table
  await supabaseAdmin.from('audit_logs').insert({
    action_type: 'edge_function_error',
    entity_type: 'function',
    entity_id: functionName,
    error_message: error.message,
    metadata: {
      function: functionName,
      user_id: user.id,
      business_id: businessId,
      stack_trace: error.stack
    },
    created_at: new Date().toISOString()
  });
  
  return new Response(
    JSON.stringify({ 
      error: 'Internal server error',
      correlation_id: crypto.randomUUID()
    }),
    { status: 500, headers: corsHeaders }
  );
}
```

#### Frontend Error Boundary
```typescript
// src/components/ErrorBoundary.tsx
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <TanstackQueryErrorBoundary
      onError={(error) => {
        console.error('Query error:', error);
        toast.error('Failed to load data. Please refresh the page.');
      }}
    >
      {children}
    </TanstackQueryErrorBoundary>
  );
}
```

### 6. Testing & Validation

#### Edge Function Testing
```bash
# Test Syrve connection
curl -X POST https://your-project.supabase.co/functions/v1/syrve-connect-test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"business_id": "your-business-id"}'

# Test AI recognition
curl -X POST https://your-project.supabase.co/functions/v1/ai-recognize-label \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"image_base64": "base64_encoded_image", "session_id": "session-id"}'
```

#### Integration Testing Checklist
- [ ] Syrve connection test successful
- [ ] Product sync from Syrve working
- [ ] Stock levels updating correctly
- [ ] AI label recognition functional
- [ ] Inventory session creation working
- [ ] Real-time updates broadcasting
- [ ] User presence tracking active
- [ ] Import rules applying correctly
- [ ] Error logging functional
- [ ] Performance metrics tracking

### 7. Performance Optimization

#### Query Optimization
```sql
-- Indexes for performance
CREATE INDEX idx_products_business_id ON products(business_id);
CREATE INDEX idx_stock_levels_product_store ON stock_levels(product_id, store_id);
CREATE INDEX idx_inventory_items_session_id ON inventory_items(session_id);
CREATE INDEX idx_ai_recognition_attempts_user_id ON ai_recognition_attempts(user_id);
CREATE INDEX idx_syrve_sync_runs_business_id ON syrve_sync_runs(business_id);

-- Materialized view for stock summaries
CREATE MATERIALIZED VIEW mv_stock_summary AS
SELECT 
  p.id as product_id,
  p.business_id,
  SUM(sl.quantity) as total_stock,
  SUM(sl.quantity * sl.unit_cost) as total_value,
  COUNT(DISTINCT sl.store_id) as store_count
FROM products p
LEFT JOIN stock_levels sl ON p.id = sl.product_id
WHERE p.is_deleted = false
GROUP BY p.id, p.business_id;

CREATE INDEX idx_mv_stock_summary_business_id ON mv_stock_summary(business_id);
```

#### Caching Strategy
```typescript
// Implement query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

## Deployment Verification

### Pre-deployment Checklist
1. All edge functions deployed and accessible
2. Database functions created and tested
3. RLS policies configured correctly
4. Environment variables set
5. Real-time subscriptions enabled
6. Import rules configured
7. Error monitoring active

### Post-deployment Verification
1. Test complete inventory workflow
2. Verify Syrve data synchronization
3. Confirm AI recognition accuracy
4. Validate real-time collaboration
5. Check error handling and logging
6. Monitor performance metrics
7. Verify data integrity

## Troubleshooting Common Issues

### Edge Function Execution Errors
- Check function logs in Supabase dashboard
- Verify environment variables are set
- Confirm service role key permissions
- Test function locally with `supabase functions serve`

### Database Connection Issues
- Verify RLS policies are not blocking queries
- Check database connection limits
- Monitor query performance with `pg_stat_statements`
- Optimize slow queries with proper indexes

### Real-time Subscription Failures
- Confirm realtime is enabled in Supabase
- Check row level security on subscribed tables
- Verify network connectivity for WebSocket
- Monitor subscription limits

This implementation guide ensures complete integration with Supabase, removal of all mock data, and full functionality of edge functions, real-time features, and business rules.