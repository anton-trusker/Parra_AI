import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  syrve_product_id: string;
  name: string;
  description: string | null;
  sku: string | null;
  code: string | null;
  product_type: string | null;
  category_id: string | null;
  is_active: boolean | null;
  is_deleted: boolean | null;
  is_marked: boolean;
  is_by_glass: boolean;
  sale_price: number | null;
  purchase_price: number | null;
  default_sale_price: number | null;
  current_stock: number | null;
  unit_capacity: number | null;
  main_unit_id: string | null;
  syrve_data: any;
  metadata: any;
  synced_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  price_updated_at: string | null;
  stock_updated_at: string | null;
  not_in_store_movement: boolean | null;
  categories?: { name: string } | null;
}

export interface ProductBarcode {
  id: string;
  product_id: string;
  barcode: string;
  container_name: string | null;
  source: string | null;
  is_primary: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function useProducts(filters?: {
  search?: string;
  productType?: string[];
  categoryId?: string;
  stockStatus?: string;
  isMarked?: boolean;
  isByGlass?: boolean;
}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, categories!products_category_id_fkey(name)')
        .eq('is_deleted', false)
        .order('name');

      if (filters?.search) {
        const q = `%${filters.search}%`;
        query = query.or(`name.ilike.${q},sku.ilike.${q},code.ilike.${q}`);
      }
      if (filters?.productType?.length) {
        query = query.in('product_type', filters.productType);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.isMarked === true) {
        query = query.eq('is_marked', true);
      }
      if (filters?.isByGlass === true) {
        query = query.eq('is_by_glass', true);
      }

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return (data || []) as Product[];
    },
  });
}

export function useToggleProductFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'is_marked' | 'is_by_glass'; value: boolean }) => {
      const { error } = await supabase.from('products').update({ [field]: value }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useBulkToggleProductFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, field, value }: { ids: string[]; field: 'is_marked' | 'is_by_glass'; value: boolean }) => {
      const { error } = await supabase.from('products').update({ [field]: value }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('products')
        .select('*, categories!products_category_id_fkey(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
  });
}

export function useProductBarcodes(productId: string | undefined) {
  return useQuery({
    queryKey: ['product_barcodes', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_barcodes')
        .select('*')
        .eq('product_id', productId)
        .order('is_primary', { ascending: false });
      if (error) throw error;
      return (data || []) as ProductBarcode[];
    },
    enabled: !!productId,
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      // Soft-delete: set is_active=false, is_deleted=true on category and children
      const { data: children } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryId);
      
      const ids = [categoryId, ...(children || []).map(c => c.id)];
      
      for (const id of ids) {
        // Also get grandchildren recursively
        const { data: grandchildren } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', id);
        if (grandchildren) {
          for (const gc of grandchildren) {
            if (!ids.includes(gc.id)) ids.push(gc.id);
          }
        }
      }

      const { error } = await supabase
        .from('categories')
        .update({ is_active: false, is_deleted: true })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['syrve_categories'] });
      qc.invalidateQueries({ queryKey: ['categories_with_counts'] });
    },
  });
}

export function useCategoriesWithCounts() {
  return useQuery({
    queryKey: ['categories_with_counts'],
    queryFn: async () => {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('name'),
        supabase.from('products').select('id, category_id').eq('is_deleted', false),
      ]);
      if (catRes.error) throw catRes.error;
      if (prodRes.error) throw prodRes.error;

      const counts: Record<string, number> = {};
      for (const p of prodRes.data || []) {
        if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
      }

      return {
        categories: catRes.data || [],
        productCounts: counts,
      };
    },
  });
}
