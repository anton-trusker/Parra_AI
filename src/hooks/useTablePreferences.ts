import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TablePreferences {
  id?: string;
  user_id: string;
  table_name: string;
  column_visibility: Record<string, boolean>;
  column_order: string[];
  column_widths: Record<string, number>;
  sort_config?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  filter_config?: Record<string, any>;
  page_size: number;
  compact_mode: boolean;
  zebra_striping: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseTablePreferencesOptions {
  tableName: string;
  defaultPreferences?: Partial<TablePreferences>;
}

export function useTablePreferences({ tableName, defaultPreferences }: UseTablePreferencesOptions) {
  const queryClient = useQueryClient();
  
  // Get current user ID (you'll need to implement this based on your auth system)
  const getUserId = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || 'default-user';
  }, []);

  // Fetch preferences for the current table
  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['table-preferences', tableName],
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from('table_preferences')
        .select('*')
        .eq('user_id', userId)
        .eq('table_name', tableName)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default ones
        const defaultPrefs: TablePreferences = {
          user_id: userId,
          table_name: tableName,
          column_visibility: defaultPreferences?.column_visibility || {},
          column_order: defaultPreferences?.column_order || [],
          column_widths: defaultPreferences?.column_widths || {},
          sort_config: defaultPreferences?.sort_config,
          filter_config: defaultPreferences?.filter_config,
          page_size: defaultPreferences?.page_size || 20,
          compact_mode: defaultPreferences?.compact_mode || false,
          zebra_striping: defaultPreferences?.zebra_striping || false,
        };

        const { data: newPrefs, error: createError } = await supabase
          .from('table_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (createError) throw createError;
        return newPrefs;
      }

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update preferences
  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<TablePreferences>) => {
      const userId = await getUserId();
      const updatedPrefs = {
        ...preferences,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (preferences?.id) {
        // Update existing preferences
        const { data, error } = await supabase
          .from('table_preferences')
          .update(updatedPrefs)
          .eq('id', preferences.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new preferences
        const { data, error } = await supabase
          .from('table_preferences')
          .insert({
            ...updatedPrefs,
            user_id: userId,
            table_name: tableName,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['table-preferences', tableName], data);
      queryClient.invalidateQueries({ queryKey: ['table-preferences', tableName] });
    },
  });

  // Helper functions for common updates
  const updateColumnVisibility = useCallback((columnId: string, visible: boolean) => {
    const newVisibility = {
      ...preferences?.column_visibility,
      [columnId]: visible,
    };
    updatePreferences.mutate({ column_visibility: newVisibility });
  }, [preferences?.column_visibility, updatePreferences]);

  const updateColumnOrder = useCallback((newOrder: string[]) => {
    updatePreferences.mutate({ column_order: newOrder });
  }, [updatePreferences]);

  const updateColumnWidth = useCallback((columnId: string, width: number) => {
    const newWidths = {
      ...preferences?.column_widths,
      [columnId]: width,
    };
    updatePreferences.mutate({ column_widths: newWidths });
  }, [preferences?.column_widths, updatePreferences]);

  const updateSortConfig = useCallback((column: string, direction: 'asc' | 'desc') => {
    updatePreferences.mutate({ 
      sort_config: { column, direction } 
    });
  }, [updatePreferences]);

  const updateFilterConfig = useCallback((filters: Record<string, any>) => {
    updatePreferences.mutate({ filter_config: filters });
  }, [updatePreferences]);

  const updatePageSize = useCallback((size: number) => {
    updatePreferences.mutate({ page_size: size });
  }, [updatePreferences]);

  const updateCompactMode = useCallback((compact: boolean) => {
    updatePreferences.mutate({ compact_mode: compact });
  }, [updatePreferences]);

  const updateZebraStriping = useCallback((zebra: boolean) => {
    updatePreferences.mutate({ zebra_striping: zebra });
  }, [updatePreferences]);

  const resetPreferences = useCallback(() => {
    const defaultPrefs: Partial<TablePreferences> = {
      column_visibility: defaultPreferences?.column_visibility || {},
      column_order: defaultPreferences?.column_order || [],
      column_widths: defaultPreferences?.column_widths || {},
      sort_config: defaultPreferences?.sort_config,
      filter_config: defaultPreferences?.filter_config,
      page_size: defaultPreferences?.page_size || 20,
      compact_mode: defaultPreferences?.compact_mode || false,
      zebra_striping: defaultPreferences?.zebra_striping || false,
    };
    updatePreferences.mutate(defaultPrefs);
  }, [defaultPreferences, updatePreferences]);

  return {
    preferences: preferences || ({} as TablePreferences),
    isLoading,
    error,
    updatePreferences: updatePreferences.mutate,
    updateColumnVisibility,
    updateColumnOrder,
    updateColumnWidth,
    updateSortConfig,
    updateFilterConfig,
    updatePageSize,
    updateCompactMode,
    updateZebraStriping,
    resetPreferences,
  };
}
