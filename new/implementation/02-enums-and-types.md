# 02 — Enums & Custom Types

All PostgreSQL enums and types for the new project.

```sql
-- =====================================================
-- USER ROLES
-- =====================================================
CREATE TYPE app_role AS ENUM (
  'owner',    -- Full access, billing
  'admin',    -- Full access, no billing
  'manager',  -- Inventory approval, reports
  'staff',    -- Counting, basic operations
  'viewer'    -- Read-only access
);

-- =====================================================
-- INTEGRATION TYPES
-- =====================================================
CREATE TYPE integration_type AS ENUM (
  'pos',        -- POS systems (Syrve, Square, Toast)
  'booking',    -- Table booking (TheFork, SevenRooms)
  'payment',    -- Payment processors (Stripe)
  'delivery',   -- Delivery platforms
  'accounting', -- Accounting (QuickBooks, Xero)
  'marketing',  -- Email/SMS
  'analytics'   -- Analytics platforms
);

-- =====================================================
-- INVENTORY SESSION STATUS
-- =====================================================
CREATE TYPE inventory_session_status AS ENUM (
  'draft',              -- Being set up
  'in_progress',        -- Staff are counting
  'counting_complete',  -- Counting done, awaiting review
  'under_review',       -- Manager is reviewing
  'pending_approval',   -- Waiting for final approval
  'approved',           -- Approved, ready to send
  'sending',            -- Being sent to Syrve
  'synced',             -- Successfully sent to Syrve
  'failed',             -- Send failed
  'cancelled'           -- Cancelled
);

-- =====================================================
-- COUNTING METHODS
-- =====================================================
CREATE TYPE inventory_count_method AS ENUM (
  'manual',             -- Manual entry
  'barcode',            -- Barcode scan
  'image_ai',           -- AI recognition
  'manager_adjustment', -- Manager correction
  'voice',              -- Voice input (future)
  'nfc'                 -- NFC tag scan (future)
);

-- =====================================================
-- SYRVE JOB TYPES
-- =====================================================
CREATE TYPE syrve_job_type AS ENUM (
  'bootstrap',        -- Initial data import
  'products_sync',    -- Product catalog sync
  'stock_snapshot',   -- Stock level snapshot
  'inventory_commit'  -- Inventory document submission
);

-- =====================================================
-- JOB STATUS
-- =====================================================
CREATE TYPE job_status AS ENUM (
  'pending',    -- Queued
  'processing', -- In progress
  'success',    -- Completed
  'failed'      -- Failed
);

-- =====================================================
-- SYNC STATUS
-- =====================================================
CREATE TYPE sync_status AS ENUM (
  'running',
  'success',
  'partial',
  'failed',
  'cancelled'
);

-- =====================================================
-- SUBSCRIPTION TIERS
-- =====================================================
CREATE TYPE subscription_tier AS ENUM (
  'free',       -- Limited features
  'pro',        -- Full features, usage limits
  'enterprise'  -- Unlimited
);

-- =====================================================
-- PRODUCT TYPES (from Syrve)
-- =====================================================
CREATE TYPE product_type AS ENUM (
  'GOODS',     -- Raw materials, inventory tracked
  'DISH',      -- Menu items
  'PREPARED',  -- Semi-finished goods
  'SERVICE',   -- Services, not tracked
  'MODIFIER',  -- Add-ons
  'OUTER',     -- External goods
  'PETROL',    -- Fuel
  'RATE'       -- Fees
);

-- =====================================================
-- PRODUCT GROUP TYPES
-- =====================================================
CREATE TYPE product_group_type AS ENUM (
  'PRODUCTS',
  'MODIFIERS'
);

-- =====================================================
-- ORGANIZATION NODE TYPES
-- =====================================================
CREATE TYPE org_node_type AS ENUM (
  'CORPORATION',
  'JURPERSON',
  'DEPARTMENT',
  'STORE',
  'SECTION',
  'OTHER'
);

-- =====================================================
-- WAREHOUSE TYPES
-- =====================================================
CREATE TYPE warehouse_type AS ENUM (
  'MAIN',        -- Primary warehouse
  'STORE',       -- Individual store/restaurant
  'PRODUCTION',  -- Production facility
  'EXTERNAL',    -- External/supplier warehouse
  'VIRTUAL'      -- Virtual/logical warehouse
);

-- =====================================================
-- STORAGE AREA TYPES
-- =====================================================
CREATE TYPE storage_area_type AS ENUM (
  'BAR',
  'CELLAR',
  'KITCHEN',
  'DRY_STORAGE',
  'COLD_STORAGE',
  'FREEZER',
  'DISPLAY',
  'RECEIVING',
  'STAGING',
  'OTHER'
);

-- =====================================================
-- MEASUREMENT UNIT TYPES
-- =====================================================
CREATE TYPE unit_type AS ENUM (
  'VOLUME',  -- Liters, ml, gallons
  'WEIGHT',  -- kg, g, lbs
  'COUNT',   -- pieces, bottles, boxes
  'LENGTH',  -- meters, feet
  'AREA',    -- sq meters
  'TIME',    -- hours, minutes
  'OTHER'    -- Custom units
);

-- =====================================================
-- BARCODE SOURCES
-- =====================================================
CREATE TYPE barcode_source AS ENUM (
  'syrve',
  'manual',
  'ai',
  'import'
);

-- =====================================================
-- CUSTOM FIELD DATA TYPES
-- =====================================================
CREATE TYPE field_data_type AS ENUM (
  'text', 'number', 'boolean', 'date', 'datetime',
  'select', 'multi_select', 'url', 'email', 'phone',
  'currency', 'percentage', 'json'
);
```
