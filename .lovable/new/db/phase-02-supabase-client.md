# Phase 2: Supabase Client Setup

## Overview

Configure the Supabase JavaScript client with TypeScript types generated from the database schema.

---

## Prerequisites

- [ ] Phase 1 completed (database schema in place)
- [ ] Environment variables configured

---

## Environment Configuration

### `.env.local`

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Security:** Never commit `.env.local` to git.

---

## File Structure

```
src/integrations/supabase/
├── client.ts           # Supabase client instance
├── types.ts            # Generated TypeScript types
└── hooks/              # Query hooks (Phase 7)
```

---

## Implementation

### `src/integrations/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'wine-inventory'
    }
  }
});

// Re-export for convenience
export type { Database } from './types';
```

---

### Type Generation

#### Option A: Supabase CLI (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

#### Option B: Manual Type Definition

Create comprehensive types matching the database schema:

### `src/integrations/supabase/types.ts`

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'fortified' | 'dessert' | 'orange';
export type SessionStatus = 'draft' | 'in_progress' | 'pending_review' | 'completed' | 'cancelled' | 'approved' | 'flagged';
export type MovementType = 'count_adjustment' | 'sale' | 'purchase' | 'transfer' | 'write_off' | 'correction' | 'breakage';
export type CountingMethod = 'manual' | 'barcode' | 'image_ai';
export type BottleState = 'unopened' | 'opened';
export type AppRole = 'admin' | 'staff';

export interface Database {
  public: {
    Tables: {
      wines: {
        Row: {
          id: string;
          name: string;
          full_name: string | null;
          producer: string | null;
          wine_type: WineType | null;
          vintage: number | null;
          country: string | null;
          region: string | null;
          appellation: string | null;
          volume_ml: number | null;
          alcohol_content: number | null;
          purchase_price: number | null;
          sale_price: number | null;
          current_stock_unopened: number;
          current_stock_opened: number;
          min_stock_level: number | null;
          stock_status: string | null;
          primary_barcode: string | null;
          tasting_notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          // ... additional fields
        };
        Insert: Omit<Database['public']['Tables']['wines']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['wines']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'wines_supplier_id_fkey';
            columns: ['supplier_id'];
            referencedRelation: 'suppliers';
            referencedColumns: ['id'];
          }
        ];
      };

      inventory_sessions: {
        Row: {
          id: string;
          session_name: string;
          status: SessionStatus;
          total_wines_expected: number;
          total_wines_counted: number;
          started_at: string | null;
          completed_at: string | null;
          started_by: string | null;
          completed_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_sessions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['inventory_sessions']['Insert']>;
        Relationships: [];
      };

      inventory_items: {
        Row: {
          id: string;
          session_id: string;
          wine_id: string;
          expected_quantity_unopened: number;
          expected_quantity_opened: number;
          counted_quantity_unopened: number | null;
          counted_quantity_opened: number | null;
          variance_unopened: number;
          variance_opened: number;
          variance_total: number;
          has_variance: boolean;
          counting_method: CountingMethod;
          confidence: number | null;
          counted_at: string | null;
          counted_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_items']['Row'], 'id' | 'variance_unopened' | 'variance_opened' | 'variance_total' | 'has_variance' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['inventory_items']['Insert']>;
        Relationships: [
          {
            foreignKeyName: 'inventory_items_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'inventory_sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_wine_id_fkey';
            columns: ['wine_id'];
            referencedRelation: 'wines';
            referencedColumns: ['id'];
          }
        ];
      };

      inventory_movements: {
        Row: {
          id: string;
          wine_id: string;
          session_id: string | null;
          movement_type: MovementType;
          bottle_state: BottleState;
          quantity_before: number;
          quantity_change: number;
          quantity_after: number;
          reason: string | null;
          performed_by: string | null;
          performed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inventory_movements']['Row'], 'id' | 'performed_at'>;
        Update: Partial<Database['public']['Tables']['inventory_movements']['Insert']>;
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          first_name: string | null;
          last_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['profiles']['Row'];
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };

      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: AppRole;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_roles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['user_roles']['Insert']>;
        Relationships: [];
      };

      // Add remaining tables...
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      has_role: {
        Args: { _role: AppRole; _user_id?: string };
        Returns: boolean;
      };
    };

    Enums: {
      wine_type_enum: WineType;
      session_status_enum: SessionStatus;
      movement_type_enum: MovementType;
      counting_method_enum: CountingMethod;
      bottle_state_enum: BottleState;
      app_role: AppRole;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Commonly used types
export type Wine = Tables<'wines'>;
export type WineInsert = Insertable<'wines'>;
export type WineUpdate = Updatable<'wines'>;

export type InventorySession = Tables<'inventory_sessions'>;
export type InventoryItem = Tables<'inventory_items'>;
export type InventoryMovement = Tables<'inventory_movements'>;

export type Profile = Tables<'profiles'>;
export type UserRole = Tables<'user_roles'>;
```

---

## Usage Examples

### Basic Query

```typescript
import { supabase } from '@/integrations/supabase/client';
import type { Wine } from '@/integrations/supabase/types';

// Fetch wines
const { data, error } = await supabase
  .from('wines')
  .select('*')
  .eq('is_active', true)
  .order('name');

// Type is Wine[] | null
```

### Insert with Types

```typescript
import { supabase } from '@/integrations/supabase/client';
import type { WineInsert } from '@/integrations/supabase/types';

const newWine: WineInsert = {
  name: 'Château Margaux',
  producer: 'Château Margaux',
  vintage: 2015,
  wine_type: 'red',
  country: 'France',
  region: 'Bordeaux'
};

const { data, error } = await supabase
  .from('wines')
  .insert(newWine)
  .select()
  .single();
```

### Using RPC Functions

```typescript
const { data: isAdmin } = await supabase
  .rpc('has_role', { _role: 'admin' });
```

---

## Testing Connection

Create a simple test to verify the setup:

```typescript
// src/lib/testConnection.ts
import { supabase } from '@/integrations/supabase/client';

export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('wines')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
}
```

---

## Verification Checklist

- [ ] `client.ts` created with proper configuration
- [ ] `types.ts` generated or manually created
- [ ] Environment variables configured
- [ ] Test query works without errors
- [ ] TypeScript types provide autocomplete

---

## Next Phase

→ [Phase 3: Authentication Rewrite](./phase-03-authentication.md)
