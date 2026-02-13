import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WineProduct {
  // Product fields
  id: string; // product_id
  name: string;
  sku: string | null;
  image_url: string | null;
  stock_on_hand: number;
  
  // Wine fields
  wine_id: string | null; // might be null if not yet linked in wines table
  vintage: number | null;
  producer: string | null;
  region: string | null;
  sub_region: string | null;
  country: string | null;
  wine_type: string | null; // Enum
  grape_varieties: string[] | null;
  appellation: string | null;
  alcohol_percentage: number | null;
  bottle_size_ml: number | null;
  tasting_notes: string | null;
  food_pairing: string[] | null;
  serving_temp_c: number | null;
  
  // Extended fields
  body?: string | null;
  sweetness?: string | null;
  acidity?: string | null;
  tannins?: string | null;
  closure_type?: string | null;
  is_active?: boolean;
  min_stock_level?: number | null;
  max_stock_level?: number | null;
  reorder_point?: number | null;
  reorder_quantity?: number | null;
  cellar_section?: string | null;
  rack_number?: string | null;
  shelf_position?: string | null;
  supplier_name?: string | null;
  estate?: string | null;
  full_name?: string | null;
  stock_opened?: number | null;
  stock_unopened?: number | null;
  purchase_price?: number | null;
  sale_price?: number | null;
  glass_price?: number | null;
  available_by_glass?: boolean;
  
  // Computed/Joined
  category_name?: string;
}

interface WineStoreState {
  wines: WineProduct[];
  loading: boolean;
  currentWine: WineProduct | null;

  fetchWines: (search?: string) => Promise<void>;
  getWineById: (id: string) => Promise<WineProduct | null>;
  saveWine: (data: Partial<WineProduct>, isNew: boolean) => Promise<boolean>;
  deleteWine: (id: string) => Promise<boolean>;
}

export const useWineStore = create<WineStoreState>((set, get) => ({
  wines: [],
  loading: false,
  currentWine: null,

  fetchWines: async (search) => {
    set({ loading: true });
    
    // Use the view created in migration 20260213000002
    let query = supabase
      .from('view_wine_products')
      .select('*');

    if (search) {
      query = query.or(`name.ilike.%${search}%,producer.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching wines:', error);
      toast.error('Failed to load wines');
      set({ loading: false });
      return;
    }

    set({ wines: data as any[], loading: false });
  },

  getWineById: async (id) => {
    set({ loading: true });
    // Join products and wines manually to get full details not in view
    const { data: product, error: prodError } = await supabase
      .from('products')
      .select(`
        *,
        wines (*)
      `)
      .eq('id', id)
      .single();

    if (prodError) {
      console.error('Error fetching wine details:', prodError);
      set({ loading: false });
      return null;
    }

    // Flatten structure
    const wineData = product.wines ? product.wines[0] : {}; // One-to-one
    const fullWine: WineProduct = {
      ...product,
      ...wineData,
      id: product.id, // Ensure ID is product ID
      wine_id: wineData?.id
    };

    set({ currentWine: fullWine, loading: false });
    return fullWine;
  },

  saveWine: async (data, isNew) => {
    set({ loading: true });
    
    try {
      // 1. Upsert Product
      const productData = {
        name: data.name,
        sku: data.sku,
        image_url: data.image_url,
        // Add other product fields as needed
        is_active: true
      };

      let productId = data.id;

      if (isNew) {
        const { data: newProd, error: prodError } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
          
        if (prodError) throw prodError;
        productId = newProd.id;
      } else {
        const { error: prodError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId);
        if (prodError) throw prodError;
      }

      // 2. Upsert Wine details
      const wineData = {
        product_id: productId,
        vintage: data.vintage,
        producer: data.producer,
        region: data.region,
        sub_region: data.sub_region,
        country: data.country,
        wine_type: data.wine_type,
        grape_varieties: data.grape_varieties,
        appellation: data.appellation,
        alcohol_percentage: data.alcohol_percentage,
        bottle_size_ml: data.bottle_size_ml,
        tasting_notes: data.tasting_notes,
        food_pairing: data.food_pairing,
        serving_temp_c: data.serving_temp_c,
        
        // Extended
        body: data.body,
        sweetness: data.sweetness,
        acidity: data.acidity,
        tannins: data.tannins,
        closure_type: data.closure_type,
        min_stock_level: data.min_stock_level,
        max_stock_level: data.max_stock_level,
        reorder_point: data.reorder_point,
        reorder_quantity: data.reorder_quantity,
        cellar_section: data.cellar_section,
        rack_number: data.rack_number,
        shelf_position: data.shelf_position,
        supplier_name: data.supplier_name,
        estate: data.estate,
        full_name: data.full_name,
        
        // Prices/Stock often in products or separate tables, but let's assume wines table for now based on form
        purchase_price: data.purchase_price,
        sale_price: data.sale_price,
        glass_price: data.glass_price,
        available_by_glass: data.available_by_glass,
        current_stock_opened: data.stock_opened,
        current_stock_unopened: data.stock_unopened
      };

      // Check if wine entry exists
      const { data: existingWine } = await supabase
        .from('wines')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();

      if (existingWine) {
        const { error: wineError } = await supabase
          .from('wines')
          .update(wineData)
          .eq('id', existingWine.id);
        if (wineError) throw wineError;
      } else {
        const { error: wineError } = await supabase
          .from('wines')
          .insert([wineData]);
        if (wineError) throw wineError;
      }

      toast.success('Wine saved successfully');
      set({ loading: false });
      return true;

    } catch (error: any) {
      console.error('Error saving wine:', error);
      toast.error(`Failed to save wine: ${error.message}`);
      set({ loading: false });
      return false;
    }
  },

  deleteWine: async (id) => {
    // Delete product (cascade should handle wine entry)
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete wine');
      return false;
    }
    
    toast.success('Wine deleted');
    return true;
  }
}));
