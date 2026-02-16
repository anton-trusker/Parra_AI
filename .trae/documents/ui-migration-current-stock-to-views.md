# UI Migration: Current Stock to Views

## Overview

This document outlines the migration from using direct `current_stock` field to using `v_stock_summary` view and `stock_levels` table for improved warehouse-aware stock management.

## Current Implementation

### Pages Using current_stock

1. **CurrentStock.tsx** (main inventory page)
   - Line 75: Stock status badge uses `p.current_stock`
   - Line 113: Quick filter calculations use `p.current_stock`
   - Line 175: DataTable displays stock information

2. **ProductDetail.tsx** 
   - Line 208: Displays current stock in product details
   - Line 220: Uses current_stock for total stock calculations

### Current Issues

- `current_stock` is a denormalized field on products table
- No warehouse/store awareness in UI
- Limited stock tracking capabilities
- Single global stock value per product

## Target Implementation

### Views and Tables to Use

1. **v_stock_summary** - Aggregated stock view
   - `total_stock` - Sum of all warehouse stock
   - `total_value` - Total inventory value
   - Includes product details and category information

2. **stock_levels** - Detailed per-warehouse stock
   - `quantity` - Stock amount per warehouse
   - `unit_cost` - Cost per unit
   - `store_id` - Warehouse/store reference
   - `measurement_units` - Unit information

### Required Changes

#### 1. Update Product Interface

```typescript
// Add to Product interface in useProducts.ts
interface Product {
  // ... existing fields
  total_stock?: number; // From v_stock_summary
  total_value?: number;   // From v_stock_summary
  stock_levels?: StockLevel[]; // Detailed warehouse stock
}
```

#### 2. Update CurrentStock.tsx

**Stock Status Badge (Line 75):**
```typescript
// Change from:
render: (p: Product) => <StockStatusBadge stock={p.current_stock} />

// To:
render: (p: Product) => <StockStatusBadge stock={p.total_stock} />
```

**Quick Filter Calculations (Line 113):**
```typescript
// Update quickCounts to use total_stock
const quickCounts = useMemo(() => ({
  outOfStock: products.filter(p => (p.total_stock ?? 0) <= 0).length,
  lowStock: products.filter(p => (p.total_stock ?? 0) > 0 && (p.total_stock ?? 0) < 5).length,
  inStock: products.filter(p => (p.total_stock ?? 0) >= 5).length,
}), [products]);
```

#### 3. Update ProductDetail.tsx

**Stock Display (Line 208):**
```typescript
// Change from:
<InfoRow label="Current Stock" value={product.current_stock?.toString()} highlight />

// To:
<InfoRow label="Total Stock" value={product.total_stock?.toString()} highlight />
```

**Total Stock Calculation (Line 220):**
```typescript
// Change from:
<InfoRow label="Total Stock" value={`${totalStoreStock || product.current_stock || 0}${mainUnitLabel ? ` ${mainUnitLabel}` : ''}`} highlight />

// To:
<InfoRow label="Total Stock" value={`${product.total_stock || 0}${mainUnitLabel ? ` ${mainUnitLabel}` : ''}`} highlight />
```

#### 4. Update Data Fetching

**In useProducts.ts:**
```typescript
// Modify query to include stock summary
const { data, error } = await supabase
  .from('v_stock_summary')
  .select('*')
  // ... existing filters
```

**Add warehouse-aware queries:**
```typescript
// For store-specific stock
const { data: stockLevels } = await supabase
  .from('stock_levels')
  .select('*, measurement_units(name, short_name)')
  .eq('store_id', selectedStoreId)
  .in('product_id', productIds)
```

## Migration Steps

1. **Phase 1: Update Data Layer**
   - Modify useProducts hook to fetch from v_stock_summary
   - Add stock_levels fetching for detailed views
   - Update Product interface

2. **Phase 2: Update UI Components**
   - Replace current_stock references with total_stock
   - Update stock status calculations
   - Test stock filtering functionality

3. **Phase 3: Add Warehouse Selection**
   - Add store/warehouse filter to CurrentStock page
   - Update stock display to show warehouse breakdown
   - Implement per-warehouse stock editing

4. **Phase 4: Remove Legacy Field**
   - Remove current_stock from Product interface
   - Remove current_stock column from database
   - Update any remaining references

## Benefits

- **Warehouse-aware**: Stock tracked per warehouse/store
- **Accurate aggregation**: Proper stock summation across locations
- **Historical tracking**: Stock levels with timestamps
- **Unit support**: Proper measurement unit handling
- **Value tracking**: Inventory value calculations
- **Performance**: Optimized views for stock queries

## Testing Checklist

- [ ] Stock status badges display correctly
- [ ] Quick filters work with new stock data
- [ ] Product details show correct stock information
- [ ] Stock calculations are accurate
- [ ] Warehouse selection works properly
- [ ] Stock filtering by store works
- [ ] No regression in inventory counting
- [ ] Stock values display correctly
- [ ] Mobile views work properly

## Rollback Plan

If issues arise:
1. Revert to current_stock field usage
2. Keep v_stock_summary as backup data source
3. Maintain dual data sources during transition
4. Monitor for data inconsistencies