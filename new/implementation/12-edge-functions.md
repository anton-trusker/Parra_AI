# 12 — Edge Functions Specification

## Function Index

```
supabase/functions/
├── syrve-connect-test/        # Test credentials, fetch stores
├── syrve-sync-bootstrap/      # Full data import
├── syrve-sync-products/       # Incremental product sync
├── syrve-stock-snapshot/      # Fetch stock levels per warehouse
├── syrve-submit-inventory/    # Build XML, submit inventory document
├── process-outbox-jobs/       # Background worker for Syrve delivery
├── ai-recognize-product/      # AI image recognition
├── manage-users/              # User CRUD
└── calculate-monthly-usage/   # Billing calculations
```

## 1. syrve-connect-test

**Purpose**: Test Syrve credentials and fetch organization structure.

**Input**: `{ server_url, api_login, api_password }`

**Flow**:
1. Hash password with SHA-1
2. `GET /auth?login={login}&pass={hash}` → get token
3. `GET /corporation/stores?key={token}` → list stores
4. `GET /corporation/departments?key={token}` → list departments
5. `GET /logout?key={token}` → release license
6. Return success + password_hash + stores + departments

## 2. syrve-sync-bootstrap

**Purpose**: Full initial data import from Syrve.

**Input**: `{ tenant_id }`

**Flow** (sequential, one token session):
1. Authenticate
2. Import organization: `/corporation/departments`, `/corporation/stores`
3. Import measurement units: `/units/list`
4. Import categories: `/v2/entities/products/group/list`
5. Import products: `/v2/entities/products/list`
6. Extract barcodes, containers from products
7. Import stock: `/v2/entities/products/stock-and-sales` per warehouse
8. Logout
9. Store raw payloads in `syrve_raw_objects`
10. Update `syrve_sync_runs` with stats

**Error Handling**: Wrap in try/finally for logout. Log every API call to `syrve_api_logs`.

## 3. syrve-sync-products

**Purpose**: Incremental product sync (delta updates).

**Flow**:
1. Authenticate
2. Fetch products with `includeDeleted=true`
3. Compare payload_hash with stored syrve_raw_objects
4. Upsert only changed products
5. Logout

## 4. syrve-stock-snapshot

**Purpose**: Fetch current stock levels for selected warehouses.

**Input**: `{ tenant_id, warehouse_ids?: UUID[] }`

**Flow**:
1. Authenticate
2. For each warehouse: `GET /v2/entities/products/stock-and-sales?storeIds={syrve_store_id}`
3. Batch product IDs in groups of 500
4. Upsert into `stock_levels`
5. Logout

## 5. syrve-submit-inventory

**Purpose**: Convert approved inventory session to XML and submit to Syrve.

**Input**: `{ tenant_id, session_id }`

**Flow**:
1. Load session + aggregates + adjustments
2. Convert quantities to product's main unit (using unit_capacity)
3. Build XML document:
```xml
<document>
  <documentNumber>INV-{session_number}</documentNumber>
  <dateIncoming>{ISO date}</dateIncoming>
  <storeId>{syrve_store_id}</storeId>
  <items>
    <item>
      <productId>{syrve_product_id}</productId>
      <amountContainer>{quantity_in_main_unit}</amountContainer>
    </item>
  </items>
</document>
```
4. Insert into `syrve_outbox_jobs` (status=pending)
5. Update session status to 'sending'

## 6. process-outbox-jobs

**Purpose**: Background worker that processes pending outbox jobs.

**Flow**:
1. Select pending jobs: `WHERE status = 'pending' AND attempts < max_attempts`
2. For each job:
   a. Authenticate to Syrve
   b. `POST /documents/import/incomingInventory?key={token}` with payload_xml
   c. If success: update job status='success', store response_xml
   d. If fail: increment attempts, store error
   e. Logout
3. Update related session status

**Idempotency**: Use payload_hash to prevent duplicate submissions.

## 7. ai-recognize-product

**Purpose**: AI-powered product recognition from images.

**Input**: `{ tenant_id, image_url, model? }`

**Flow**:
1. Check tenant AI usage limits
2. Call AI model (Gemini Flash for free tier)
3. Extract product data from image
4. Match against tenant's product catalog
5. Log to `ai_operations` for billing
6. Return match results with confidence scores

## Shared: Syrve API Client Pattern

```typescript
async function withSyrveSession<T>(
  config: SyrveConfig,
  operation: (token: string) => Promise<T>
): Promise<T> {
  const hash = await sha1(config.api_password);
  const authRes = await fetch(`${config.server_url}/auth?login=${config.api_login}&pass=${hash}`);
  const token = await authRes.text();

  try {
    return await operation(token);
  } finally {
    await fetch(`${config.server_url}/logout?key=${token}`);
  }
}
```
