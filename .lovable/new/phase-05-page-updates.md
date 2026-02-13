# Phase 5: Page Updates

## Overview

Update all pages to use Supabase queries with React Query for caching.

---

## Key Pages

### 1. Dashboard

```typescript
// src/pages/Dashboard.tsx
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const { count: totalWines } = await supabase
      .from('wines')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: lowStock } = await supabase
      .from('wines')
      .select('*', { count: 'exact', head: true })
      .eq('stock_status', 'low_stock');

    return { totalWines, lowStock };
  },
});
```

### 2. Wine Catalog

- Paginated query with filters
- Search via ILIKE
- Type filtering
- Optimistic UI updates

### 3. Wine Detail

- Single wine query by ID
- Related movements
- Wine images
- Soft delete mutation

### 4. Inventory Count

- Session creation
- Item recording
- Movement logging
- Stock updates

---

## Common Pattern

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', filters],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('filter', value);
    if (error) throw error;
    return data;
  },
});
```

---

## Next Phase

→ [Phase 6: Edge Functions](./phase-06-edge-functions.md)
