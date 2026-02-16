-- =====================================================
-- REMOVE WINE-SPECIFIC TABLES
-- Created: 2026-02-16 18:35:00
-- =====================================================
-- Parra_AI is a general inventory management platform
-- with Syrve POS integration, NOT a wine inventory system.
-- 
-- This migration removes wine-specific tables that were
-- mistakenly included from an old template migration.
-- =====================================================

-- Drop wine-related tables (CASCADE will drop foreign keys)
DROP TABLE IF EXISTS wine_images CAS CADE;
DROP TABLE IF EXISTS wine_barcodes CASCADE;
DROP TABLE IF EXISTS wine_variants CASCADE;
DROP TABLE IF EXISTS wines CASCADE;
DROP TABLE IF EXISTS wine_producers CASCADE;
DROP TABLE IF EXISTS grape_varieties CASCADE;

-- Drop wine-specific reference tables
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS volume_options CASCADE;
DROP TABLE IF EXISTS glass_dimensions CASCADE;

-- Note: Keeping locations/sub_locations as they might be used
-- for inventory locations (warehouses, shelves, etc.)
-- User can drop these manually if they're wine-specific

-- Drop wine-specific enum types
DROP TYPE IF EXISTS wine_type_enum CASCADE;
DROP TYPE IF EXISTS bottle_state_enum CASCADE;

-- Drop any wine-related functions/triggers
DROP FUNCTION IF EXISTS update_wines_updated_at() CASCADE;
DROP TRIGGER IF EXISTS wines_updated_at ON wines;

-- Cleanup complete
SELECT 'Wine-specific tables removed successfully' AS status;
