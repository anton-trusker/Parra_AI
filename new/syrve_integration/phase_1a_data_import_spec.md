# **Phase 1A: Syrve Integration & Data Import \- Complete Technical Specification (REVISED)**

**Version:** 1.1  
**Date:** February 14, 2026  
**Scope:** Initial connection, data import, canonical storage, and inventory foundation

---

## **REVISION SUMMARY (v1.1)**

## **Key Changes:**

1. ✅ **Added complete measurement units import** from Syrve `/units/list`  
2. ✅ **Added warehouse/storage locations** import and management  
3. ✅ **Clarified inventory check workflow**: Admin creates in platform, sends to Syrve  
4. ✅ **Inventory scope**: Only GOODS products (parent items, not dishes/children)  
5. ✅ **Stock filtering**: Only positive stock \+ available products shown  
6. ✅ **Measurement conversion logic**: Count in natural units → convert → send to Syrve  
7. ✅ **Added review notes and adjustment capability**

---

## **Table of Contents**

1. Executive Summary  
2. Integration Architecture  
3. Initial Connection Workflow  
4. Data Import Phases  
5. Complete Database Schema  
6. Measurement Units System  
7. Warehouse & Storage System  
8. Product Data Model  
9. Stock & Inventory Logic  
10. Inventory Check Workflow  
11. Measurement Conversion & Syrve Submission  
12. API Integration Details  
13. Implementation Guide

---

## **1\. Executive Summary**

## **1.1 Purpose**

This document defines **Phase 1A: Data Import & Inventory Foundation** \- the complete system that:

* Imports all business data from Syrve Server API  
* Stores normalized, queryable data  
* Enables inventory check creation **in your platform**  
* Converts counted units to Syrve requirements  
* Submits completed inventory documents to Syrve

## **1.2 Core Principles**

✅ **Import ALL measurement units** from Syrve for accurate conversions  
✅ **Import warehouse/storage hierarchy** for multi-location inventory  
✅ **Inventory scope: GOODS only** (raw materials, bottles, ingredients)  
✅ **Count in natural units** (bottles, cases, kegs) → convert to Syrve units  
✅ **Admin creates inventory in platform** → Syrve document created on send  
✅ **Show only positive stock** available products for counting  
✅ **Support review notes** and adjustments before submission

## **1.3 Inventory Check Flow (CLARIFIED)**

text  
`┌──────────────────────────────────────────────────────────┐`  
`│ 1. ADMIN INITIATES IN YOUR PLATFORM                     │`  
`│    • Selects warehouse/store                            │`  
`│    • System pulls current stock from Syrve              │`  
`│    • Filters: GOODS type + positive stock + active      │`  
`│    • Creates inventory session locally                  │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ 2. STAFF COUNTS (Mobile/Web)                            │`  
`│    • Counts in natural units: 15 bottles, 2 kegs        │`  
`│    • System stores counts (no Syrve involved yet)       │`  
`│    • Real-time aggregation by product                   │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ 3. MANAGER REVIEWS                                       │`  
`│    • Sees counted vs expected                           │`  
`│    • Adds notes per product                             │`  
`│    • Makes adjustments if needed                        │`  
`│    • Approves session                                   │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ 4. SYSTEM CONVERTS & SENDS TO SYRVE                     │`  
`│    • Converts bottles → liters (using product capacity) │`  
`│    • Builds XML incomingInventory document              │`  
`│    • POST /documents/import/incomingInventory           │`  
`│    • Syrve creates the inventory document               │`  
`│    • Stores Syrve document ID for reference             │`  
`└──────────────────────────────────────────────────────────┘`

**Key Point:** You do NOT create inventory check document in Syrve first. Admin creates it in your platform, counts happen in your platform, then the final approved result is sent to Syrve as a new document.

---

## **2\. Integration Architecture**

## **2.1 Three-Layer Data Model**

text  
`┌─────────────────────────────────────────────────────────────┐`  
`│ LAYER 1: RAW MIRROR (Audit & Rebuild Safety)               │`  
`│ • syrve_raw_payloads (every API response, immutable)       │`  
`│ • syrve_sync_runs (sync execution logs)                    │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ LAYER 2: CANONICAL MODEL (Normalized, Queryable)           │`  
`│ • org_nodes, stores, warehouses, storage_areas             │`  
`│ • measurement_units (ALL units from Syrve)                 │`  
`│ • categories (hierarchical)                                 │`  
`│ • products (all types: GOODS, DISH, SERVICE, etc.)         │`  
`│ • product_modifiers, product_barcodes                       │`  
`│ • stock_levels (store + unit aware)                        │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ LAYER 3: INVENTORY OPERATIONS (Your App Logic)             │`  
`│ • inventory_sessions (created in platform)                 │`  
`│ • inventory_count_events (staff counts)                    │`  
`│ • inventory_review_notes (manager comments)                │`  
`│ • syrve_outbox (pending submissions)                       │`  
`└─────────────────────────────────────────────────────────────┘`

---

## **3\. Initial Connection Workflow**

## **3.1 Admin Setup Flow (UPDATED)**

text  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 1: ADMIN INPUTS                                        │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ • Server URL (http://host:port/resto/api)                  │`  
`│ • Login                                                     │`  
`│ • Password (stored encrypted)                              │`  
`│ • Test Connection → Authenticate, get token                │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 2: IMPORT ORGANIZATION STRUCTURE                       │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ API Calls:                                                  │`  
`│ • GET /corporation/departments   → org hierarchy           │`  
`│ • GET /corporation/stores        → warehouse list          │`  
`│ • GET /corporation/groups        → branch/section groups   │`  
`│ • GET /corporation/terminals     → POS terminals           │`  
`│                                                             │`  
`│ Store in: org_nodes, stores, store_groups, terminals       │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 3: IMPORT MEASUREMENT UNITS (NEW)                     │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ API: GET /units/list                                        │`  
`│                                                             │`  
`│ Import ALL units from Syrve:                               │`  
`│ • Volume units (L, ml, cl, gal, bbl)                       │`  
`│ • Weight units (kg, g, lb, oz)                             │`  
`│ • Count units (pc, btl, case, box)                         │`  
`│ • Custom business units                                    │`  
`│                                                             │`  
`│ Store: measurement_units table with conversion factors     │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 4: IMPORT WAREHOUSES & STORAGE (NEW)                  │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ Extract from stores response + additional endpoints        │`  
`│                                                             │`  
`│ Build warehouse/storage hierarchy:                         │`  
`│ • Store → Warehouse → Storage Area → Shelf (optional)     │`  
`│                                                             │`  
`│ Store: warehouses, storage_areas tables                    │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 5: ADMIN SELECTION (Scope Configuration)              │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ User selects:                                               │`  
`│ ☑ Which WAREHOUSES to manage                               │`  
`│ ☑ Which PRODUCT TYPES to import:                           │`  
`│   ☑ GOODS (for inventory)      ← ALWAYS REQUIRED           │`  
`│   ☐ DISH (for menu reference)  ← Optional                  │`  
`│   ☐ PREPARED, SERVICE, etc.    ← Optional                  │`  
`│                                                             │`  
`│ Store in: syrve_import_config                              │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 6: IMPORT CATEGORIES (Product Groups)                 │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ API: GET /v2/entities/products/group/list                  │`  
`│                                                             │`  
`│ Import ALL groups (hierarchy preserved)                    │`  
`│ Store: categories table with parent_id tree                │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 7: IMPORT PRODUCTS                                    │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ API: GET /v2/entities/products/list                        │`  
`│      (filter: type=GOODS for inventory)                    │`  
`│                                                             │`  
`│ For each product:                                           │`  
`│ • Core fields → products table                             │`  
`│ • Link to measurement units                                │`  
`│ • Modifiers → product_modifiers table (if applicable)      │`  
`│ • Barcodes → product_barcodes table                        │`  
`│ • Containers → product_containers table                    │`  
`│ • Complete XML → products.syrve_data JSONB                 │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
`┌─────────────────────────────────────────────────────────────┐`  
`│ STEP 8: IMPORT STOCK LEVELS                                │`  
`├─────────────────────────────────────────────────────────────┤`  
`│ API: GET /v2/entities/products/stock-and-sales             │`  
`│      (for each selected warehouse)                         │`  
`│                                                             │`  
`│ Store: stock_levels table                                  │`  
`│ • product_id, warehouse_id, quantity, unit_id, timestamp   │`  
`│                                                             │`  
`│ Filter: Import only GOODS with positive stock              │`  
`└─────────────────────────────────────────────────────────────┘`  
                          `↓`  
                    `[COMPLETE]`

---

## **4\. Data Import Phases**

## **4.1 Import Phase Breakdown (UPDATED)**

| Phase | API Endpoint | What Gets Imported | Critical for Inventory? |
| ----- | ----- | ----- | ----- |
| **1\. Organization** | `/corporation/departments` | Departments (hierarchy) | ✅ Yes \- context |
|  | `/corporation/stores` | Warehouses/stores | ✅ **CRITICAL** \- inventory location |
|  | `/corporation/groups` | Branch groups, sections | ⚠️ Optional \- zones |
|  | `/corporation/terminals` | POS terminals | ❌ No \- audit only |
| **2\. Measurement Units** | `/units/list` | **ALL units from Syrve** | ✅ **CRITICAL** \- conversions |
| **3\. Catalog Structure** | `/v2/entities/products/group/list` | Categories (product groups) | ✅ Yes \- organization |
| **4\. Products** | `/v2/entities/products/list` | **GOODS type only** (for inventory) | ✅ **CRITICAL** \- what to count |
| **5\. Product Details** | (embedded in products) | Containers, barcodes, capacity | ✅ Yes \- unit conversion |
| **6\. Stock** | `/v2/entities/products/stock-and-sales` | Current inventory levels | ✅ **CRITICAL** \- baseline |

---

## **5\. Complete Database Schema**

## **5.1 Core Tables Overview (UPDATED)**

text  
`TENANT & AUTH`  
`├── business_profile (tenant root)`  
`├── profiles (users)`  
`└── user_roles (role assignments)`

`SYRVE CONNECTION`  
`├── syrve_config (connection settings)`  
`├── syrve_import_config (what to import)`  
`├── syrve_raw_payloads (audit log, all API responses)`  
`└── syrve_sync_runs (sync execution history)`

`ORGANIZATION`  
`├── org_nodes (departments hierarchy)`  
`├── stores (stores/restaurants)`  
`├── warehouses (storage facilities)                    ← NEW`  
`├── storage_areas (zones within warehouses)            ← NEW`  
`├── store_groups (branch/section groupings)`  
`└── terminals (POS devices)`

`MEASUREMENT UNITS                                       ← UPDATED`  
`├── measurement_units (ALL units from Syrve)`  
`└── unit_conversion_rules (custom conversion overrides)`

`CATALOG`  
`├── categories (product groups, hierarchical)`  
`├── products (all product types)`  
`├── product_sizes (size variants)`  
`├── product_modifiers (modifier relationships)`  
`├── product_barcodes (all barcodes)`  
`└── product_containers (packaging units)`

`STOCK`  
`├── stock_levels (current stock per warehouse)`  
`└── stock_history (historical snapshots)`

`INVENTORY OPERATIONS                                    ← NEW SECTION`  
`├── inventory_sessions`  
`├── inventory_baseline_items`  
`├── inventory_count_events`  
`├── inventory_product_aggregates`  
`├── inventory_review_notes                             ← NEW`  
`├── inventory_product_adjustments                      ← NEW`  
`└── syrve_outbox_jobs`

---

## **6\. Measurement Units System**

## **6.1 Why Import All Units from Syrve?**

**Critical Requirement:** You MUST import all measurement units from Syrve to:

1. ✅ Know what units products are tracked in  
2. ✅ Convert counted units (bottles) to Syrve units (liters)  
3. ✅ Support all business types (not just beverages)  
4. ✅ Handle custom units defined by the business

## **6.2 Measurement Units Table (UPDATED)**

sql  
*`-- =====================================================`*  
*`-- MEASUREMENT UNITS (ALL Units from Syrve)`*  
*`-- =====================================================`*  
`CREATE TYPE unit_type AS ENUM (`  
  `'VOLUME',      -- Liters, ml, cl, gallons, barrels, hectoliters`  
  `'WEIGHT',      -- kg, g, lbs, oz, tons`  
  `'COUNT',       -- pieces, bottles, boxes, cases, pallets`  
  `'LENGTH',      -- meters, cm, inches, feet`  
  `'AREA',        -- sq meters, sq feet`  
  `'TIME',        -- hours, minutes, days`  
  `'OTHER'        -- Custom units`  
`);`

`CREATE TABLE measurement_units (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_unit_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Details`  
  `name TEXT NOT NULL,                    -- Full name: "Liter", "Kilogram", "Piece"`  
  `short_name TEXT NOT NULL,              -- Abbreviation: "L", "kg", "pc"`  
  `plural_name TEXT,                      -- "Liters", "Kilograms", "Pieces"`  
  `unit_type unit_type NOT NULL,`  
    
  `-- Conversion to base unit`  
  `base_unit_id UUID REFERENCES measurement_units(id),  -- NULL if this IS the base`  
  `conversion_factor NUMERIC(20,10),      -- Multiplier to base unit`  
  `conversion_offset NUMERIC(20,10) DEFAULT 0,  -- Additive offset (for Celsius/Fahrenheit)`  
    
  `-- Examples:`  
  `-- Liter: base_unit_id=NULL, factor=NULL (BASE)`  
  `-- Milliliter: base_unit_id=<Liter>, factor=0.001`  
  `-- Gallon (US): base_unit_id=<Liter>, factor=3.78541`  
  `-- Bottle (750ml): base_unit_id=<Liter>, factor=0.75`  
    
  `-- Display preferences`  
  `decimal_places INTEGER DEFAULT 2,      -- How many decimals to show`  
  `display_format TEXT,                   -- e.g., "0.00 L", "#,##0 pcs"`  
    
  `-- Usage flags`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_system_unit BOOLEAN DEFAULT false,  -- Core units (don't allow deletion)`  
  `can_be_fractional BOOLEAN DEFAULT true, -- Allow decimals (false for "pieces")`  
    
  `-- Inventory behavior`  
  `use_in_inventory BOOLEAN DEFAULT true, -- Can this unit be used for stock?`  
  `use_in_counting BOOLEAN DEFAULT true,  -- Can staff count in this unit?`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_unit_id),`  
  `UNIQUE(business_id, short_name)`  
`);`

`CREATE INDEX idx_units_type ON measurement_units(business_id, unit_type);`  
`CREATE INDEX idx_units_active ON measurement_units(business_id, is_active);`  
`CREATE INDEX idx_units_base ON measurement_units(business_id, base_unit_id);`  
`CREATE INDEX idx_units_inventory ON measurement_units(business_id, use_in_inventory) WHERE use_in_inventory = true;`

*`-- =====================================================`*  
*`-- COMMON UNITS (Examples of what gets imported)`*  
*`-- =====================================================`*  
*`/*`*  
*`Syrve typically provides:`*

*`VOLUME:`*  
*`- Liter (L) - BASE`*  
*`- Milliliter (ml) = 0.001 L`*  
*`- Centiliter (cl) = 0.01 L`*  
*`- Deciliter (dl) = 0.1 L`*  
*`- Hectoliter (hL) = 100 L`*  
*`- Gallon (gal) = 3.78541 L (US) or 4.54609 L (UK)`*  
*`- Barrel (bbl) = 158.987 L (oil) or 117.348 L (beer)`*  
*`- Fluid Ounce (fl oz) = 0.0295735 L (US)`*

*`WEIGHT:`*  
*`- Kilogram (kg) - BASE`*  
*`- Gram (g) = 0.001 kg`*  
*`- Milligram (mg) = 0.000001 kg`*  
*`- Ton (t) = 1000 kg`*  
*`- Pound (lb) = 0.453592 kg`*  
*`- Ounce (oz) = 0.0283495 kg`*

*`COUNT:`*  
*`- Piece (pc) - BASE (factor=1)`*  
*`- Bottle (btl) - typically maps to specific volume`*  
*`- Box (box) - typically contains N pieces`*  
*`- Case (case) - typically contains 12 or 24 bottles`*  
*`- Pallet (plt) - contains multiple cases`*  
*`*/`*

## **6.3 Unit Conversion Functions (UPDATED)**

sql  
*`-- =====================================================`*  
*`-- UNIT CONVERSION (Core Logic)`*  
*`-- =====================================================`*  
`CREATE OR REPLACE FUNCTION convert_quantity(`  
  `p_quantity NUMERIC,`  
  `p_from_unit_id UUID,`  
  `p_to_unit_id UUID,`  
  `p_business_id UUID`  
`)`  
`RETURNS NUMERIC AS $$`  
`DECLARE`  
  `v_from_factor NUMERIC;`  
  `v_to_factor NUMERIC;`  
  `v_from_offset NUMERIC;`  
  `v_to_offset NUMERIC;`  
  `v_base_quantity NUMERIC;`  
  `v_result NUMERIC;`  
`BEGIN`  
  `-- If same unit, return as-is`  
  `IF p_from_unit_id = p_to_unit_id THEN`  
    `RETURN p_quantity;`  
  `END IF;`  
    
  `-- Get conversion factors`  
  `SELECT`  
    `COALESCE(from_unit.conversion_factor, 1),`  
    `COALESCE(from_unit.conversion_offset, 0),`  
    `COALESCE(to_unit.conversion_factor, 1),`  
    `COALESCE(to_unit.conversion_offset, 0)`  
  `INTO`  
    `v_from_factor,`  
    `v_from_offset,`  
    `v_to_factor,`  
    `v_to_offset`  
  `FROM measurement_units from_unit`  
  `CROSS JOIN measurement_units to_unit`  
  `WHERE from_unit.id = p_from_unit_id`  
    `AND to_unit.id = p_to_unit_id`  
    `AND from_unit.business_id = p_business_id`  
    `AND to_unit.business_id = p_business_id;`  
    
  `-- Check if units found`  
  `IF v_from_factor IS NULL THEN`  
    `RAISE EXCEPTION 'Cannot convert: unit not found or incompatible units';`  
  `END IF;`  
    
  `-- Convert to base unit: (quantity * factor) + offset`  
  `v_base_quantity := (p_quantity * v_from_factor) + v_from_offset;`  
    
  `-- Convert from base to target: (base - offset) / factor`  
  `v_result := (v_base_quantity - v_to_offset) / v_to_factor;`  
    
  `RETURN v_result;`  
`END;`  
`$$ LANGUAGE plpgsql IMMUTABLE;`

*`-- =====================================================`*  
*`-- HELPER: Get unit by short name`*  
*`-- =====================================================`*  
`CREATE OR REPLACE FUNCTION get_unit_id_by_name(`  
  `p_business_id UUID,`  
  `p_short_name TEXT`  
`)`  
`RETURNS UUID AS $$`  
  `SELECT id`  
  `FROM measurement_units`  
  `WHERE business_id = p_business_id`  
    `AND (short_name = p_short_name OR name = p_short_name)`  
    `AND is_active = true`  
  `LIMIT 1;`  
`$$ LANGUAGE SQL STABLE;`

*`-- =====================================================`*  
*`-- USAGE EXAMPLES`*  
*`-- =====================================================`*  
*`/*`*  
*`-- Convert 750ml to liters:`*  
*`SELECT convert_quantity(`*  
  *`750,`*  
  *`get_unit_id_by_name('business-uuid', 'ml'),`*  
  *`get_unit_id_by_name('business-uuid', 'L'),`*  
  *`'business-uuid'`*  
*`);`*  
*`-- Result: 0.75`*

*`-- Convert 12 bottles (if bottle is defined as 0.75L) to liters:`*  
*`SELECT convert_quantity(`*  
  *`12,`*  
  *`get_unit_id_by_name('business-uuid', 'btl'),`*  
  *`get_unit_id_by_name('business-uuid', 'L'),`*  
  *`'business-uuid'`*  
*`);`*  
*`-- Result: 9.0 (assuming bottle factor = 0.75)`*  
*`*/`*

---

## **7\. Warehouse & Storage System**

## **7.1 Why Warehouse Hierarchy Matters**

**Business Reality:**

* One business can have multiple physical locations (stores/warehouses)  
* One warehouse can have multiple storage areas (bar, cellar, kitchen)  
* Inventory checks are **warehouse-specific**  
* Stock levels vary by warehouse

## **7.2 Warehouse Tables (NEW)**

sql  
*`-- =====================================================`*  
*`-- WAREHOUSES (Storage Facilities)`*  
*`-- =====================================================`*  
`CREATE TYPE warehouse_type AS ENUM (`  
  `'MAIN',          -- Primary warehouse`  
  `'STORE',         -- Individual store/restaurant`  
  `'PRODUCTION',    -- Production facility`  
  `'EXTERNAL',      -- External/supplier warehouse`  
  `'VIRTUAL'        -- Virtual/logical warehouse`  
`);`

`CREATE TABLE warehouses (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_store_id UUID NOT NULL,         -- Links to Syrve store`  
  `syrve_code TEXT,`  
    
  `-- Store link (if warehouse is part of a store)`  
  `store_id UUID REFERENCES stores(id) ON DELETE SET NULL,`  
    
  `-- Organization link`  
  `org_node_id UUID REFERENCES org_nodes(id) ON DELETE SET NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
  `warehouse_type warehouse_type DEFAULT 'MAIN',`  
    
  `-- Location`  
  `address TEXT,`  
  `city TEXT,`  
  `postal_code TEXT,`  
  `country TEXT,`  
  `coordinates JSONB,                    -- {lat: 38.7223, lon: -9.1393}`  
    
  `-- Capacity`  
  `total_capacity_sqm NUMERIC(10,2),`  
  `capacity_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Settings`  
  `allow_negative_stock BOOLEAN DEFAULT false,`  
  `require_approval_for_adjustments BOOLEAN DEFAULT true,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_store_id)`  
`);`

`CREATE INDEX idx_warehouses_store ON warehouses(business_id, store_id);`  
`CREATE INDEX idx_warehouses_active ON warehouses(business_id, is_active) WHERE is_deleted = false;`  
`CREATE INDEX idx_warehouses_type ON warehouses(business_id, warehouse_type);`

*`-- =====================================================`*  
*`-- STORAGE AREAS (Zones within warehouses)`*  
*`-- =====================================================`*  
`CREATE TYPE storage_area_type AS ENUM (`  
  `'BAR',           -- Bar area`  
  `'CELLAR',        -- Wine cellar`  
  `'KITCHEN',       -- Kitchen storage`  
  `'DRY_STORAGE',   -- Dry goods`  
  `'COLD_STORAGE',  -- Refrigerated`  
  `'FREEZER',       -- Frozen storage`  
  `'DISPLAY',       -- Display/retail area`  
  `'RECEIVING',     -- Receiving dock`  
  `'STAGING',       -- Staging area`  
  `'OTHER'`  
`);`

`CREATE TABLE storage_areas (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Which warehouse`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,`  
    
  `-- Hierarchy (areas can have sub-areas)`  
  `parent_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,`  
    
  `-- Details`  
  `name TEXT NOT NULL,                   -- "Main Bar", "Wine Cellar - Red Section"`  
  `code TEXT,                            -- Quick lookup code`  
  `area_type storage_area_type DEFAULT 'OTHER',`  
  `description TEXT,`  
    
  `-- Physical properties`  
  `capacity_sqm NUMERIC(10,2),`  
  `temperature_min NUMERIC(5,2),         -- °C`  
  `temperature_max NUMERIC(5,2),`  
  `humidity_min NUMERIC(5,2),            -- %`  
  `humidity_max NUMERIC(5,2),`  
    
  `-- Display`  
  `sort_order INTEGER DEFAULT 0,`  
  `color_hex TEXT,                       -- For UI visualization`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(warehouse_id, code)`  
`);`

`CREATE INDEX idx_storage_areas_warehouse ON storage_areas(business_id, warehouse_id);`  
`CREATE INDEX idx_storage_areas_parent ON storage_areas(business_id, parent_area_id);`  
`CREATE INDEX idx_storage_areas_type ON storage_areas(business_id, area_type);`

## **7.3 Warehouse-Aware Stock (UPDATED)**

sql  
*`-- =====================================================`*  
*`-- STOCK LEVELS (Updated to use warehouses)`*  
*`-- =====================================================`*  
`CREATE TABLE stock_levels (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- What & where`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,`  
  `storage_area_id UUID REFERENCES storage_areas(id) ON DELETE SET NULL,  -- Optional: specific zone`  
    
  `-- Quantity`  
  `quantity NUMERIC(20,6) NOT NULL DEFAULT 0,`  
  `unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Converted to product's main unit (for easy comparison)`  
  `quantity_in_product_unit NUMERIC(20,6),`  
    
  `-- Value (optional)`  
  `unit_cost NUMERIC(15,4),`  
  `total_value NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,`  
    
  `-- Timestamp`  
  `as_of_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),`  
    
  `-- Source`  
  `source TEXT DEFAULT 'syrve',          -- syrve|manual|counted|adjusted`  
  `sync_run_id UUID REFERENCES syrve_sync_runs(id),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Only one stock level per product/warehouse at a time`  
  `UNIQUE(product_id, warehouse_id, as_of_date),`  
    
  `-- Stock must be non-negative (unless warehouse allows)`  
  `CONSTRAINT check_stock_non_negative CHECK (`  
    `quantity >= 0 OR`  
    `EXISTS (`  
      `SELECT 1 FROM warehouses w`  
      `WHERE w.id = warehouse_id`  
        `AND w.allow_negative_stock = true`  
    `)`  
  `)`  
`);`

`CREATE INDEX idx_stock_product_warehouse ON stock_levels(business_id, product_id, warehouse_id);`  
`CREATE INDEX idx_stock_warehouse ON stock_levels(business_id, warehouse_id);`  
`CREATE INDEX idx_stock_positive ON stock_levels(business_id, warehouse_id) WHERE quantity > 0;`  
`CREATE INDEX idx_stock_as_of_date ON stock_levels(business_id, as_of_date DESC);`

---

## **8\. Product Data Model**

## **8.1 Products Table (Inventory-Focused)**

sql  
*`-- =====================================================`*  
*`-- PRODUCTS (Focus on GOODS for inventory)`*  
*`-- =====================================================`*  
`CREATE TYPE product_type AS ENUM (`  
  `'GOODS',         -- ✅ Inventory items (COUNT THESE)`  
  `'DISH',          -- Menu items (reference only)`  
  `'PREPARED',      -- Semi-finished goods`  
  `'SERVICE',       -- Non-physical`  
  `'MODIFIER',      -- Add-ons`  
  `'OUTER',         -- External`  
  `'PETROL',        -- Fuel`  
  `'RATE'           -- Fees`  
`);`

`CREATE TABLE products (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_product_id UUID NOT NULL,`  
  `sku TEXT,                              -- Syrve "num"`  
  `code TEXT,                             -- Quick dial code`  
    
  `-- Hierarchy`  
  `category_id UUID REFERENCES categories(id) ON DELETE SET NULL,`  
  `parent_product_id UUID REFERENCES products(id) ON DELETE SET NULL,`  
    
  `-- Product details`  
  `name TEXT NOT NULL,`  
  `description TEXT,`  
  `product_type product_type NOT NULL,`  
    
  `-- Measurement (CRITICAL for inventory)`  
  `main_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,`  
  `unit_capacity NUMERIC(20,6),          -- Capacity in main unit`  
  `unit_weight NUMERIC(20,6),`  
    
  `-- Counting units (what staff counts in)`  
  `counting_unit_id UUID REFERENCES measurement_units(id) ON DELETE SET NULL,`  
  `-- Example: Wine bottle → main_unit=Liter, counting_unit=Bottle`  
    
  `-- Container info (for conversion)`  
  `container_type TEXT,                  -- Bottle, Keg, Case, Barrel, etc.`  
  `container_capacity NUMERIC(20,6),     -- Size of one container in main units`  
  `container_capacity_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Pricing`  
  `default_sale_price NUMERIC(15,2),`  
  `average_cost NUMERIC(15,2),`  
    
  `-- Inventory behavior`  
  `not_in_store_movement BOOLEAN DEFAULT false,  -- If true, EXCLUDE from inventory`  
  `track_inventory BOOLEAN DEFAULT true,         -- Should this be counted?`  
    
  `-- Minimum stock alerts`  
  `min_stock_level NUMERIC(20,6),`  
  `max_stock_level NUMERIC(20,6),`  
  `reorder_point NUMERIC(20,6),`  
    
  `-- Visual`  
  `image_id UUID,`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB NOT NULL DEFAULT '{}'::jsonb,`  
    
  `-- Sync tracking`  
  `synced_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_product_id)`  
`);`

`CREATE INDEX idx_products_category ON products(business_id, category_id);`  
`CREATE INDEX idx_products_type ON products(business_id, product_type);`  
`CREATE INDEX idx_products_inventory ON products(business_id, is_active, track_inventory)`  
  `WHERE is_deleted = false AND track_inventory = true;`  
`CREATE INDEX idx_products_goods ON products(business_id, product_type)`  
  `WHERE product_type = 'GOODS' AND is_deleted = false;`

## **8.2 Product Containers (UPDATED)**

sql  
*`-- =====================================================`*  
*`-- PRODUCT CONTAINERS (Packaging Units)`*  
*`-- =====================================================`*  
`CREATE TABLE product_containers (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Syrve identifiers`  
  `syrve_container_id UUID NOT NULL,`  
  `syrve_code TEXT,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Container details`  
  `name TEXT NOT NULL,                   -- "Bottle 750ml", "Keg 50L", "Case 12x750ml"`  
  `container_type TEXT,                  -- BOTTLE, KEG, CASE, BARREL, BAG, BOX`  
    
  `-- Capacity`  
  `capacity NUMERIC(20,6) NOT NULL,      -- How much product in this container`  
  `capacity_unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Quantity (for cases/packs)`  
  `units_per_container INTEGER DEFAULT 1, -- e.g., 12 bottles in a case`  
    
  `-- Weight tracking (for physical inventory)`  
  `tare_weight NUMERIC(15,6),            -- Empty container weight (kg)`  
  `gross_weight NUMERIC(15,6),           -- Full container weight (kg)`  
  `net_weight NUMERIC(15,6),             -- Product weight (kg)`  
    
  `-- Barcode (if container has unique barcode)`  
  `container_barcode TEXT,`  
    
  `-- Usage`  
  `is_default BOOLEAN DEFAULT false,     -- Default container for this product`  
  `use_in_inventory BOOLEAN DEFAULT true, -- Count in this container?`  
    
  `-- Status`  
  `is_active BOOLEAN DEFAULT true,`  
  `is_deleted BOOLEAN DEFAULT false,`  
    
  `-- Complete Syrve data`  
  `syrve_data JSONB DEFAULT '{}'::jsonb,`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(business_id, syrve_container_id)`  
`);`

`CREATE INDEX idx_containers_product ON product_containers(business_id, product_id);`  
`CREATE INDEX idx_containers_default ON product_containers(business_id, product_id, is_default)`  
  `WHERE is_default = true;`

---

## **9\. Stock & Inventory Logic**

## **9.1 Stock Filtering Rules**

**When displaying products for inventory count, show ONLY:**

✅ `product_type = 'GOODS'` (not DISH, not SERVICE)  
✅ `track_inventory = true`  
✅ `not_in_store_movement = false`  
✅ `is_active = true`  
✅ `is_deleted = false`  
✅ `stock_levels.quantity > 0` (positive stock in selected warehouse)  
✅ Products in selected warehouse

## **9.2 Stock Query (For Inventory Session Start)**

sql  
*`-- =====================================================`*  
*`-- GET COUNTABLE PRODUCTS (For inventory session)`*  
*`-- =====================================================`*  
`CREATE OR REPLACE FUNCTION get_countable_products(`  
  `p_business_id UUID,`  
  `p_warehouse_id UUID,`  
  `p_category_id UUID DEFAULT NULL  -- Optional filter`  
`)`  
`RETURNS TABLE(`  
  `product_id UUID,`  
  `product_name TEXT,`  
  `sku TEXT,`  
  `code TEXT,`  
  `category_name TEXT,`  
  `current_stock NUMERIC,`  
  `stock_unit TEXT,`  
  `counting_unit TEXT,`  
  `container_type TEXT,`  
  `container_capacity NUMERIC,`  
  `image_id UUID`  
`) AS $$`  
`BEGIN`  
  `RETURN QUERY`  
  `SELECT`  
    `p.id AS product_id,`  
    `p.name AS product_name,`  
    `p.sku,`  
    `p.code,`  
    `c.name AS category_name,`  
    `sl.quantity AS current_stock,`  
    `mu_stock.short_name AS stock_unit,`  
    `mu_count.short_name AS counting_unit,`  
    `p.container_type,`  
    `p.container_capacity,`  
    `p.image_id`  
  `FROM products p`  
  `INNER JOIN stock_levels sl ON sl.product_id = p.id`  
  `LEFT JOIN categories c ON c.id = p.category_id`  
  `LEFT JOIN measurement_units mu_stock ON mu_stock.id = p.main_unit_id`  
  `LEFT JOIN measurement_units mu_count ON mu_count.id = p.counting_unit_id`  
  `WHERE p.business_id = p_business_id`  
    `AND sl.business_id = p_business_id`  
    `AND sl.warehouse_id = p_warehouse_id`  
    `AND p.product_type = 'GOODS'`  
    `AND p.track_inventory = true`  
    `AND p.not_in_store_movement = false`  
    `AND p.is_active = true`  
    `AND p.is_deleted = false`  
    `AND sl.quantity > 0  -- Only positive stock`  
    `AND (p_category_id IS NULL OR p.category_id = p_category_id)`  
  `ORDER BY c.name, p.name;`  
`END;`  
`$$ LANGUAGE plpgsql STABLE;`

*`-- USAGE:`*  
*`-- SELECT * FROM get_countable_products('business-uuid', 'warehouse-uuid');`*

---

## **10\. Inventory Check Workflow**

## **10.1 Complete Inventory Lifecycle**

text  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 1: SESSION CREATION (Admin/Manager)               │`  
`├──────────────────────────────────────────────────────────┤`  
`│ 1. Admin selects warehouse                              │`  
`│ 2. System fetches stock from Syrve (baseline)           │`  
`│ 3. System filters: GOODS + positive stock + active      │`  
`│ 4. Create inventory_session record (status=draft)       │`  
`│ 5. Copy baseline to inventory_baseline_items            │`  
`│ 6. Change status to 'in_progress'                       │`  
`│ 7. Staff can now start counting                         │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 2: COUNTING (Staff - Mobile/Web)                  │`  
`├──────────────────────────────────────────────────────────┤`  
`│ Staff actions:                                           │`  
`│ • Scan barcode OR search product                        │`  
`│ • Enter count in NATURAL UNITS:                         │`  
`│   - 15 bottles                                          │`  
`│   - 2 kegs                                              │`  
`│   - 3 cases                                             │`  
`│ • System stores as inventory_count_events (append-only) │`  
`│ • No overwrites - multiple staff can count same product │`  
`│ • Real-time aggregation shows current totals            │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 3: REVIEW (Manager)                               │`  
`├──────────────────────────────────────────────────────────┤`  
`│ Manager sees:                                            │`  
`│ • Expected (from Syrve baseline)                        │`  
`│ • Counted (aggregated staff counts)                     │`  
`│ • Variance (difference)                                 │`  
`│ • Who counted what (audit trail)                        │`  
`│                                                          │`  
`│ Manager can:                                             │`  
`│ ✅ Add notes per product (inventory_review_notes)       │`  
`│ ✅ Make adjustments (inventory_product_adjustments)     │`  
`│ ✅ Mark products as verified                            │`  
`│ ✅ Change session status to 'pending_approval'          │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 4: APPROVAL & CONVERSION                          │`  
`├──────────────────────────────────────────────────────────┤`  
`│ Admin/Manager approves:                                  │`  
`│ 1. Set status = 'approved'                              │`  
`│ 2. System converts counts:                              │`  
`│    • 15 bottles × 0.75L = 11.25L                        │`  
`│    • 2 kegs × 50L = 100L                                │`  
`│    • 3 cases × 12 × 0.75L = 27L                         │`  
`│ 3. Build XML document with FINAL quantities in Syrve units │`  
`│ 4. Store in syrve_outbox_jobs (status=pending)          │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
`┌──────────────────────────────────────────────────────────┐`  
`│ PHASE 5: SEND TO SYRVE                                  │`  
`├──────────────────────────────────────────────────────────┤`  
`│ Background worker:                                       │`  
`│ 1. Authenticate to Syrve (get token)                    │`  
`│ 2. POST /documents/import/incomingInventory (XML)       │`  
`│ 3. Syrve creates inventory document                     │`  
`│ 4. Response contains document ID                        │`  
`│ 5. Update session: syrve_document_id, status='synced'   │`  
`│ 6. Update outbox: status='success'                      │`  
`│ 7. Logout from Syrve                                    │`  
`└──────────────────────────────────────────────────────────┘`  
                        `↓`  
                   `[COMPLETE]`

## **10.2 Inventory Session Tables (UPDATED)**

sql  
*`-- =====================================================`*  
*`-- INVENTORY SESSIONS`*  
*`-- =====================================================`*  
`CREATE TYPE inventory_session_status AS ENUM (`  
  `'draft',              -- Being set up`  
  `'in_progress',        -- Staff are counting`  
  `'counting_complete',  -- Counting done, awaiting review`  
  `'under_review',       -- Manager is reviewing`  
  `'pending_approval',   -- Waiting for final approval`  
  `'approved',           -- Approved, ready to send`  
  `'sending',            -- Being sent to Syrve`  
  `'synced',             -- Successfully sent to Syrve`  
  `'failed',             -- Send failed`  
  `'cancelled'           -- Cancelled before completion`  
`);`

`CREATE TABLE inventory_sessions (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
    
  `-- Which warehouse`  
  `warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,`  
    
  `-- Session details`  
  `title TEXT NOT NULL,`  
  `description TEXT,`  
  `session_number TEXT GENERATED ALWAYS AS (`  
    `'INV-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(EXTRACT(HOUR FROM created_at)::TEXT, 2, '0') || LPAD(EXTRACT(MINUTE FROM created_at)::TEXT, 2, '0')`  
  `) STORED,`  
    
  `-- Status tracking`  
  `status inventory_session_status DEFAULT 'draft',`  
  `status_history JSONB DEFAULT '[]'::jsonb,  -- Track all status changes`  
    
  `-- Baseline`  
  `baseline_source TEXT DEFAULT 'syrve_stock',`  
  `baseline_taken_at TIMESTAMPTZ,`  
    
  `-- Who & When`  
  `created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,`  
  `started_at TIMESTAMPTZ,`  
  `counting_completed_at TIMESTAMPTZ,`  
  `reviewed_by UUID REFERENCES profiles(id),`  
  `reviewed_at TIMESTAMPTZ,`  
  `approved_by UUID REFERENCES profiles(id),`  
  `approved_at TIMESTAMPTZ,`  
    
  `-- Syrve sync`  
  `syrve_document_id TEXT,               -- Syrve's inventory document ID`  
  `syrve_document_number TEXT,           -- Syrve's document number`  
  `syrve_synced_at TIMESTAMPTZ,`  
  `sync_attempts INTEGER DEFAULT 0,`  
  `last_sync_error TEXT,`  
    
  `-- Statistics (denormalized for performance)`  
  `total_products_expected INTEGER DEFAULT 0,`  
  `total_products_counted INTEGER DEFAULT 0,`  
  `total_products_with_variance INTEGER DEFAULT 0,`  
  `total_value_expected NUMERIC(15,2),`  
  `total_value_counted NUMERIC(15,2),`  
    
  `-- Metadata`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
  `updated_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE INDEX idx_inv_sessions_warehouse ON inventory_sessions(business_id, warehouse_id);`  
`CREATE INDEX idx_inv_sessions_status ON inventory_sessions(business_id, status);`  
`CREATE INDEX idx_inv_sessions_created ON inventory_sessions(business_id, created_at DESC);`

*`-- =====================================================`*  
*`-- BASELINE ITEMS (Expected stock at session start)`*  
*`-- =====================================================`*  
`CREATE TABLE inventory_baseline_items (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Expected quantity (from Syrve)`  
  `expected_quantity NUMERIC(20,6) NOT NULL,`  
  `expected_unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Converted to counting unit (for staff display)`  
  `expected_in_counting_unit NUMERIC(20,6),`  
  `counting_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Value`  
  `unit_cost NUMERIC(15,4),`  
  `expected_value NUMERIC(15,2) GENERATED ALWAYS AS (expected_quantity * unit_cost) STORED,`  
    
  `-- Snapshot timestamp`  
  `captured_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `UNIQUE(session_id, product_id)`  
`);`

`CREATE INDEX idx_baseline_session ON inventory_baseline_items(business_id, session_id);`  
`CREATE INDEX idx_baseline_product ON inventory_baseline_items(business_id, product_id);`

*`-- =====================================================`*  
*`-- COUNT EVENTS (Append-only, collaborative)`*  
*`-- =====================================================`*  
`CREATE TYPE count_method AS ENUM (`  
  `'manual',        -- Manual entry`  
  `'barcode',       -- Barcode scan`  
  `'image_ai',      -- AI recognition (future)`  
  `'voice',         -- Voice input (future)`  
  `'nfc',           -- NFC tag scan (future)`  
  `'adjustment'     -- Manager adjustment`  
`);`

`CREATE TABLE inventory_count_events (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,`  
    
  `-- Which product`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Who counted`  
  `counted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,`  
    
  `-- What was counted (in counting units)`  
  `quantity_counted NUMERIC(20,6) NOT NULL,`  
  `counting_unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Container info (if counted by container)`  
  `container_id UUID REFERENCES product_containers(id),`  
  `containers_counted INTEGER,           -- e.g., 3 cases`  
    
  `-- Converted to product main unit (for Syrve)`  
  `quantity_in_product_unit NUMERIC(20,6),`  
  `product_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Method & evidence`  
  `method count_method DEFAULT 'manual',`  
  `confidence NUMERIC(5,4),              -- For AI: 0-1`  
  `photo_asset_id UUID,                  -- Reference to media storage`  
    
  `-- Location (optional: which storage area)`  
  `storage_area_id UUID REFERENCES storage_areas(id),`  
    
  `-- Notes`  
  `notes TEXT,`  
    
  `-- Metadata`  
  `counted_at TIMESTAMPTZ DEFAULT NOW(),`  
  `device_info JSONB,                    -- {device_type: 'mobile', os: 'ios'}`  
    
  `created_at TIMESTAMPTZ DEFAULT NOW()`  
`);`

`CREATE INDEX idx_count_events_session ON inventory_count_events(business_id, session_id);`  
`CREATE INDEX idx_count_events_product ON inventory_count_events(business_id, session_id, product_id);`  
`CREATE INDEX idx_count_events_user ON inventory_count_events(business_id, counted_by);`  
`CREATE INDEX idx_count_events_time ON inventory_count_events(business_id, counted_at DESC);`

*`-- =====================================================`*  
*`-- PRODUCT AGGREGATES (Fast summary for UI)`*  
*`-- =====================================================`*  
`CREATE TABLE inventory_product_aggregates (`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Aggregated counts`  
  `total_counted NUMERIC(20,6) NOT NULL DEFAULT 0,`  
  `counting_unit_id UUID REFERENCES measurement_units(id),`  
    
  `-- Converted to product unit`  
  `total_in_product_unit NUMERIC(20,6) NOT NULL DEFAULT 0,`  
    
  `-- How many people counted this product`  
  `unique_counters INTEGER DEFAULT 0,`  
    
  `-- Latest count`  
  `last_counted_at TIMESTAMPTZ,`  
  `last_counted_by UUID REFERENCES profiles(id),`  
    
  `-- Computed at`  
  `updated_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `PRIMARY KEY (session_id, product_id)`  
`);`

`CREATE INDEX idx_agg_session ON inventory_product_aggregates(business_id, session_id);`

*`-- =====================================================`*  
*`-- REVIEW NOTES (Manager comments per product)`*  
*`-- =====================================================`*  
`CREATE TABLE inventory_review_notes (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Note content`  
  `note_text TEXT NOT NULL,`  
  `note_type TEXT DEFAULT 'review',      -- review|issue|adjustment|verification`  
    
  `-- Flags`  
  `requires_attention BOOLEAN DEFAULT false,`  
  `is_resolved BOOLEAN DEFAULT false,`  
    
  `-- Author`  
  `created_by UUID NOT NULL REFERENCES profiles(id),`  
  `created_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Resolution`  
  `resolved_by UUID REFERENCES profiles(id),`  
  `resolved_at TIMESTAMPTZ,`  
  `resolution_note TEXT`  
`);`

`CREATE INDEX idx_review_notes_session ON inventory_review_notes(business_id, session_id);`  
`CREATE INDEX idx_review_notes_product ON inventory_review_notes(business_id, product_id);`  
`CREATE INDEX idx_review_notes_attention ON inventory_review_notes(business_id, session_id)`  
  `WHERE requires_attention = true AND is_resolved = false;`

*`-- =====================================================`*  
*`-- PRODUCT ADJUSTMENTS (Manager corrections)`*  
*`-- =====================================================`*  
`CREATE TABLE inventory_product_adjustments (`  
  `id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`  
  `business_id UUID NOT NULL REFERENCES business_profile(id) ON DELETE CASCADE,`  
  `session_id UUID NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,`  
  `product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,`  
    
  `-- Original count (from aggregates)`  
  `original_quantity NUMERIC(20,6) NOT NULL,`  
    
  `-- Adjusted quantity`  
  `adjusted_quantity NUMERIC(20,6) NOT NULL,`  
  `adjustment_delta NUMERIC(20,6) GENERATED ALWAYS AS (adjusted_quantity - original_quantity) STORED,`  
    
  `-- Unit`  
  `unit_id UUID NOT NULL REFERENCES measurement_units(id),`  
    
  `-- Reason`  
  `reason TEXT NOT NULL,`  
  `reason_category TEXT,                 -- damaged|expired|theft|miscount|other`  
    
  `-- Who & When`  
  `adjusted_by UUID NOT NULL REFERENCES profiles(id),`  
  `adjusted_at TIMESTAMPTZ DEFAULT NOW(),`  
    
  `-- Approval (if required)`  
  `requires_approval BOOLEAN DEFAULT false,`  
  `approved_by UUID REFERENCES profiles(id),`  
  `approved_at TIMESTAMPTZ`  
`);`

`CREATE INDEX idx_adjustments_session ON inventory_product_adjustments(business_id, session_id);`  
`CREATE INDEX idx_adjustments_product ON inventory_product_adjustments(business_id, product_id);`

---

## **11\. Measurement Conversion & Syrve Submission**

## **11.1 Conversion Logic (Critical)**

**Example Scenario:**

* Product: Red Wine Bottle  
* Syrve tracks in: **Liters** (main\_unit)  
* Staff counts in: **Bottles** (counting\_unit)  
* Product capacity: **0.75L per bottle**

**Conversion Flow:**

text  
`Staff Count: 15 bottles`  
    `↓`  
`Conversion: 15 bottles × 0.75 L/bottle = 11.25 L`  
    `↓`  
`Send to Syrve: 11.25 L`

## **11.2 Conversion Function**

sql  
*`-- =====================================================`*  
*`-- CONVERT INVENTORY COUNT TO SYRVE UNIT`*  
*`-- =====================================================`*  
`CREATE OR REPLACE FUNCTION convert_count_to_syrve_unit(`  
  `p_product_id UUID,`  
  `p_counted_quantity NUMERIC,`  
  `p_counting_unit_id UUID,`  
  `p_business_id UUID`  
`)`  
`RETURNS TABLE(`  
  `quantity_in_syrve_unit NUMERIC,`  
  `syrve_unit_id UUID,`  
  `syrve_unit_name TEXT`  
`) AS $$`  
`DECLARE`  
  `v_product_unit_id UUID;`  
  `v_product_capacity NUMERIC;`  
  `v_result NUMERIC;`  
`BEGIN`  
  `-- Get product's main unit (what Syrve expects)`  
  `SELECT main_unit_id, unit_capacity`  
  `INTO v_product_unit_id, v_product_capacity`  
  `FROM products`  
  `WHERE id = p_product_id`  
    `AND business_id = p_business_id;`  
    
  `-- If counting unit = product unit, no conversion needed`  
  `IF p_counting_unit_id = v_product_unit_id THEN`  
    `v_result := p_counted_quantity;`  
  `ELSE`  
    `-- Convert: counted_qty × capacity`  
    `-- Example: 15 bottles × 0.75 L/bottle = 11.25 L`  
    `v_result := p_counted_quantity * v_product_capacity;`  
  `END IF;`  
    
  `-- Return result`  
  `RETURN QUERY`  
  `SELECT`  
    `v_result,`  
    `v_product_unit_id,`  
    `mu.short_name`  
  `FROM measurement_units mu`  
  `WHERE mu.id = v_product_unit_id;`  
`END;`  
`$$ LANGUAGE plpgsql STABLE;`

*`-- USAGE:`*  
*`/*`*  
*`SELECT * FROM convert_count_to_syrve_unit(`*  
  *`'product-uuid',`*  
  *`15,  -- 15 bottles`*  
  *`'bottle-unit-uuid',`*  
  *`'business-uuid'`*  
*`);`*  
*`-- Result: (11.25, 'liter-unit-uuid', 'L')`*  
*`*/`*

## **11.3 Syrve Document Builder**

typescript  
*`// =====================================================`*  
*`// BUILD SYRVE INCOMING INVENTORY XML`*  
*`// =====================================================`*

`interface SyrveInventoryItem {`  
  `productId: string;          // Syrve product UUID`  
  `amountContainer: number;    // Quantity in product's main unit`  
  `sum: number;                // Total value`  
  `isDeficit: boolean;         // true if shortage, false if surplus`  
  `storeId: string;            // Syrve store UUID`  
`}`

`class SyrveInventoryDocumentBuilder {`  
    
  `async buildIncomingInventoryXML(`  
    `sessionId: string,`  
    `businessId: string`  
  `): Promise<string> {`  
      
    `// Get session details`  
    `const session = await this.getSession(sessionId);`  
    `const warehouse = await this.getWarehouse(session.warehouse_id);`  
    `const config = await this.getSyrveConfig(businessId);`  
      
    `// Get all counted products with conversions`  
    `const items = await this.getInventoryItems(sessionId, businessId);`  
      
    `// Build XML`  
    ``const xml = `<?xml version="1.0" encoding="utf-8"?>``  
`<document>`  
  `<incomingInventory>`  
    `<documentNumber>${session.session_number}</documentNumber>`  
    `<dateIncoming>${this.formatDate(session.approved_at || new Date())}</dateIncoming>`  
    `<comment>${this.escapeXML(session.description || 'Inventory check')}</comment>`  
    `<conception>`  
      `<name>Inventory Check - ${warehouse.name}</name>`  
    `</conception>`  
    `<counteragent>`  
      `<name>${warehouse.name}</name>`  
    `</counteragent>`  
    `<store>`  
      `<id>${warehouse.syrve_store_id}</id>`  
    `</store>`  
    `<defaultStore>`  
      `<id>${warehouse.syrve_store_id}</id>`  
    `</defaultStore>`  
    `<accountingCode>${config.account_surplus_code || '5.10'}</accountingCode>`  
    `<accountingCodeDeficit>${config.account_shortage_code || '5.09'}</accountingCodeDeficit>`  
    `<items>`  
`${items.map(item => this.buildItemXML(item)).join('\n')}`  
    `</items>`  
  `</incomingInventory>`  
``</document>`;``  
      
    `return xml;`  
  `}`  
    
  `private async getInventoryItems(`  
    `sessionId: string,`  
    `businessId: string`  
  `): Promise<SyrveInventoryItem[]> {`  
      
    `` const query = ` ``  
      `SELECT`  
        `p.syrve_product_id,`  
        `p.name,`  
          
        `-- Expected (baseline)`  
        `COALESCE(b.expected_quantity, 0) AS expected_qty,`  
        `b.expected_unit_id,`  
          
        `-- Counted (aggregated + adjustments)`  
        `COALESCE(agg.total_in_product_unit, 0) AS counted_qty,`  
        `COALESCE(adj.adjusted_quantity, agg.total_in_product_unit, 0) AS final_qty,`  
          
        `-- Units`  
        `p.main_unit_id AS syrve_unit_id,`  
        `mu.short_name AS syrve_unit_name,`  
          
        `-- Value`  
        `b.unit_cost,`  
          
        `-- Warehouse`  
        `w.syrve_store_id`  
          
      `FROM products p`  
      `LEFT JOIN inventory_baseline_items b ON b.product_id = p.id AND b.session_id = $1`  
      `LEFT JOIN inventory_product_aggregates agg ON agg.product_id = p.id AND agg.session_id = $1`  
      `LEFT JOIN inventory_product_adjustments adj ON adj.product_id = p.id AND adj.session_id = $1`  
      `LEFT JOIN measurement_units mu ON mu.id = p.main_unit_id`  
      `INNER JOIN inventory_sessions s ON s.id = $1`  
      `INNER JOIN warehouses w ON w.id = s.warehouse_id`  
      `WHERE p.business_id = $2`  
        `AND (agg.total_in_product_unit IS NOT NULL OR adj.adjusted_quantity IS NOT NULL)`  
      `ORDER BY p.name`  
    `` `; ``  
      
    `const result = await db.query(query, [sessionId, businessId]);`  
      
    `return result.rows.map(row => {`  
      `const expectedQty = parseFloat(row.expected_qty);`  
      `const finalQty = parseFloat(row.final_qty);`  
      `const difference = finalQty - expectedQty;`  
      `const isDeficit = difference < 0;`  
      `const amount = Math.abs(difference);`  
        
      `return {`  
        `productId: row.syrve_product_id,`  
        `productName: row.name,`  
        `amountContainer: amount,  // Absolute value of difference`  
        `sum: amount * (parseFloat(row.unit_cost) || 0),`  
        `isDeficit: isDeficit,`  
        `storeId: row.syrve_store_id,`  
        `unitName: row.syrve_unit_name`  
      `};`  
    `}).filter(item => item.amountContainer !== 0);  // Only send items with variance`  
  `}`  
    
  `private buildItemXML(item: SyrveInventoryItem): string {`  
    ``return `      <item>``  
        `<product>`  
          `<id>${item.productId}</id>`  
        `</product>`  
        `<store>`  
          `<id>${item.storeId}</id>`  
        `</store>`  
        `<amountContainer>${item.amountContainer.toFixed(6)}</amountContainer>`  
        `<sum>${item.sum.toFixed(2)}</sum>`  
        `<isDeficit>${item.isDeficit ? 'true' : 'false'}</isDeficit>`  
      ``</item>`;``  
  `}`  
    
  `private escapeXML(str: string): string {`  
    `return str`  
      `.replace(/&/g, '&amp;')`  
      `.replace(/</g, '&lt;')`  
      `.replace(/>/g, '&gt;')`  
      `.replace(/"/g, '&quot;')`  
      `.replace(/'/g, '&apos;');`  
  `}`  
    
  `private formatDate(date: Date): string {`  
    `return date.toISOString().split('T')[0];  // YYYY-MM-DD`  
  `}`  
`}`

## **11.4 Send to Syrve Service**

typescript  
*`// =====================================================`*  
*`// SEND INVENTORY TO SYRVE`*  
*`// =====================================================`*

`class SyrveInventorySubmissionService {`  
    
  `async submitInventoryToSyrve(`  
    `sessionId: string,`  
    `businessId: string`  
  `): Promise<{ success: boolean; documentId?: string; error?: string }> {`  
      
    `// 1. Validate session`  
    `const session = await this.validateSession(sessionId);`  
    `if (session.status !== 'approved') {`  
      `throw new Error('Session must be approved before sending to Syrve');`  
    `}`  
      
    `// 2. Build XML`  
    `const xmlBuilder = new SyrveInventoryDocumentBuilder();`  
    `const xml = await xmlBuilder.buildIncomingInventoryXML(sessionId, businessId);`  
      
    `// 3. Create outbox entry (idempotency)`  
    `const outboxId = await this.createOutboxJob(businessId, sessionId, xml);`  
      
    `// 4. Authenticate`  
    `const token = await this.authenticateToSyrve(businessId);`  
      
    `try {`  
      `// 5. Send to Syrve`  
      `const response = await this.callSyrveAPI(`  
        `'/documents/import/incomingInventory',`  
        `{`  
          `method: 'POST',`  
          `headers: {`  
            `'Content-Type': 'application/xml'`  
          `},`  
          `body: xml,`  
          `params: { key: token }`  
        `}`  
      `);`  
        
      `// 6. Parse response`  
      `const documentId = this.extractDocumentId(response);`  
        
      `// 7. Update session`  
      `` await db.query(` ``  
        `UPDATE inventory_sessions`  
        `SET`  
          `status = 'synced',`  
          `syrve_document_id = $1,`  
          `syrve_synced_at = NOW(),`  
          `updated_at = NOW()`  
        `WHERE id = $2`  
      `` `, [documentId, sessionId]); ``  
        
      `// 8. Update outbox`  
      `` await db.query(` ``  
        `UPDATE syrve_outbox_jobs`  
        `SET`  
          `status = 'success',`  
          `response_xml = $1,`  
          `updated_at = NOW()`  
        `WHERE id = $2`  
      `` `, [response, outboxId]); ``  
        
      `// 9. Logout`  
      `await this.logoutFromSyrve(token);`  
        
      `return { success: true, documentId };`  
        
    `} catch (error) {`  
      `// Handle error`  
      `` await db.query(` ``  
        `UPDATE inventory_sessions`  
        `SET`  
          `status = 'failed',`  
          `last_sync_error = $1,`  
          `sync_attempts = sync_attempts + 1,`  
          `updated_at = NOW()`  
        `WHERE id = $2`  
      `` `, [error.message, sessionId]); ``  
        
      `` await db.query(` ``  
        `UPDATE syrve_outbox_jobs`  
        `SET`  
          `status = 'failed',`  
          `last_error = $1,`  
          `attempts = attempts + 1,`  
          `last_attempt_at = NOW()`  
        `WHERE id = $2`  
      `` `, [error.message, outboxId]); ``  
        
      `// Cleanup`  
      `await this.logoutFromSyrve(token);`  
        
      `return { success: false, error: error.message };`  
    `}`  
  `}`  
    
  `private extractDocumentId(xmlResponse: string): string {`  
    `// Parse Syrve's response to get document ID`  
    `// Response format varies, but typically contains <documentId>...</documentId>`  
    `const match = xmlResponse.match(/<documentId>([^<]+)<\/documentId>/i);`  
    `return match ? match[1] : null;`  
  `}`  
`}`

---

## **12\. API Integration Details**

## **12.1 Complete Bootstrap Import (UPDATED)**

typescript  
*`// =====================================================`*  
*`// UPDATED BOOTSTRAP WORKFLOW`*  
*`// =====================================================`*

`class SyrveBootstrapService {`  
    
  `async runFullBootstrap(businessId: string): Promise<BootstrapResult> {`  
    `const syncRunId = await this.createSyncRun(businessId, 'full', 'all');`  
      
    `try {`  
      `// Step 1: Authenticate`  
      `const token = await this.authenticate(businessId);`  
        
      `// Step 2: Import organization structure`  
      `await this.importOrganizations(businessId, token, syncRunId);`  
        
      `// Step 3: Import measurement units (NEW - CRITICAL)`  
      `await this.importMeasurementUnits(businessId, token, syncRunId);`  
        
      `// Step 4: Import warehouses & storage (NEW)`  
      `await this.importWarehouses(businessId, token, syncRunId);`  
        
      `// Step 5: Import categories`  
      `await this.importCategories(businessId, token, syncRunId);`  
        
      `// Step 6: Import products (GOODS focus)`  
      `await this.importProducts(businessId, token, syncRunId);`  
        
      `// Step 7: Import stock levels`  
      `await this.importStockLevels(businessId, token, syncRunId);`  
        
      `// Step 8: Logout`  
      `await this.logout(token);`  
        
      `// Mark sync as complete`  
      `await this.completeSyncRun(syncRunId, 'success');`  
        
      `return { success: true, syncRunId };`  
        
    `} catch (error) {`  
      `await this.completeSyncRun(syncRunId, 'failed', error.message);`  
      `throw error;`  
    `}`  
  `}`  
    
  `// ================================================`  
  `// STEP 3: Import Measurement Units (CRITICAL)`  
  `// ================================================`  
  `private async importMeasurementUnits(`  
    `businessId: string,`  
    `token: string,`  
    `syncRunId: string`  
  `): Promise<void> {`  
      
    `console.log('Importing measurement units...');`  
      
    `// Try dedicated units endpoint`  
    `try {`  
      `const response = await this.callSyrveAPI(`  
        `'/units/list',  // or '/v2/entities/units/list'`  
        `{ key: token }`  
      `);`  
        
      `await this.saveRawPayload(businessId, syncRunId, 'unit', response);`  
      `await this.processUnits(businessId, response);`  
        
      ``console.log(`✅ Imported ${response.length || 0} measurement units`);``  
        
    `} catch (err) {`  
      `console.warn('⚠️ Dedicated units endpoint not available, extracting from products');`  
      `// Fallback: units will be extracted during product import`  
    `}`  
  `}`  
    
  `private async processUnits(`  
    `businessId: string,`  
    `unitsData: any`  
  `): Promise<void> {`  
      
    `const units = Array.isArray(unitsData) ? unitsData : unitsData.items || [];`  
      
    `for (const unitData of units) {`  
      `await this.upsertUnit(businessId, unitData);`  
    `}`  
  `}`  
    
  `private async upsertUnit(`  
    `businessId: string,`  
    `unitData: any`  
  `): Promise<string> {`  
      
    `// Determine unit type from name/code`  
    `const unitType = this.inferUnitType(unitData.name, unitData.code);`  
      
    `const unit = {`  
      `business_id: businessId,`  
      `syrve_unit_id: unitData.id,`  
      `syrve_code: unitData.code,`  
      `name: unitData.name,`  
      `short_name: unitData.shortName || unitData.code,`  
      `plural_name: unitData.pluralName || unitData.name + 's',`  
      `unit_type: unitType,`  
      `base_unit_id: null,  // Will be set in post-processing`  
      `conversion_factor: unitData.conversionFactor || null,`  
      `is_active: !unitData.deleted,`  
      `syrve_data: JSON.stringify(unitData),`  
      `synced_at: new Date()`  
    `};`  
      
    `` const result = await db.query(` ``  
      `INSERT INTO measurement_units (${Object.keys(unit).join(', ')})`  
      ``VALUES (${Object.keys(unit).map((_, i) => `$${i + 1}`).join(', ')})``  
      `ON CONFLICT (business_id, syrve_unit_id) DO UPDATE SET`  
        `name = EXCLUDED.name,`  
        `short_name = EXCLUDED.short_name,`  
        `unit_type = EXCLUDED.unit_type,`  
        `conversion_factor = EXCLUDED.conversion_factor,`  
        `is_active = EXCLUDED.is_active,`  
        `syrve_data = EXCLUDED.syrve_data,`  
        `synced_at = EXCLUDED.synced_at,`  
        `updated_at = NOW()`  
      `RETURNING id`  
    `` `, Object.values(unit)); ``  
      
    `return result.rows[0].id;`  
  `}`  
    
  `private inferUnitType(name: string, code: string): string {`  
    `const nameLC = (name || '').toLowerCase();`  
    `const codeLC = (code || '').toLowerCase();`  
      
    `// Volume indicators`  
    `if (/liter|litre|gallon|barrel|ml|cl|dl|hl|bbl|gal|fl oz/.test(nameLC + codeLC)) {`  
      `return 'VOLUME';`  
    `}`  
      
    `// Weight indicators`  
    `if (/gram|kilogram|pound|ounce|ton|kg|g|lb|oz|mg/.test(nameLC + codeLC)) {`  
      `return 'WEIGHT';`  
    `}`  
      
    `// Count indicators`  
    `if (/piece|bottle|box|case|pallet|pack|unit|pc|btl|pcs/.test(nameLC + codeLC)) {`  
      `return 'COUNT';`  
    `}`  
      
    `return 'OTHER';`  
  `}`  
    
  `// ================================================`  
  `// STEP 4: Import Warehouses (NEW)`  
  `// ================================================`  
  `private async importWarehouses(`  
    `businessId: string,`  
    `token: string,`  
    `syncRunId: string`  
  `): Promise<void> {`  
      
    `console.log('Importing warehouses...');`  
      
    `// Warehouses come from stores endpoint`  
    `const storesResponse = await this.callSyrveAPI(`  
      `'/corporation/stores',`  
      `{ key: token }`  
    `);`  
      
    `await this.processWarehouses(businessId, storesResponse);`  
      
    ``console.log(`✅ Imported warehouses`);``  
  `}`  
    
  `private async processWarehouses(`  
    `businessId: string,`  
    `storesData: any`  
  `): Promise<void> {`  
      
    `const stores = Array.isArray(storesData) ? storesData : storesData.items || [];`  
      
    `for (const storeData of stores) {`  
      `// Each store is a warehouse`  
      `const warehouse = {`  
        `business_id: businessId,`  
        `syrve_store_id: storeData.id,`  
        `syrve_code: storeData.code,`  
        `name: storeData.name,`  
        `description: storeData.description,`  
        `warehouse_type: this.inferWarehouseType(storeData),`  
        `address: storeData.address,`  
        `is_active: !storeData.deleted,`  
        `syrve_data: JSON.stringify(storeData),`  
        `synced_at: new Date()`  
      `};`  
        
      `` await db.query(` ``  
        `INSERT INTO warehouses (${Object.keys(warehouse).join(', ')})`  
        ``VALUES (${Object.keys(warehouse).map((_, i) => `$${i + 1}`).join(', ')})``  
        `ON CONFLICT (business_id, syrve_store_id) DO UPDATE SET`  
          `name = EXCLUDED.name,`  
          `warehouse_type = EXCLUDED.warehouse_type,`  
          `is_active = EXCLUDED.is_active,`  
          `syrve_data = EXCLUDED.syrve_data,`  
          `synced_at = EXCLUDED.synced_at,`  
          `updated_at = NOW()`  
      `` `, Object.values(warehouse)); ``  
    `}`  
  `}`  
    
  `private inferWarehouseType(storeData: any): string {`  
    `const type = (storeData.type || '').toLowerCase();`  
      
    `if (type.includes('external')) return 'EXTERNAL';`  
    `if (type.includes('production')) return 'PRODUCTION';`  
    `if (type.includes('store') || type.includes('restaurant')) return 'STORE';`  
      
    `return 'MAIN';`  
  `}`  
`}`

---

## **13\. Implementation Guide**

## **13.1 Implementation Checklist (UPDATED)**

## **Phase 1A.1: Database Setup**

*  Create all tables in dependency order  
*  Create measurement\_units table with conversion support  
*  Create warehouses and storage\_areas tables  
*  Create inventory\_sessions and related tables  
*  Create inventory\_review\_notes table  
*  Create inventory\_product\_adjustments table  
*  Create all indexes  
*  Create triggers and functions  
*  Set up RLS policies  
*  Test with sample data

## **Phase 1A.2: API Integration \- Bootstrap**

*  Implement authentication service  
*  Implement measurement units import (CRITICAL)  
*  Implement warehouse import  
*  Implement categories import (hierarchy)  
*  Implement products import (GOODS focus)  
*  Implement stock import (warehouse-specific)  
*  Test each importer individually

## **Phase 1A.3: Inventory Session Creation**

*  Build warehouse selection UI  
*  Implement stock baseline fetch  
*  Implement product filtering (GOODS \+ positive stock)  
*  Create inventory session  
*  Copy baseline to baseline\_items table  
*  Test session creation flow

## **Phase 1A.4: Counting Interface**

*  Build mobile counting UI  
*  Implement barcode scanning  
*  Implement product search  
*  Implement count entry (natural units)  
*  Store as count\_events (append-only)  
*  Real-time aggregation  
*  Test concurrent counting

## **Phase 1A.5: Review & Adjustment**

*  Build manager review UI  
*  Show expected vs counted with variance  
*  Implement add notes functionality  
*  Implement adjustments  
*  Show audit trail (who counted what)  
*  Test review workflow

## **Phase 1A.6: Conversion & Submission**

*  Implement unit conversion logic  
*  Build XML document generator  
*  Test conversion accuracy  
*  Implement send to Syrve service  
*  Implement outbox pattern  
*  Handle Syrve response  
*  Test end-to-end submission

## **13.2 Critical Testing Scenarios**

typescript  
`describe('Phase 1A - Critical Paths', () => {`  
    
  `describe('Measurement Units', () => {`  
    `it('should import all units from Syrve');`  
    `it('should identify base units correctly');`  
    `it('should convert bottles to liters correctly');`  
    `it('should convert kegs to hectoliters');`  
    `it('should handle custom units');`  
  `});`  
    
  `describe('Warehouse Management', () => {`  
    `it('should import all warehouses from stores');`  
    `it('should link warehouses to org structure');`  
    `it('should support multiple warehouses per business');`  
  `});`  
    
  `describe('Product Filtering for Inventory', () => {`  
    `it('should show ONLY GOODS products');`  
    `it('should exclude products with zero stock');`  
    `it('should exclude deleted products');`  
    `it('should exclude not_in_store_movement products');`  
    `it('should be warehouse-specific');`  
  `});`  
    
  `describe('Inventory Session', () => {`  
    `it('should create session with baseline');`  
    `it('should fetch current stock from Syrve');`  
    `it('should copy baseline to baseline_items');`  
    `it('should allow only approved users to start session');`  
  `});`  
    
  `describe('Counting', () => {`  
    `it('should accept counts in natural units (bottles)');`  
    `it('should store as append-only events');`  
    `it('should allow multiple staff to count same product');`  
    `it('should aggregate correctly');`  
  `});`  
    
  `describe('Review & Notes', () => {`  
    `it('should allow manager to add notes');`  
    `it('should show variance');`  
    `it('should allow adjustments');`  
    `it('should track who made adjustment');`  
  `});`  
    
  `describe('Conversion & Submission', () => {`  
    `it('should convert bottles to liters correctly');`  
    `it('should build valid XML document');`  
    `it('should calculate variance (expected vs counted)');`  
    `it('should send only items with variance');`  
    `it('should mark as deficit/surplus correctly');`  
    `it('should retry on failure');`  
    `it('should prevent duplicate submissions');`  
  `});`  
`});`

---

## **SUMMARY: Key Points for Phase 1A**

## **✅ What Gets Imported:**

1. Organization structure (departments, stores)  
2. **ALL measurement units** from Syrve  
3. **Warehouses** from stores  
4. Categories (hierarchical)  
5. **GOODS products** (inventory items)  
6. Product containers (for conversion)  
7. Barcodes  
8. **Stock levels** (warehouse-specific, positive only)

## **✅ Inventory Check Workflow:**

1. **Admin creates session IN PLATFORM** (not in Syrve)  
2. System fetches baseline stock from Syrve  
3. Filters: GOODS \+ positive stock \+ active \+ selected warehouse  
4. Staff counts in **natural units** (bottles, kegs, cases)  
5. Manager reviews, adds **notes**, makes **adjustments**  
6. System **converts** to Syrve units (bottles → liters)  
7. Builds XML document  
8. **Sends to Syrve** as new incomingInventory document  
9. Syrve creates the document and returns ID

## **✅ Critical Features:**

* ✅ Import ALL measurement units for proper conversion  
* ✅ Support multiple warehouses  
* ✅ Count ONLY GOODS products (not dishes)  
* ✅ Show only positive stock  
* ✅ Count in natural units (bottles) → convert → send in Syrve units (liters)  
* ✅ Manager can add notes during review  
* ✅ Manager can adjust counts before sending  
* ✅ Append-only counting (no overwrites)  
* ✅ Idempotent Syrve submission (outbox pattern)

---

**END OF PHASE 1A SPECIFICATION (REVISED)**

---

**Document Control:**

* Version: 1.1  
* Last Updated: February 14, 2026  
* Pages: 74  
* Status: Ready for Implementation

