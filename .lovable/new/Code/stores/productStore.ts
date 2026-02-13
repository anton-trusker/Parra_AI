import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  syrve_group_id: string;
  children?: Category[]; // Computed for tree view
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category_id: string;
  unit_name: string;
  stock_on_hand: number;
  image_url: string;
  product_type: string;
  syrve_data: any;
}

interface ProductStoreState {
  products: Product[];
  categories: Category[];
  categoryTree: Category[]; // Hierarchical structure
  
  loading: boolean;
  selectedCategoryId: string | null;
  searchQuery: string;

  // Actions
  fetchCategories: () => Promise<void>;
  fetchProducts: (categoryId?: string | null, search?: string) => Promise<void>;
  setSelectedCategory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useProductStore = create<ProductStoreState>((set, get) => ({
  products: [],
  categories: [],
  categoryTree: [],
  loading: false,
  selectedCategoryId: null,
  searchQuery: '',

  fetchCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    const categories = data as Category[];
    
    // Build Tree
    const tree: Category[] = [];
    const map = new Map<string, Category>();
    
    // 1. Initialize map and children array
    categories.forEach(c => {
      c.children = [];
      map.set(c.id, c);
    });

    // 2. Link parents
    categories.forEach(c => {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.children!.push(c);
      } else {
        tree.push(c);
      }
    });

    set({ categories, categoryTree: tree });
  },

  fetchProducts: async (categoryId = get().selectedCategoryId, search = get().searchQuery) => {
    set({ loading: true });
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(100); // Pagination needed for real prod, limit for MVP

    if (categoryId) {
        // Recursive? Or just direct?
        // To do recursive, we need all child IDs.
        // For now, let's do direct match for simplicity or use the `syrve_group_id` if we synced hierarchy logic
        // Actually, let's find all sub-category IDs locally since we have the full category list loaded
        const allIds = getAllChildIds(categoryId, get().categories);
        query = query.in('category_id', allIds);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    
    if (error) {
       console.error('Error fetching products:', error);
       set({ loading: false });
    } else {
       set({ products: data as Product[], loading: false });
    }
  },

  setSelectedCategory: (id) => {
    set({ selectedCategoryId: id });
    get().fetchProducts(id, get().searchQuery);
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
    get().fetchProducts(get().selectedCategoryId, q);
  }
}));

// Helper recursive collector
function getAllChildIds(rootId: string, allCategories: Category[]): string[] {
    const ids = [rootId];
    const directChildren = allCategories.filter(c => c.parent_id === rootId);
    directChildren.forEach(child => {
        ids.push(...getAllChildIds(child.id, allCategories));
    });
    return ids;
}
