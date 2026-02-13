# Phase 7: React Query Hooks

## Overview

Create reusable React Query hooks for all data operations.

---

## Hook Structure

```
src/hooks/
├── useWines.ts
├── useWine.ts
├── useInventorySessions.ts
├── useInventoryItems.ts
├── useMovements.ts
├── useProfiles.ts
├── useSettings.ts
├── useRoles.ts
├── useDashboardStats.ts
└── useNotifications.ts
```

---

## Implementation

### useWines.ts

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Wine, WineInsert, WineUpdate } from '@/integrations/supabase/types';

interface WineFilters {
  search?: string;
  wineType?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export function useWines(filters: WineFilters = {}) {
  const { search, wineType, status, page = 0, limit = 20 } = filters;

  return useQuery({
    queryKey: ['wines', filters],
    queryFn: async () => {
      let query = supabase
        .from('wines')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('name')
        .range(page * limit, (page + 1) * limit - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,producer.ilike.%${search}%`);
      }
      if (wineType && wineType !== 'all') {
        query = query.eq('wine_type', wineType);
      }
      if (status) {
        query = query.eq('stock_status', status);
      }

      const { data, count, error } = await query;
      if (error) throw error;
      return { wines: data || [], total: count || 0 };
    },
    keepPreviousData: true,
  });
}

export function useWine(id: string) {
  return useQuery({
    queryKey: ['wine', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wines')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wine: WineInsert) => {
      const { data, error } = await supabase
        .from('wines')
        .insert(wine)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines'] });
    },
  });
}

export function useUpdateWine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: WineUpdate }) => {
      const { error } = await supabase
        .from('wines')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['wine', id] });
      queryClient.invalidateQueries({ queryKey: ['wines'] });
    },
  });
}

export function useDeleteWine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wines')
        .update({ is_active: false, deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wines'] });
    },
  });
}
```

### useInventorySessions.ts

```typescript
export function useInventorySessions(status?: string) {
  return useQuery({
    queryKey: ['sessions', status],
    queryFn: async () => {
      let query = supabase
        .from('inventory_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSessionWithItems(sessionId: string) {
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data: session, error: sessionError } = await supabase
        .from('inventory_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select(`*, wine:wines(id, name, producer, vintage, primary_barcode)`)
        .eq('session_id', sessionId);

      if (itemsError) throw itemsError;

      return { ...session, items: items || [] };
    },
    enabled: !!sessionId,
  });
}
```

### useDashboardStats.ts

```typescript
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [wines, lowStock, pending, value] = await Promise.all([
        supabase.from('wines').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('wines').select('*', { count: 'exact', head: true }).eq('stock_status', 'low_stock'),
        supabase.from('inventory_sessions').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('wines').select('current_stock_unopened, current_stock_opened, purchase_price').eq('is_active', true),
      ]);

      const totalValue = value.data?.reduce((sum, w) => {
        return sum + ((w.current_stock_unopened || 0) + (w.current_stock_opened || 0)) * (w.purchase_price || 0);
      }, 0) || 0;

      return {
        totalWines: wines.count || 0,
        lowStock: lowStock.count || 0,
        pendingSessions: pending.count || 0,
        totalValue,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

---

## Usage Pattern

```typescript
function WineCatalog() {
  const [filters, setFilters] = useState({});
  const { data, isLoading, error } = useWines(filters);
  const createWine = useCreateWine();

  const handleCreate = async (wine) => {
    await createWine.mutateAsync(wine);
  };

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <WineList wines={data.wines} />;
}
```

---

## Next Phase

→ [Phase 8: Real-time Subscriptions](./phase-08-realtime.md)
