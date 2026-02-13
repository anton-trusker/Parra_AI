export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_image_size_mb: number | null
          model_name: string
          provider: string
          rate_limit_per_minute: number | null
          settings: Json | null
          supported_formats: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_image_size_mb?: number | null
          model_name?: string
          provider?: string
          rate_limit_per_minute?: number | null
          settings?: Json | null
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_image_size_mb?: number | null
          model_name?: string
          provider?: string
          rate_limit_per_minute?: number | null
          settings?: Json | null
          supported_formats?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_recognition_attempts: {
        Row: {
          created_at: string | null
          error_message: string | null
          extracted_data: Json | null
          id: string
          image_base64: string | null
          image_url: string | null
          match_confidence: number | null
          match_method: string | null
          matched_product_id: string | null
          model_used: string | null
          processed_at: string | null
          processing_time_ms: number | null
          prompt_version: string | null
          raw_response: Json | null
          session_id: string | null
          status: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          match_confidence?: number | null
          match_method?: string | null
          matched_product_id?: string | null
          model_used?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          prompt_version?: string | null
          raw_response?: Json | null
          session_id?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          image_base64?: string | null
          image_url?: string | null
          match_confidence?: number | null
          match_method?: string | null
          matched_product_id?: string | null
          model_used?: string | null
          processed_at?: string | null
          processing_time_ms?: number | null
          prompt_version?: string | null
          raw_response?: Json | null
          session_id?: string | null
          status?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recognition_attempts_matched_product_id_fkey"
            columns: ["matched_product_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recognition_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_roles_config: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_builtin: boolean
          permissions: Json
          role_name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_builtin?: boolean
          permissions?: Json
          role_name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_builtin?: boolean
          permissions?: Json
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_fields: string[] | null
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          performed_at: string
          reason: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          reason?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_at?: string
          reason?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          parent_id: string | null
          parent_syrve_id: string | null
          sort_order: number | null
          synced_at: string | null
          syrve_data: Json | null
          syrve_group_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          parent_id?: string | null
          parent_syrve_id?: string | null
          sort_order?: number | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_group_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          parent_id?: string | null
          parent_syrve_id?: string | null
          sort_order?: number | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_group_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string
          error_code: string | null
          error_message: string | null
          error_stack: string | null
          error_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          error_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      glass_dimensions: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          volume_litres: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          volume_litres: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          volume_litres?: number
        }
        Relationships: []
      }
      grape_varieties: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      inventory_baseline_items: {
        Row: {
          created_at: string
          expected_liters: number | null
          expected_qty: number
          id: string
          product_id: string
          raw_stock_payload: Json | null
          session_id: string
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          expected_liters?: number | null
          expected_qty?: number
          id?: string
          product_id: string
          raw_stock_payload?: Json | null
          session_id: string
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          expected_liters?: number | null
          expected_qty?: number
          id?: string
          product_id?: string
          raw_stock_payload?: Json | null
          session_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_baseline_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_baseline_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_baseline_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "wine_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_events: {
        Row: {
          bottle_qty: number
          confidence: number | null
          created_at: string
          derived_liters: number | null
          id: string
          metadata: Json | null
          notes: string | null
          open_ml: number | null
          photo_url: string | null
          product_id: string
          session_id: string
          source: string
          user_id: string
          variant_id: string | null
        }
        Insert: {
          bottle_qty?: number
          confidence?: number | null
          created_at?: string
          derived_liters?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          open_ml?: number | null
          photo_url?: string | null
          product_id: string
          session_id: string
          source?: string
          user_id: string
          variant_id?: string | null
        }
        Update: {
          bottle_qty?: number
          confidence?: number | null
          created_at?: string
          derived_liters?: number | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          open_ml?: number | null
          photo_url?: string | null
          product_id?: string
          session_id?: string
          source?: string
          user_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_events_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "wine_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          confidence: number | null
          count_status: string | null
          counted_at: string | null
          counted_by: string | null
          counted_quantity_opened: number | null
          counted_quantity_unopened: number | null
          counting_duration_seconds: number | null
          counting_method:
            | Database["public"]["Enums"]["counting_method_enum"]
            | null
          expected_quantity_opened: number
          expected_quantity_unopened: number
          has_variance: boolean | null
          id: string
          location: string | null
          notes: string | null
          session_id: string
          variance_opened: number | null
          variance_total: number | null
          variance_unopened: number | null
          variant_id: string | null
          wine_id: string
        }
        Insert: {
          confidence?: number | null
          count_status?: string | null
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity_opened?: number | null
          counted_quantity_unopened?: number | null
          counting_duration_seconds?: number | null
          counting_method?:
            | Database["public"]["Enums"]["counting_method_enum"]
            | null
          expected_quantity_opened?: number
          expected_quantity_unopened?: number
          has_variance?: boolean | null
          id?: string
          location?: string | null
          notes?: string | null
          session_id: string
          variance_opened?: number | null
          variance_total?: number | null
          variance_unopened?: number | null
          variant_id?: string | null
          wine_id: string
        }
        Update: {
          confidence?: number | null
          count_status?: string | null
          counted_at?: string | null
          counted_by?: string | null
          counted_quantity_opened?: number | null
          counted_quantity_unopened?: number | null
          counting_duration_seconds?: number | null
          counting_method?:
            | Database["public"]["Enums"]["counting_method_enum"]
            | null
          expected_quantity_opened?: number
          expected_quantity_unopened?: number
          has_variance?: boolean | null
          id?: string
          location?: string | null
          notes?: string | null
          session_id?: string
          variance_opened?: number | null
          variance_total?: number | null
          variance_unopened?: number | null
          variant_id?: string | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "wine_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          ai_confidence_score: number | null
          barcode_scanned: string | null
          bottle_state: Database["public"]["Enums"]["bottle_state_enum"] | null
          captured_image_id: string | null
          id: string
          location: string | null
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          performed_at: string
          performed_by: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          reason: string | null
          recording_method: string | null
          reference_number: string | null
          session_id: string | null
          total_value: number | null
          unit_cost: number | null
          variant_id: string | null
          wine_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          barcode_scanned?: string | null
          bottle_state?: Database["public"]["Enums"]["bottle_state_enum"] | null
          captured_image_id?: string | null
          id?: string
          location?: string | null
          movement_type: Database["public"]["Enums"]["movement_type_enum"]
          performed_at?: string
          performed_by?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change: number
          reason?: string | null
          recording_method?: string | null
          reference_number?: string | null
          session_id?: string | null
          total_value?: number | null
          unit_cost?: number | null
          variant_id?: string | null
          wine_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          barcode_scanned?: string | null
          bottle_state?: Database["public"]["Enums"]["bottle_state_enum"] | null
          captured_image_id?: string | null
          id?: string
          location?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type_enum"]
          performed_at?: string
          performed_by?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          reason?: string | null
          recording_method?: string | null
          reference_number?: string | null
          session_id?: string | null
          total_value?: number | null
          unit_cost?: number | null
          variant_id?: string | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_captured_image_id_fkey"
            columns: ["captured_image_id"]
            isOneToOne: false
            referencedRelation: "wine_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "wine_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_product_aggregates: {
        Row: {
          counted_liters_total: number
          counted_qty_total: number
          event_count: number
          id: string
          last_updated_at: string
          product_id: string
          session_id: string
          variant_id: string | null
        }
        Insert: {
          counted_liters_total?: number
          counted_qty_total?: number
          event_count?: number
          id?: string
          last_updated_at?: string
          product_id: string
          session_id: string
          variant_id?: string | null
        }
        Update: {
          counted_liters_total?: number
          counted_qty_total?: number
          event_count?: number
          id?: string
          last_updated_at?: string
          product_id?: string
          session_id?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_aggregates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_aggregates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_aggregates_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "wine_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_sessions: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          duration_seconds: number | null
          flagged_reason: string | null
          id: string
          location_filter: string | null
          session_name: string
          session_type: string | null
          started_at: string | null
          started_by: string | null
          status: Database["public"]["Enums"]["session_status_enum"]
          total_wines_counted: number
          total_wines_expected: number
          updated_at: string
          wine_filter: Json | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          flagged_reason?: string | null
          id?: string
          location_filter?: string | null
          session_name: string
          session_type?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status_enum"]
          total_wines_counted?: number
          total_wines_expected?: number
          updated_at?: string
          wine_filter?: Json | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          flagged_reason?: string | null
          id?: string
          location_filter?: string | null
          session_name?: string
          session_type?: string | null
          started_at?: string | null
          started_by?: string | null
          status?: Database["public"]["Enums"]["session_status_enum"]
          total_wines_counted?: number
          total_wines_expected?: number
          updated_at?: string
          wine_filter?: Json | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          type: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          type?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      product_barcodes: {
        Row: {
          barcode: string
          container_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          product_id: string
          source: string | null
        }
        Insert: {
          barcode: string
          container_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          product_id: string
          source?: string | null
        }
        Update: {
          barcode?: string
          container_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          product_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          code: string | null
          created_at: string | null
          current_stock: number | null
          default_sale_price: number | null
          description: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          main_unit_id: string | null
          metadata: Json | null
          name: string
          not_in_store_movement: boolean | null
          price_updated_at: string | null
          product_type: string | null
          purchase_price: number | null
          sale_price: number | null
          sku: string | null
          stock_updated_at: string | null
          synced_at: string | null
          syrve_data: Json | null
          syrve_product_id: string
          unit_capacity: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          code?: string | null
          created_at?: string | null
          current_stock?: number | null
          default_sale_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          main_unit_id?: string | null
          metadata?: Json | null
          name: string
          not_in_store_movement?: boolean | null
          price_updated_at?: string | null
          product_type?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_updated_at?: string | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_product_id: string
          unit_capacity?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          code?: string | null
          created_at?: string | null
          current_stock?: number | null
          default_sale_price?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          main_unit_id?: string | null
          metadata?: Json | null
          name?: string
          not_in_store_movement?: boolean | null
          price_updated_at?: string | null
          product_type?: string | null
          purchase_price?: number | null
          sale_price?: number | null
          sku?: string | null
          stock_updated_at?: string | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_product_id?: string
          unit_capacity?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_color: string | null
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          department: string | null
          display_name: string | null
          employee_id: string | null
          failed_login_attempts: number
          first_name: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          is_locked: boolean
          job_title: string | null
          language: string | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          preferences: Json | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name?: string | null
          employee_id?: string | null
          failed_login_attempts?: number
          first_name?: string | null
          hire_date?: string | null
          id: string
          is_active?: boolean
          is_locked?: boolean
          job_title?: string | null
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_color?: string | null
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          display_name?: string | null
          employee_id?: string | null
          failed_login_attempts?: number
          first_name?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          is_locked?: boolean
          job_title?: string | null
          language?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_snapshots: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          snapshot_date: string
          snapshot_time: string
          snapshot_type: string | null
          stock_opened: number
          stock_unopened: number
          total_stock: number | null
          total_value: number | null
          triggered_by: string | null
          unit_cost: number | null
          wine_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          snapshot_date?: string
          snapshot_time?: string
          snapshot_type?: string | null
          stock_opened?: number
          stock_unopened?: number
          total_stock?: number | null
          total_value?: number | null
          triggered_by?: string | null
          unit_cost?: number | null
          wine_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          snapshot_date?: string
          snapshot_time?: string
          snapshot_type?: string | null
          stock_opened?: number
          stock_unopened?: number
          total_stock?: number | null
          total_value?: number | null
          triggered_by?: string | null
          unit_cost?: number | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_snapshots_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_snapshots_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          code: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          store_type: string | null
          synced_at: string | null
          syrve_data: Json | null
          syrve_store_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          store_type?: string | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_store_id: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_type?: string | null
          synced_at?: string | null
          syrve_data?: Json | null
          syrve_store_id?: string
        }
        Relationships: []
      }
      sub_locations: {
        Row: {
          id: string
          is_active: boolean
          location_id: string
          name: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          location_id: string
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean
          location_id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_locations_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      syrve_api_logs: {
        Row: {
          action_type: string
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          request_method: string | null
          request_url: string | null
          response_payload_preview: string | null
          response_status: number | null
          status: string
          sync_run_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          request_method?: string | null
          request_url?: string | null
          response_payload_preview?: string | null
          response_status?: number | null
          status?: string
          sync_run_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          request_method?: string | null
          request_url?: string | null
          response_payload_preview?: string | null
          response_status?: number | null
          status?: string
          sync_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syrve_api_logs_sync_run_id_fkey"
            columns: ["sync_run_id"]
            isOneToOne: false
            referencedRelation: "syrve_sync_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      syrve_config: {
        Row: {
          api_login: string
          api_password_hash: string | null
          auto_create_wines: boolean | null
          auto_sync_enabled: boolean | null
          connection_status: string | null
          connection_tested_at: string | null
          created_at: string | null
          default_store_id: string | null
          default_store_name: string | null
          field_mapping: Json | null
          id: string
          import_inactive_products: boolean | null
          product_type_filters: string[] | null
          reimport_mode: string
          selected_category_ids: string[] | null
          selected_store_ids: string[] | null
          server_url: string
          settings: Json | null
          sync_direction: string | null
          sync_interval_minutes: number | null
          sync_lock_until: string | null
          testing_mode: boolean
          updated_at: string | null
        }
        Insert: {
          api_login?: string
          api_password_hash?: string | null
          auto_create_wines?: boolean | null
          auto_sync_enabled?: boolean | null
          connection_status?: string | null
          connection_tested_at?: string | null
          created_at?: string | null
          default_store_id?: string | null
          default_store_name?: string | null
          field_mapping?: Json | null
          id?: string
          import_inactive_products?: boolean | null
          product_type_filters?: string[] | null
          reimport_mode?: string
          selected_category_ids?: string[] | null
          selected_store_ids?: string[] | null
          server_url?: string
          settings?: Json | null
          sync_direction?: string | null
          sync_interval_minutes?: number | null
          sync_lock_until?: string | null
          testing_mode?: boolean
          updated_at?: string | null
        }
        Update: {
          api_login?: string
          api_password_hash?: string | null
          auto_create_wines?: boolean | null
          auto_sync_enabled?: boolean | null
          connection_status?: string | null
          connection_tested_at?: string | null
          created_at?: string | null
          default_store_id?: string | null
          default_store_name?: string | null
          field_mapping?: Json | null
          id?: string
          import_inactive_products?: boolean | null
          product_type_filters?: string[] | null
          reimport_mode?: string
          selected_category_ids?: string[] | null
          selected_store_ids?: string[] | null
          server_url?: string
          settings?: Json | null
          sync_direction?: string | null
          sync_interval_minutes?: number | null
          sync_lock_until?: string | null
          testing_mode?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      syrve_outbox_jobs: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          job_type: string
          last_attempt_at: string | null
          last_error: string | null
          max_attempts: number | null
          payload_hash: string | null
          payload_xml: string | null
          response_xml: string | null
          session_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_type: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          payload_hash?: string | null
          payload_xml?: string | null
          response_xml?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          job_type?: string
          last_attempt_at?: string | null
          last_error?: string | null
          max_attempts?: number | null
          payload_hash?: string | null
          payload_xml?: string | null
          response_xml?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "syrve_outbox_jobs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      syrve_raw_objects: {
        Row: {
          entity_type: string
          id: string
          is_deleted: boolean | null
          payload: Json
          payload_hash: string | null
          synced_at: string | null
          syrve_id: string
        }
        Insert: {
          entity_type: string
          id?: string
          is_deleted?: boolean | null
          payload: Json
          payload_hash?: string | null
          synced_at?: string | null
          syrve_id: string
        }
        Update: {
          entity_type?: string
          id?: string
          is_deleted?: boolean | null
          payload?: Json
          payload_hash?: string | null
          synced_at?: string | null
          syrve_id?: string
        }
        Relationships: []
      }
      syrve_sync_runs: {
        Row: {
          created_at: string | null
          error: string | null
          finished_at: string | null
          id: string
          run_type: string
          started_at: string | null
          stats: Json | null
          status: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          run_type: string
          started_at?: string | null
          stats?: Json | null
          status?: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          run_type?: string
          started_at?: string | null
          stats?: Json | null
          status?: string
          triggered_by?: string | null
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string | null
          notification_type: string | null
          priority: string | null
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string | null
          notification_type?: string | null
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string | null
          notification_type?: string | null
          priority?: string | null
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          action: string
          changes: Json | null
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          performed_at: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          performed_at?: string
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          performed_at?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      volume_options: {
        Row: {
          bottle_size: string | null
          id: string
          is_active: boolean
          label: string
          ml: number
        }
        Insert: {
          bottle_size?: string | null
          id?: string
          is_active?: boolean
          label: string
          ml: number
        }
        Update: {
          bottle_size?: string | null
          id?: string
          is_active?: boolean
          label?: string
          ml?: number
        }
        Relationships: []
      }
      wine_barcodes: {
        Row: {
          added_at: string
          barcode: string
          barcode_type: string | null
          distributor: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          packaging: string | null
          region: string | null
          wine_id: string
        }
        Insert: {
          added_at?: string
          barcode: string
          barcode_type?: string | null
          distributor?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          packaging?: string | null
          region?: string | null
          wine_id: string
        }
        Update: {
          added_at?: string
          barcode?: string
          barcode_type?: string | null
          distributor?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          packaging?: string | null
          region?: string | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_barcodes_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_images: {
        Row: {
          ai_confidence_score: number | null
          ai_recognition_successful: boolean | null
          captured_during_inventory: boolean
          display_order: number | null
          file_size_bytes: number | null
          filename: string | null
          height_px: number | null
          id: string
          image_path: string | null
          image_type: string | null
          image_url: string | null
          inventory_session_id: string | null
          is_approved: boolean
          is_primary: boolean
          mime_type: string | null
          ocr_text: string | null
          original_filename: string | null
          source: string | null
          storage_key: string | null
          storage_provider: string | null
          uploaded_at: string
          uploaded_by: string | null
          width_px: number | null
          wine_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_recognition_successful?: boolean | null
          captured_during_inventory?: boolean
          display_order?: number | null
          file_size_bytes?: number | null
          filename?: string | null
          height_px?: number | null
          id?: string
          image_path?: string | null
          image_type?: string | null
          image_url?: string | null
          inventory_session_id?: string | null
          is_approved?: boolean
          is_primary?: boolean
          mime_type?: string | null
          ocr_text?: string | null
          original_filename?: string | null
          source?: string | null
          storage_key?: string | null
          storage_provider?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          width_px?: number | null
          wine_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_recognition_successful?: boolean | null
          captured_during_inventory?: boolean
          display_order?: number | null
          file_size_bytes?: number | null
          filename?: string | null
          height_px?: number | null
          id?: string
          image_path?: string | null
          image_type?: string | null
          image_url?: string | null
          inventory_session_id?: string | null
          is_approved?: boolean
          is_primary?: boolean
          mime_type?: string | null
          ocr_text?: string | null
          original_filename?: string | null
          source?: string | null
          storage_key?: string | null
          storage_provider?: string | null
          uploaded_at?: string
          uploaded_by?: string | null
          width_px?: number | null
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wine_images_session"
            columns: ["inventory_session_id"]
            isOneToOne: false
            referencedRelation: "inventory_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wine_images_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_producers: {
        Row: {
          country: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          region: string | null
          slug: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          region?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          region?: string | null
          slug?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      wine_variants: {
        Row: {
          base_wine_id: string
          bottle_state: Database["public"]["Enums"]["bottle_state_enum"] | null
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          min_stock_level: number | null
          purchase_price: number | null
          sale_price: number | null
          syrve_product_id: string | null
          updated_at: string
          variant_barcode: string | null
          variant_name: string | null
          variant_sku: string | null
          vintage: number | null
          volume_ml: number | null
        }
        Insert: {
          base_wine_id: string
          bottle_state?: Database["public"]["Enums"]["bottle_state_enum"] | null
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          min_stock_level?: number | null
          purchase_price?: number | null
          sale_price?: number | null
          syrve_product_id?: string | null
          updated_at?: string
          variant_barcode?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          vintage?: number | null
          volume_ml?: number | null
        }
        Update: {
          base_wine_id?: string
          bottle_state?: Database["public"]["Enums"]["bottle_state_enum"] | null
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          min_stock_level?: number | null
          purchase_price?: number | null
          sale_price?: number | null
          syrve_product_id?: string | null
          updated_at?: string
          variant_barcode?: string | null
          variant_name?: string | null
          variant_sku?: string | null
          vintage?: number | null
          volume_ml?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "wine_variants_base_wine_id_fkey"
            columns: ["base_wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wines: {
        Row: {
          acidity: string | null
          aging_potential_years: number | null
          aging_vessel: string | null
          alcohol_content: number | null
          alternative_barcodes: Json | null
          appellation: string | null
          available_by_glass: boolean
          awards: Json | null
          barcode_type: string | null
          bin_location: string | null
          body: string | null
          bottle_color: string | null
          bottle_size: string | null
          bottling_date: string | null
          capsule_type: string | null
          cases_produced: number | null
          cellar_section: string | null
          certifications: Json | null
          closure_type: string | null
          color_description: string | null
          country: string | null
          country_code: string | null
          created_at: string
          created_by: string | null
          critic_scores: Json | null
          currency: string | null
          current_stock_opened: number
          current_stock_unopened: number
          decanter_score: number | null
          decanting_time_minutes: number | null
          deleted_at: string | null
          deleted_by: string | null
          embedding: string | null
          estate: string | null
          featured_wine: boolean
          fermentation_vessel: string | null
          finish_description: string | null
          food_pairing: string | null
          food_pairing_tags: Json | null
          full_name: string | null
          glass_pour_size_ml: number | null
          glass_price: number | null
          grape_varieties: Json | null
          id: string
          internal_code: string | null
          internal_notes: string | null
          internal_rating: number | null
          is_active: boolean
          is_archived: boolean
          is_biodynamic: boolean
          is_discontinued: boolean
          is_natural: boolean
          is_non_vintage: boolean
          is_organic: boolean
          is_vegan: boolean
          james_suckling_score: number | null
          jancis_robinson_score: number | null
          label_design: string | null
          last_purchase_date: string | null
          last_purchase_price: number | null
          last_purchase_quantity: number | null
          malolactic_fermentation: boolean | null
          marketing_description: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          name: string
          nose_aromas: string | null
          oak_aging_months: number | null
          oak_toast_level: string | null
          oak_type: string | null
          optimal_drinking_end: number | null
          optimal_drinking_start: number | null
          palate_flavors: string | null
          ph_level: number | null
          price_tier: string | null
          primary_barcode: string | null
          producer: string | null
          producer_slug: string | null
          production_method: string | null
          purchase_price: number | null
          rack_number: string | null
          region: string | null
          release_date: string | null
          reorder_point: number | null
          reorder_quantity: number | null
          replacement_wine_id: string | null
          residual_sugar: number | null
          retail_price: number | null
          sale_price: number | null
          search_keywords: string | null
          search_text: string | null
          serving_temperature_max: number | null
          serving_temperature_min: number | null
          shelf_position: string | null
          short_description: string | null
          sku: string | null
          slug: string | null
          stock_status: string | null
          story: string | null
          sub_region: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_sku: string | null
          sweetness: string | null
          tags: Json | null
          tannins: string | null
          tasting_notes: string | null
          terroir: string | null
          total_acidity: number | null
          updated_at: string
          updated_by: string | null
          vineyard: string | null
          vintage: number | null
          vivino_rating: number | null
          vivino_url: string | null
          volume_label: string | null
          volume_ml: number | null
          website_url: string | null
          wine_advocate_score: number | null
          wine_list_category: string | null
          wine_list_position: number | null
          wine_spectator_score: number | null
          wine_type: Database["public"]["Enums"]["wine_type_enum"] | null
          winemaker_name: string | null
        }
        Insert: {
          acidity?: string | null
          aging_potential_years?: number | null
          aging_vessel?: string | null
          alcohol_content?: number | null
          alternative_barcodes?: Json | null
          appellation?: string | null
          available_by_glass?: boolean
          awards?: Json | null
          barcode_type?: string | null
          bin_location?: string | null
          body?: string | null
          bottle_color?: string | null
          bottle_size?: string | null
          bottling_date?: string | null
          capsule_type?: string | null
          cases_produced?: number | null
          cellar_section?: string | null
          certifications?: Json | null
          closure_type?: string | null
          color_description?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          critic_scores?: Json | null
          currency?: string | null
          current_stock_opened?: number
          current_stock_unopened?: number
          decanter_score?: number | null
          decanting_time_minutes?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          embedding?: string | null
          estate?: string | null
          featured_wine?: boolean
          fermentation_vessel?: string | null
          finish_description?: string | null
          food_pairing?: string | null
          food_pairing_tags?: Json | null
          full_name?: string | null
          glass_pour_size_ml?: number | null
          glass_price?: number | null
          grape_varieties?: Json | null
          id?: string
          internal_code?: string | null
          internal_notes?: string | null
          internal_rating?: number | null
          is_active?: boolean
          is_archived?: boolean
          is_biodynamic?: boolean
          is_discontinued?: boolean
          is_natural?: boolean
          is_non_vintage?: boolean
          is_organic?: boolean
          is_vegan?: boolean
          james_suckling_score?: number | null
          jancis_robinson_score?: number | null
          label_design?: string | null
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          last_purchase_quantity?: number | null
          malolactic_fermentation?: boolean | null
          marketing_description?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name: string
          nose_aromas?: string | null
          oak_aging_months?: number | null
          oak_toast_level?: string | null
          oak_type?: string | null
          optimal_drinking_end?: number | null
          optimal_drinking_start?: number | null
          palate_flavors?: string | null
          ph_level?: number | null
          price_tier?: string | null
          primary_barcode?: string | null
          producer?: string | null
          producer_slug?: string | null
          production_method?: string | null
          purchase_price?: number | null
          rack_number?: string | null
          region?: string | null
          release_date?: string | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          replacement_wine_id?: string | null
          residual_sugar?: number | null
          retail_price?: number | null
          sale_price?: number | null
          search_keywords?: string | null
          search_text?: string | null
          serving_temperature_max?: number | null
          serving_temperature_min?: number | null
          shelf_position?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          stock_status?: string | null
          story?: string | null
          sub_region?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_sku?: string | null
          sweetness?: string | null
          tags?: Json | null
          tannins?: string | null
          tasting_notes?: string | null
          terroir?: string | null
          total_acidity?: number | null
          updated_at?: string
          updated_by?: string | null
          vineyard?: string | null
          vintage?: number | null
          vivino_rating?: number | null
          vivino_url?: string | null
          volume_label?: string | null
          volume_ml?: number | null
          website_url?: string | null
          wine_advocate_score?: number | null
          wine_list_category?: string | null
          wine_list_position?: number | null
          wine_spectator_score?: number | null
          wine_type?: Database["public"]["Enums"]["wine_type_enum"] | null
          winemaker_name?: string | null
        }
        Update: {
          acidity?: string | null
          aging_potential_years?: number | null
          aging_vessel?: string | null
          alcohol_content?: number | null
          alternative_barcodes?: Json | null
          appellation?: string | null
          available_by_glass?: boolean
          awards?: Json | null
          barcode_type?: string | null
          bin_location?: string | null
          body?: string | null
          bottle_color?: string | null
          bottle_size?: string | null
          bottling_date?: string | null
          capsule_type?: string | null
          cases_produced?: number | null
          cellar_section?: string | null
          certifications?: Json | null
          closure_type?: string | null
          color_description?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          created_by?: string | null
          critic_scores?: Json | null
          currency?: string | null
          current_stock_opened?: number
          current_stock_unopened?: number
          decanter_score?: number | null
          decanting_time_minutes?: number | null
          deleted_at?: string | null
          deleted_by?: string | null
          embedding?: string | null
          estate?: string | null
          featured_wine?: boolean
          fermentation_vessel?: string | null
          finish_description?: string | null
          food_pairing?: string | null
          food_pairing_tags?: Json | null
          full_name?: string | null
          glass_pour_size_ml?: number | null
          glass_price?: number | null
          grape_varieties?: Json | null
          id?: string
          internal_code?: string | null
          internal_notes?: string | null
          internal_rating?: number | null
          is_active?: boolean
          is_archived?: boolean
          is_biodynamic?: boolean
          is_discontinued?: boolean
          is_natural?: boolean
          is_non_vintage?: boolean
          is_organic?: boolean
          is_vegan?: boolean
          james_suckling_score?: number | null
          jancis_robinson_score?: number | null
          label_design?: string | null
          last_purchase_date?: string | null
          last_purchase_price?: number | null
          last_purchase_quantity?: number | null
          malolactic_fermentation?: boolean | null
          marketing_description?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          name?: string
          nose_aromas?: string | null
          oak_aging_months?: number | null
          oak_toast_level?: string | null
          oak_type?: string | null
          optimal_drinking_end?: number | null
          optimal_drinking_start?: number | null
          palate_flavors?: string | null
          ph_level?: number | null
          price_tier?: string | null
          primary_barcode?: string | null
          producer?: string | null
          producer_slug?: string | null
          production_method?: string | null
          purchase_price?: number | null
          rack_number?: string | null
          region?: string | null
          release_date?: string | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          replacement_wine_id?: string | null
          residual_sugar?: number | null
          retail_price?: number | null
          sale_price?: number | null
          search_keywords?: string | null
          search_text?: string | null
          serving_temperature_max?: number | null
          serving_temperature_min?: number | null
          shelf_position?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string | null
          stock_status?: string | null
          story?: string | null
          sub_region?: string | null
          supplier_id?: string | null
          supplier_name?: string | null
          supplier_sku?: string | null
          sweetness?: string | null
          tags?: Json | null
          tannins?: string | null
          tasting_notes?: string | null
          terroir?: string | null
          total_acidity?: number | null
          updated_at?: string
          updated_by?: string | null
          vineyard?: string | null
          vintage?: number | null
          vivino_rating?: number | null
          vivino_url?: string | null
          volume_label?: string | null
          volume_ml?: number | null
          website_url?: string | null
          wine_advocate_score?: number | null
          wine_list_category?: string | null
          wine_list_position?: number | null
          wine_spectator_score?: number | null
          wine_type?: Database["public"]["Enums"]["wine_type_enum"] | null
          winemaker_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wines_replacement_wine_id_fkey"
            columns: ["replacement_wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wines_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_wine_search_text: {
        Args: {
          p_appellation: string
          p_country: string
          p_grape_varieties: Json
          p_name: string
          p_producer: string
          p_region: string
          p_vintage: number
          p_volume_ml: number
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_wines_embedding: {
        Args: { p_limit?: number; p_query_embedding: string }
        Returns: {
          cosine_score: number
          country: string
          producer: string
          region: string
          vintage: number
          volume_label: string
          volume_ml: number
          wine_id: string
          wine_name: string
        }[]
      }
      match_wines_trigram: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          country: string
          producer: string
          region: string
          similarity_score: number
          vintage: number
          volume_label: string
          volume_ml: number
          wine_id: string
          wine_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "super_admin"
      bottle_state_enum: "unopened" | "opened"
      counting_method_enum: "manual" | "barcode" | "image_ai"
      movement_type_enum:
        | "count_adjustment"
        | "sale"
        | "purchase"
        | "transfer"
        | "write_off"
        | "correction"
      session_status_enum:
        | "draft"
        | "in_progress"
        | "completed"
        | "paused"
        | "approved"
        | "flagged"
      wine_type_enum:
        | "red"
        | "white"
        | "rose"
        | "sparkling"
        | "fortified"
        | "dessert"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "super_admin"],
      bottle_state_enum: ["unopened", "opened"],
      counting_method_enum: ["manual", "barcode", "image_ai"],
      movement_type_enum: [
        "count_adjustment",
        "sale",
        "purchase",
        "transfer",
        "write_off",
        "correction",
      ],
      session_status_enum: [
        "draft",
        "in_progress",
        "completed",
        "paused",
        "approved",
        "flagged",
      ],
      wine_type_enum: [
        "red",
        "white",
        "rose",
        "sparkling",
        "fortified",
        "dessert",
      ],
    },
  },
} as const
