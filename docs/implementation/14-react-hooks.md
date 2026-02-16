# 14 — React Hooks (Frontend)

## Hook Architecture

All hooks use TanStack Query for data fetching and caching, with Supabase client for API calls.

## useProducts

```typescript
export function useProducts(filters?: {
  categoryId?: string;
  productType?: string;
  search?: string;
  warehouseId?: string;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories(name), measurement_units!main_unit_id(short_name)')
        .eq('is_deleted', false)
        .order('name');

      if (filters?.categoryId) query = query.eq('category_id', filters.categoryId);
      if (filters?.productType) query = query.eq('product_type', filters.productType);
      if (filters?.search) query = query.textSearch('search_vector', filters.search);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });
}
```

## useInventorySessions

```typescript
export function useInventorySessions() {
  return useQuery({
    queryKey: ['inventory-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_sessions')
        .select(`
          *,
          warehouses(name),
          profiles!created_by(full_name),
          profiles!approved_by(full_name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { warehouse_id: string; title: string }) => {
      // 1. Create session
      const { data: session, error } = await supabase
        .from('inventory_sessions')
        .insert({ ...input, created_by: userId, status: 'draft' })
        .select()
        .single();
      if (error) throw error;

      // 2. Load baseline via edge function
      await supabase.functions.invoke('inventory-load-baseline', {
        body: { session_id: session.id }
      });

      return session;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory-sessions'] })
  });
}
```

## useCountEvents

```typescript
export function useSubmitCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      session_id: string;
      product_id: string;
      quantity_counted: number;
      counting_unit_id: string;
      method: string;
    }) => {
      const { data, error } = await supabase
        .from('inventory_count_events')
        .insert({ ...input, counted_by: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['inventory-aggregates', variables.session_id]
      });
    }
  });
}
```

## useStores / useWarehouses

```typescript
export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouses')
        .select('*, stores(name)')
        .eq('is_active', true)
        .eq('is_deleted', false)
        .order('name');
      if (error) throw error;
      return data;
    }
  });
}
```

## useSyrveSync

```typescript
export function useSyrveBootstrap() {
  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { data, error } = await supabase.functions.invoke('syrve-sync-bootstrap', {
        body: { tenant_id: tenantId }
      });
      if (error) throw error;
      return data;
    }
  });
}

export function useSyrveConnectTest() {
  return useMutation({
    mutationFn: async (input: { server_url: string; api_login: string; api_password: string }) => {
      const { data, error } = await supabase.functions.invoke('syrve-connect-test', {
        body: input
      });
      if (error) throw error;
      return data;
    }
  });
}
```

## useAI

```typescript
export function useAIRecognize() {
  return useMutation({
    mutationFn: async (input: { image_url: string; model?: string }) => {
      const { data, error } = await supabase.functions.invoke('ai-recognize-product', {
        body: { ...input, tenant_id: tenantId }
      });
      if (error) throw error;
      return data;
    }
  });
}
```

## useStockLevels

```typescript
export function useStockLevels(warehouseId: string) {
  return useQuery({
    queryKey: ['stock-levels', warehouseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_levels')
        .select('*, products(name, sku, product_type), measurement_units(short_name)')
        .eq('warehouse_id', warehouseId)
        .gt('quantity', 0)
        .order('products(name)');
      if (error) throw error;
      return data;
    },
    enabled: !!warehouseId
  });
}
```
