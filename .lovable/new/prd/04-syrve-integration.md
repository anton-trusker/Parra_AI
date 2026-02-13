# 04 — Syrve Integration

**Complete Syrve POS/ERP Integration Specification**

This document defines the integration between the Wine Inventory Platform and Syrve Server API.

---

## Table of Contents

1. [Integration Overview](#integration-overview)
2. [Syrve API Reference](#syrve-api-reference)
3. [Sync Workflows](#sync-workflows)
4. [Outbox Pattern](#outbox-pattern)
5. [Data Mappings](#data-mappings)
6. [Error Handling](#error-handling)

---

## Integration Overview

### **Architecture**

```
Syrve Server (Source of Truth)
        ↓
Edge Functions (proxy + auth)
        ↓
syrve_raw_objects (lossless mirror)
        ↓
Parsed → canonical tables
        ↓
Enriched with local metadata
        ↓
← Outbox pattern for inventory submission
```

### **Key Principles**

1. **Syrve is Master** — Never create products/categories locally first
2. **Edge Functions Only** — All Syrve API calls via Edge Functions (not frontend)
3. **Raw Mirroring** — Store complete Syrve responses for replay/debugging
4. **Idempotent Sync** — Hash-based change detection
5. **Reliable Export** — Outbox pattern with retries for inventory submission

### **Connection Configuration**

Stored in `syrve_config` singleton table:

| Field | Description |
|-------|-------------|
| `server_url` | Base URL (e.g., `http://192.168.1.100:8080`) |
| `api_login` | Syrve API username |
| `api_password_encrypted` | Encrypted password (Supabase Vault) |
| `default_store_id` | Primary store UUID (from Syrve) |
| `connection_status` | `disconnected`, `connected`, `error` |
| `last_sync_at` | Last successful sync timestamp |

---

## Syrve API Reference

### **Base Configuration**

**API Base Path**: `{server_url}/resto/api`

**Authentication**: Session-based (login → session key → logout)

**Auth Flow**:
```
1. POST /auth/login → session key
2. Use key in ALL subsequent requests
3. POST /auth/logout (always in finally block)
```

### **Authentication Endpoints**

#### **Login**

```http
POST /resto/api/auth/login
Content-Type: application/json

{
  "login": "api_user",
  "password_hash": "SHA1_HASH_OF_PASSWORD"
}
```

**Response**:
```json
{
  "sessionKey": "abc123xyz789",
  "serverVersion": "7.8.2"
}
```

**Password Hashing**:
```typescript
const sha1 = (str: string) => {
  const crypto = require('crypto');
  return crypto.createHash('sha1').update(str).digest('hex');
};

const passwordHash = sha1(plainPassword);
```

#### **Logout**

```http
POST /resto/api/auth/logout?key={sessionKey}
```

### **Catalog Endpoints**

#### **GET /corporation/departments**

Organization structure.

```http
GET /resto/api/corporation/departments?key={sessionKey}
```

**Response**:
```xml
<corporateItemDtoes>
  <corporateItemDto>
    <id>uuid</id>
    <name>Main Restaurant</name>
    <code>MAIN</code>
    <description>...</description>
  </corporateItemDto>
</corporateItemDtoes>
```

#### **GET /corporation/stores**

Store locations.

```http
GET /resto/api/corporation/stores?key={sessionKey}
```

**Response**: Similar XML structure with store details.

#### **GET /v2/entities/products/list**

All products.

```http
POST /resto/api/v2/entities/products/list?key={sessionKey}
Content-Type: application/json

{
  "includeDeleted": false
}
```

**Response**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Ch\u00e2teau Margaux 2015",
      "code": "MAR2015",
      "parentGroup": "uuid",
      "type": "GOODS",
      "measureUnit": "Portion",
      "capacity": 0.75,
      "price": 450.00,
      "barcodes": ["1234567890123"]
    }
  ]
}
```

#### **GET /v2/entities/products/group/list**

Product groups (categories).

```http
POST /resto/api/v2/entities/products/group/list?key={sessionKey}
Content-Type: application/json

{}
```

**Response**:
```json
{
  "productGroups": [
    {
      "id": "uuid",
      "name": "Red Wines",
      "parentId": null
    }
  ]
}
```

### **Inventory Endpoints**

#### **GET /stock-and-sales**

Current stock snapshot.

```http
POST /resto/api/stock-and-sales?key={sessionKey}
Content-Type: application/json

{
  "storeId": "uuid",
  "includeDeleted": false
}
```

**Response**:
```json
{
  "stockItems": [
    {
      "productId": "uuid",
      "amount": 12.5
    }
  ]
}
```

#### **POST /v2/documents/import/inventory**

Submit inventory XML document.

```http
POST /resto/api/v2/documents/import/inventory?key={sessionKey}
Content-Type: application/xml

<document>
  <documentNumber>INV-2024-001</documentNumber>
  <dateIncoming>2024-02-13T10:00:00</dateIncoming>
  <store>uuid</store>
  <items>
    <item>
      <product>uuid</product>
      <amount>10</amount>
    </item>
  </items>
</document>
```

**Response**:
```json
{
  "documentId": "uuid",
  "status": "Success"
}
```

---

## Sync Workflows

### **1. Bootstrap Sync** (Initial)

**Trigger**: First-time setup or full reset

**Edge Function**: `syrve-bootstrap-sync`

**Steps**:
```
1. Create sync_run record (type='bootstrap', status='processing')
2. Login to Syrve
3. Fetch all entities:
   - /corporation/departments
   - /corporation/stores
   - /v2/entities/products/group/list
   - /v2/entities/products/list
4. For each response:
   - Compute payload_hash = SHA256(JSON.stringify(payload))
   - Upsert into syrve_raw_objects (entity_type, syrve_id, payload, payload_hash)
5. Parse and upsert canonical tables:
   - org_nodes (from departments)
   - stores (from stores)
   - categories (from product groups)
   - products (from products)
   - product_barcodes (from product barcodes array)
6. Logout
7. Update sync_run (status='success', stats={'products_synced': N})
```

**Idempotency**: `UNIQUE (entity_type, syrve_id, payload_hash)` prevents duplicate raw records.

### **2. Incremental Sync** (Products)

**Trigger**: Scheduled (hourly/daily) or manual

**Edge Function**: `syrve-sync-products`

**Steps**:
```
1. Create sync_run (type='products_sync')
2. Login
3. Fetch /v2/entities/products/list
4. For each product:
   - Compute hash
   - If hash changed:
     - Insert new syrve_raw_objects row
     - Parse and update products table
5. Mark deleted products: is_deleted=true if not in latest sync
6. Logout
7. Update sync_run
```

### **3. Load Baseline** (Per Session)

**Trigger**: Manager starts inventory session

**Edge Function**: `inventory-load-baseline`

**Steps**:
```
1. Validate session (status='draft')
2. Login to Syrve
3. Fetch /stock-and-sales for session.store_id
4. For each stock item:
   - Insert inventory_baseline_items:
     * session_id
     * product_id (lookup from syrve_product_id)
     * expected_qty_unopened = amount
     * expected_open_liters = 0 (Syrve doesn't track open bottles)
5. Update session:
   - baseline_taken_at = now()
   - status = 'in_progress'
6. Logout
```

### **4. Submit Inventory** (Outbox)

**Trigger**: Manager approves session

**Edge Function**: `inventory-submit-to-syrve`

**Steps**:
```
1. Validate session (status='approved')
2. Aggregate counted totals from inventory_count_events
3. Build XML payload:
   - documentNumber = session.id
   - dateIncoming = session.approved_at
   - store = session.store_id
   - items = aggregated products
4. Compute payload_hash = SHA256(xml)
5. Insert syrve_outbox_jobs:
   - session_id
   - job_type = 'inventory_commit'
   - payload_xml
   - payload_hash
   -status = 'pending'
6. Return job_id
```

Background processor (`syrve-process-outbox`) picks up pending jobs.

---

## Outbox Pattern

### **Purpose**

Reliable, asynchronous submission to Syrve with automatic retries.

### **Workflow**

```
Manager approves session
        ↓
Insert outbox job (status='pending')
        ↓
Return immediately to user
        ↓
Background processor (cron or manual)
        ↓
Pick next pending job (FOR UPDATE SKIP LOCKED)
        ↓
Mark 'processing'
        ↓
Login → Submit XML → Logout
        ↓
[Success] → status='success', store response, update session (syrve_synced_at, syrve_document_id)
[Failure] → attempts++, last_error, status='failed' (retry logic)
```

### **Retry Logic**

```typescript
const MAX_ATTEMPTS = 5;
const RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds

async function processOutbox() {
  const job = await getNextPendingJob();
  
  if (job.attempts >= MAX_ATTEMPTS) {
    await markJobFailed(job.id, 'Max retries exceeded');
    return;
  }
  
  try {
    await markJobProcessing(job.id);
    const response = await submitToSyrve(job.payload_xml);
    await markJobSuccess(job.id, response);
    await updateSession(job.session_id, {
      status: 'synced',
      syrve_document_id: response.documentId,
      syrve_synced_at: new Date()
    });
  } catch (error) {
    await markJobFailed(job.id, error.message);
    // Retry after delay
    const delay = RETRY_DELAYS[job.attempts] || 7200;
    await scheduleRetry(job.id, delay);
  }
}
```

### **Idempotency**

```sql
UNIQUE(job_type, payload_hash)
```

If same XML is resubmitted (duplicate approval click), constraint prevents duplicate job creation.

---

## Data Mappings

### **Syrve Product → `products` Table**

| Syrve Field | Target Column | Transformation |
|-------------|---------------|----------------|
| `id` | `syrve_product_id` | Direct UUID |
| `name` | `name` | Direct string |
| `code` | `code` | Direct string |
| `parentGroup` | `category_id` | Lookup `categories` by `syrve_group_id` |
| `type` | `product_type` | Direct string |
| `capacity` | `unit_capacity_liters` | Direct numeric |
| `price` | `default_sale_price` | Direct numeric |
| `barcodes[]` | → `product_barcodes` | Insert each barcode |
| (full JSON) | `syrve_data` | Store entire payload |

### **Inventory Aggregates → Syrve XML**

**Source**: `inventory_product_aggregates`

**Target**: XML `<item>` elements

```typescript
const buildInventoryXML = (session: InventorySession, aggregates: Aggregate[]) => {
  return `<?xml version="1.0" encoding="utf-8"?>
<document>
  <documentNumber>${session.id}</documentNumber>
  <dateIncoming>${session.approved_at.toISOString()}</dateIncoming>
  <store>${session.store_id}</store>
  <items>
    ${aggregates.map(agg => {
      const product = getProduct(agg.product_id);
      const totalAmount = agg.counted_unopened_total + (agg.counted_open_liters_total / (product.unit_capacity_liters || 0.75));
      
      return `<item>
      <product>${product.syrve_product_id}</product>
      <amount>${totalAmount.toFixed(3)}</amount>
    </item>`;
    }).join('\n')}
  </items>
</document>`;
};
```

---

## Error Handling

### **Common Errors**

| Error | Cause | Resolution |
|-------|-------|------------|
| **401 Unauthorized** | Invalid credentials or expired session | Re-login, check config |
| **404 Not Found** | Wrong endpoint or Syrve version mismatch | Verify API version |
| **500 Internal Error** | Syrve server issue | Retry with exponential backoff |
| **Network Timeout** | Slow connection or large dataset | Increase timeout, paginate |
| **XML Parse Error** | Invalid inventory format | Validate XML schema |

### **Logging**

All Syrve API calls logged in `syrve_api_logs`:

```sql
INSERT INTO syrve_api_logs (action_type, status, request_payload, response_payload, error_message)
VALUES ('fetch_products', 'success', '{}', '{"products": [...]}', NULL);
```

### **Monitoring**

Check `syrve_sync_runs` for failed syncs:

```sql
SELECT *
FROM syrve_sync_runs
WHERE status = 'failed'
ORDER BY started_at DESC
LIMIT 10;
```

Check `syrve_outbox_jobs` for stuck jobs:

```sql
SELECT *
FROM syrve_outbox_jobs
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

---

## Next Steps

- Review [05-edge-functions.md](05-edge-functions.md) for Edge Function implementations
- Study [07-inventory-management.md](07-inventory-management.md) for complete inventory workflow
- Examine [08-deployment-guide.md](08-deployment-guide.md) for Syrve credential management
