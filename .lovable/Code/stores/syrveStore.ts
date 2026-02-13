import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface SyrveStoreState {
  config: {
    serverUrl: string;
    login: string;
    storeId: string | null;
    autoSync: boolean;
  } | null;
  
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing' | 'idle';
  availableStores: { id: string; name: string }[];
  errorMessage: string | null;
  loading: boolean;

  // Actions
  fetchConfig: () => Promise<void>;
  testConnection: (url: string, login: string, password?: string) => Promise<boolean>;
  saveConfig: (data: { serverUrl: string; login: string; password?: string; storeId?: string }) => Promise<void>;
}

export const useSyrveStore = create<SyrveStoreState>((set, get) => ({
  config: null,
  connectionStatus: 'idle',
  availableStores: [],
  errorMessage: null,
  loading: false,

  fetchConfig: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('integration_syrve_config')
      .select('base_url, api_login, default_store_id, is_active')
      .maybeSingle();

    if (error) {
      console.error('Error fetching Syrve config:', error);
      set({ loading: false });
      return;
    }

    if (data) {
      set({
        config: {
          serverUrl: data.base_url,
          login: data.api_login,
          storeId: data.default_store_id,
          autoSync: data.is_active || false
        },
        connectionStatus: data.is_active ? 'connected' : 'idle', // Simplified status
        loading: false
      });
    } else {
      set({ config: null, loading: false });
    }
  },

  testConnection: async (url, login, password) => {
    set({ connectionStatus: 'testing', errorMessage: null });

    try {
      const { data, error } = await supabase.functions.invoke('syrve-connect-test', {
        body: { url, login, password }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Connection failed');
      }
      
      // Parse XML stores
      const rawXml: string = data.raw_org_data || '';
      const stores: {id: string, name: string}[] = [];
      
      // Basic Regex to find corporateItemDto (Stores)
      // XML Structure often: <corporateItemDto><id>UUID</id><name>Name</name>...</corporateItemDto>
      
      // Match all <corporateItemDto> blocks or <item> blocks depending on endpoint
      // For /corporation/stores, it is usually <corporateItemDto>
      const storeBlocks = rawXml.match(/<(corporateItemDto|item)>[\s\S]*?<\/\1>/g);
      
      if (storeBlocks && storeBlocks.length > 0) {
        storeBlocks.forEach(block => {
           const idMatch = block.match(/<id>(.*?)<\/id>/);
           const nameMatch = block.match(/<name>(.*?)<\/name>/);
           
           if (idMatch && nameMatch) {
             stores.push({
               id: idMatch[1],
               name: nameMatch[1]
             });
           }
        });
      }

      set({ 
        connectionStatus: 'connected', 
        availableStores: stores.length > 0 ? stores : []
      });
      return true;

    } catch (err: any) {
      set({ connectionStatus: 'error', errorMessage: err.message });
      return false;
    }
  },

  saveConfig: async (payload) => {
    set({ loading: true });
    
    // Check if exists
    const { data: existing } = await supabase.from('integration_syrve_config').select('id').maybeSingle();
    
    const updateData: any = {
       base_url: payload.serverUrl,
       api_login: payload.login,
       default_store_id: payload.storeId,
       is_active: true
    };
    
    // Only update password if provided
    if (payload.password) {
      // In a real app, encrypt this! For now, storing as hash/encrypted placeholder
      updateData.api_password_hash = payload.password; 
    }

    let error;
    if (existing) {
       const { error: updateError } = await supabase
         .from('integration_syrve_config')
         .update(updateData)
         .eq('id', existing.id);
       error = updateError;
    } else {
       if (!payload.password) throw new Error("Password required for new config");
       updateData.api_password_hash = payload.password;
       const { error: insertError } = await supabase
         .from('integration_syrve_config')
         .insert([updateData]);
       error = insertError;
    }

    if (error) {
      set({ errorMessage: error.message, loading: false });
      throw error;
    }

    set((state) => ({
      config: {
        ...state.config!,
        serverUrl: payload.serverUrl,
        login: payload.login,
        storeId: payload.storeId || null,
        autoSync: true
      },
      loading: false
    }));
  }
}));
