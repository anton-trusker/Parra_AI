# 09 — API Reference

**Complete API Documentation for Wine Inventory Platform**

This document provides a comprehensive reference for all APIs, including Supabase PostgREST, RPC functions, and Edge Functions.

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [PostgREST API](#postgrest-api)
4. [RPC Functions](#rpc-functions)
5. [Edge Functions](#edge-functions)
6. [Error Handling](#error-handling)

---

## API Overview

### **Base URLs**

```
PostgREST API: https://{PROJECT_REF}.supabase.co/rest/v1/
Edge Functions: https://{PROJECT_REF}.supabase.co/functions/v1/
```

### **Authentication**

All requests require `Authorization` header:

```http
Authorization: Bearer {JWT_TOKEN}
```

---

## Authentication

### **Sign Up** (Email/Password)

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password'
});
```

### **Sign In** (Email/Password)

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

### **Sign In** (Username/Password via Edge Function)

```http
POST /functions/v1/auth-login-username
Content-Type: application/json

{
  "username": "staff1",
  "password": "password"
}
```

**Response**:
```json
{
  "session": {
    "access_token": "jwt-token",
    "refresh_token": "refresh-token"
  },
  "user": {...},
  "profile": {...}
}
```

### **Sign Out**

```typescript
await supabase.auth.signOut();
```

---

## PostgREST API

### **Products**

#### **List Products**

```http
GET /rest/v1/products?select=*&is_active=eq.true&order=name.asc
```

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Château Margaux 2015",
    "code": "MAR2015",
    "category_id": "uuid",
    "default_sale_price": 450.00
  }
]
```

#### **Get Product with Wine Details**

```http
GET /rest/v1/products?id=eq.{uuid}&select=*,wines(*),category:categories(name)
```

#### **Search Products by Barcode**

```http
GET /rest/v1/product_barcodes?barcode=eq.1234567890&select=product:products(*)
```

### **Inventory Sessions**

#### **Create Session**

```http
POST /rest/v1/inventory_sessions
Content-Type: application/json

{
  "store_id": "uuid",
  "title": "Weekly Count - Feb 13",
  "status": "draft",
  "created_by": "uuid"
}
```

#### **List Sessions**

```http
GET /rest/v1/inventory_sessions?select=*,store:stores(name),creator:profiles!created_by(full_name)&order=created_at.desc
```

#### **Get Session with Details**

```http
GET /rest/v1/inventory_sessions?id=eq.{uuid}&select=*,baseline:inventory_baseline_items(*),events:inventory_count_events(*),aggregates:inventory_product_aggregates(*)
```

### **Inventory Count Events**

#### **Insert Count Event**

```http
POST /rest/v1/inventory_count_events
Content-Type: application/json

{
  "session_id": "uuid",
  "product_id": "uuid",
  "counted_by": "uuid",
  "bottles_unopened": 12,
  "open_ml": 375,
  "method": "manual"
}
```

#### **List Events for Session**

```http
GET /rest/v1/inventory_count_events?session_id=eq.{uuid}&select=*,product:products(name),counter:profiles!counted_by(full_name)
```

### **Product Aggregates**

#### **Get Session Aggregates**

```http
GET /rest/v1/inventory_product_aggregates?session_id=eq.{uuid}&select=*,product:products(name)
```

---

## RPC Functions

### **Vector Search Products**

**Purpose**: Find products by text similarity using pgvector

```typescript
const { data, error } = await supabase.rpc('vector_search_products', {
  query_embedding: [0.1, 0.2, ...], // 1536-dim vector
  match_threshold: 0.7,
  match_count: 10
});
```

**SQL Definition**:
```sql
CREATE OR REPLACE FUNCTION vector_search_products(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    product_id UUID,
    name TEXT,
    producer TEXT,
    vintage INT,
    similarity FLOAT
)...
```

**Response**:
```json
[
  {
    "product_id": "uuid",
    "name": "Château Margaux 2015",
    "producer": "Château Margaux",
    "vintage": 2015,
    "similarity": 0.95
  }
]
```

### **Check Permission**

```typescript
const { data: hasPermission } = await supabase.rpc('has_permission', {
  module_name: 'inventory',
  action_name: 'approve',
  required_level: 'full'
});
```

### **Get Session Variances**

```typescript
const { data: variances } = await supabase.rpc('get_session_variances', {
  p_session_id: sessionId
});
```

**Returns**:
```json
[
  {
    "product_id": "uuid",
    "product_name": "Château Margaux 2015",
    "expected_total": 15.75,
    "counted_total": 14.25,
    "difference": -1.5,
    "variance_pct": -9.52
  }
]
```

---

## Edge Functions

### **Syrve Integration**

#### **Test Connection**

```http
POST /functions/v1/syrve-connect-test
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "server_url": "http://192.168.1.100:8080",
  "login": "api_user",
  "password": "password"
}
```

**Response**:
```json
{
  "success": true,
  "server_version": "7.8.2",
  "stores": [...]
}
```

#### **Bootstrap Sync**

```http
POST /functions/v1/syrve-bootstrap-sync
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "include_categories": true,
  "include_products": true
}
```

**Response**:
```json
{
  "sync_run_id": "uuid",
  "stats": {
    "stores_synced": 3,
    "categories_synced": 45,
    "products_synced": 523
  }
}
```

#### **Sync Products**

```http
POST /functions/v1/syrve-sync-products
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "force_full_sync": false
}
```

**Response**:
```json
{
  "sync_run_id": "uuid",
  "stats": {
    "products_synced": 42,
    "duration_ms": 1200
  }
}
```

#### **Stock Snapshot**

```http
POST /functions/v1/syrve-stock-snapshot
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "store_id": "uuid",
  "session_id": "uuid" (optional)
}
```

**Response**:
```json
{
  "snapshot_id": "uuid",
  "items_count": 234,
  "baseline_updated": true
}
```

### **Inventory**

#### **Load Baseline**

```http
POST /functions/v1/inventory-load-baseline
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "session_id": "uuid"
}
```

**Response**:
```json
{
  "baseline_loaded": true,
  "products_count": 234,
  "session_status": "in_progress"
}
```

#### **Submit to Syrve**

```http
POST /functions/v1/inventory-submit-to-syrve
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "session_id": "uuid"
}
```

**Response**:
```json
{
  "outbox_job_id": "uuid",
  "status": "queued"
}
```

### **AI Recognition**

#### **Scan Label**

```http
POST /functions/v1/ai-scan
Authorization: Bearer {JWT}
Content-Type: application/json

{
  "session_id": "uuid",
  "image_path": "ai-scans/uuid/label.jpg"
}
```

**Response**:
```json
{
  "run_id": "uuid",
  "top_match": {
    "product_id": "uuid",
    "confidence": 0.95,
    "name": "Château Margaux 2015"
  },
  "candidates": [...],"ocr_text": "CHÂTEAU MARGAUX..."
}
```

---

## Error Handling

### **Error Response Format**

```json
{
  "code": "PGRST116",
  "message": "The result contains 0 rows",
  "details": null,
  "hint": null
}
```

### **Common HTTP Status Codes**

| Code | Meaning | Common Causes |
|------|---------|---------------|
| **200** | Success | Request successful |
| **201** | Created | Resource created |
| **400** | Bad Request | Invalid JSON or parameters |
| **401** | Unauthorized | Missing or invalid JWT |
| **403** | Forbidden | RLS policy denial |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Unique constraint violation |
| **500** | Internal Error | Server/database error |

### **RLS Policy Errors**

```json
{
  "code": "42501",
  "message": "new row violates row-level security policy"
}
```

**Solution**: Check user permissions and RLS policies.

### **Unique Constraint Violations**

```json
{
  "code": "23505",
  "message": "duplicate key value violates unique constraint"
}
```

**Solution**: Use `upsert` or check for existing records first.

---

## Next Steps

- Review [03-authentication.md](03-authentication.md) for auth flows
- Study [05-edge-functions.md](05-edge-functions.md) for function implementations
- Examine [02-database-schema.md](02-database-schema.md) for complete schema reference
