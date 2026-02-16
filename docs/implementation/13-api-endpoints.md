# 13 — API Endpoints & Request/Response Contracts

## Edge Function Endpoints

### POST /syrve-connect-test

**Request**:
```json
{
  "server_url": "https://parra.syrve.online:443/resto/api",
  "api_login": "admin",
  "api_password": "secret"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "password_hash": "5baa61e4c9b93f3f...",
  "server_version": "7.8.1",
  "stores": [
    { "id": "uuid", "name": "Main Store", "type": "DEFAULT" }
  ],
  "departments": [
    { "id": "uuid", "name": "Restaurant", "type": "DEPARTMENT", "parentId": "uuid" }
  ]
}
```

### POST /syrve-sync-bootstrap

**Request**:
```json
{ "tenant_id": "uuid" }
```

**Response**:
```json
{
  "success": true,
  "sync_run_id": "uuid",
  "stats": {
    "departments_imported": 5,
    "stores_imported": 3,
    "units_imported": 25,
    "categories_imported": 42,
    "products_imported": 350,
    "barcodes_imported": 280,
    "containers_imported": 120,
    "stock_levels_imported": 250,
    "duration_ms": 15000
  }
}
```

### POST /syrve-stock-snapshot

**Request**:
```json
{
  "tenant_id": "uuid",
  "warehouse_ids": ["uuid1", "uuid2"]
}
```

**Response**:
```json
{
  "success": true,
  "snapshots": [
    {
      "warehouse_id": "uuid",
      "products_updated": 150,
      "total_stock_value": 45000.00
    }
  ]
}
```

### POST /syrve-submit-inventory

**Request**:
```json
{
  "tenant_id": "uuid",
  "session_id": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "outbox_job_id": "uuid",
  "status": "pending"
}
```

### POST /ai-recognize-product

**Request**:
```json
{
  "tenant_id": "uuid",
  "image_url": "https://...",
  "model": "gemini-flash"
}
```

**Response**:
```json
{
  "success": true,
  "matches": [
    {
      "product_id": "uuid",
      "product_name": "Absolut Vodka 1L",
      "confidence": 0.95,
      "match_method": "barcode"
    }
  ],
  "extracted_data": {
    "brand": "Absolut",
    "volume": "1L",
    "barcode": "7312040017072"
  },
  "ai_operation_id": "uuid",
  "tokens_used": 450,
  "processing_time_ms": 2300
}
```

## Supabase Client Queries (Frontend)

### Products
```typescript
// List countable products for inventory
const { data } = await supabase.rpc('get_countable_products', {
  p_tenant_id: tenantId,
  p_warehouse_id: warehouseId,
  p_category_id: categoryId || null
});

// Search products by name
const { data } = await supabase
  .from('products')
  .select('*, categories(name)')
  .textSearch('search_vector', query)
  .eq('tenant_id', tenantId);
```

### Inventory Sessions
```typescript
// List sessions
const { data } = await supabase
  .from('inventory_sessions')
  .select('*, warehouses(name), profiles!created_by(full_name)')
  .order('created_at', { ascending: false });

// Insert count event
const { data } = await supabase
  .from('inventory_count_events')
  .insert({
    session_id, product_id, counted_by: userId,
    quantity_counted: 15, counting_unit_id: bottleUnitId,
    method: 'barcode'
  });
```

### Stock Levels
```typescript
const { data } = await supabase
  .from('stock_levels')
  .select('*, products(name, sku), warehouses(name), measurement_units(short_name)')
  .eq('warehouse_id', warehouseId)
  .gt('quantity', 0);
```
