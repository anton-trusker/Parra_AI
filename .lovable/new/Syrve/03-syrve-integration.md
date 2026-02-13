# 03 — Syrve Integration Logic

## Overview

Syrve is the **master system** for all product data. The app is a powerful inventory counting and tracking layer. All integration happens via **Supabase Edge Functions** — secrets never reach the client.

### Core Principles

1. **Admin configures everything via UI** — server URL, credentials, store — no `.env` hardcoding
2. **Test before save** — admin must verify connection works before credentials are stored
3. **All products from Syrve** — categories and products are synced, not manually created
4. **Store-specific** — admin selects which Syrve store to track inventory for
5. **License management** — login → operate → logout (try/finally pattern)
6. **Credentials encrypted** — password stored encrypted; only Edge Functions can decrypt

---

## Admin Connection Setup (NEW — Critical Feature)

### UI: Settings → Syrve Connection (`/settings/syrve`)

```
┌────────────────────────────────────────────────────────┐
│  🔌 Syrve Server Connection                            │
│                                                         │
│  Server URL                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │ http://192.168.1.100:8080                         │  │
│  └──────────────────────────────────────────────────┘  │
│  ℹ️ Enter the Syrve server address without /resto/api   │
│                                                         │
│  API Login                                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │ apiuser                                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  API Password                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ••••••••                                          │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────────────────┐                                 │
│  │ 🔍 Test Connection │                                 │
│  └────────────────────┘                                 │
│                                                         │
│  ── Connection Result ──────────────────────────────── │
│                                                         │
│  ✅ Connected successfully!                             │
│  Server version: 7.8.2                                  │
│                                                         │
│  Select Store:                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ ● Main Restaurant Storage                        │  │
│  │ ○ Bar Storage                                    │  │
│  │ ○ Kitchen Cold Storage                           │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────┐  ┌─────────────────────────────┐     │
│  │ 💾 Save      │  │ 🔄 Sync Products Now        │     │
│  └──────────────┘  └─────────────────────────────┘     │
│                                                         │
│  ── Sync Settings ──────────────────────────────────── │
│  Auto-sync: [✓] Enabled                                │
│  Interval: [Daily ▼]                                    │
│                                                         │
│  ── Last Sync ──────────────────────────────────────── │
│  📅 2024-02-10 14:30   ✅ Success                      │
│  Products: 245 synced (12 new, 3 updated)              │
│  Categories: 18 synced                                  │
│                                                         │
│  [View Sync History]                                    │
└────────────────────────────────────────────────────────┘
```

### Connection Test Logic

#### Edge Function: `syrve-connect-test`

```
Input: {
  server_url: string,     // e.g., "http://192.168.1.100:8080"
  api_login: string,
  api_password: string    // Raw password (not stored; hashed in-flight)
}

Output: {
  success: boolean,
  server_version?: string,
  stores?: Array<{ id: string, name: string, type: string }>,
  error?: string
}

Process:
  1. Validate server_url format (must be http:// or https://)
  2. Construct base: server_url + "/resto/api"
  3. Hash password: SHA1(api_password)
  4. Attempt login:
     GET {base}/auth?login={api_login}&pass={sha1_hash}
     
  5. If login fails (non-200 or error response):
     Return { success: false, error: "Authentication failed. Check login/password." }
     
  6. If login succeeds → token received:
     a. Fetch stores:
        GET {base}/corporation/stores?key={token}
        Parse XML → extract store list
     b. Optionally fetch server info
     c. LOGOUT:
        GET {base}/logout?key={token}
     d. Return {
          success: true,
          stores: [{ id: "uuid1", name: "Main Storage" }, ...],
          server_version: "7.8.2"
        }

Error Handling:
  - Network timeout → "Cannot reach Syrve server. Check URL and network."
  - DNS failure → "Server not found. Verify the URL."
  - Auth failure → "Invalid login or password."
  - No stores found → "Connected but no stores configured in Syrve."
```

### Save Configuration Logic

```
After successful test + store selection:

1. Encrypt password using Supabase Vault:
   SELECT vault.create_secret(api_password, 'syrve_api_password');
   
   OR symmetric encryption:
   encrypted = AES256_encrypt(api_password, ENCRYPTION_KEY)

2. Upsert syrve_config:
   INSERT INTO syrve_config (
     server_url, api_login, api_password_encrypted,
     store_id, store_name,
     connection_status: 'connected',
     connection_tested_at: NOW(),
     created_by: auth.uid()
   )
   ON CONFLICT (id) DO UPDATE SET
     server_url = :server_url,
     api_login = :api_login,
     api_password_encrypted = :encrypted,
     store_id = :store_id,
     store_name = :store_name,
     connection_status = 'connected',
     connection_tested_at = NOW(),
     updated_at = NOW()

3. Frontend shows: "✅ Configuration saved. Ready to sync products."
```

---

## Product Sync (Syrve → App)

### Trigger

- Admin clicks "Sync Products Now" on Syrve settings page
- OR automatic cron (if auto_sync_enabled)

### Edge Function: `syrve-product-sync`

```
Input: { config_id?: string }  // Uses saved config
Output: {
  success: boolean,
  categories_synced: number,
  products_total: number,
  products_created: number,
  products_updated: number,
  products_deactivated: number,
  errors: string[]
}
```

### Sync Logic (Full Detail)

```
1. LOAD CONFIG:
   SELECT * FROM syrve_config WHERE connection_status = 'connected'
   If no config → error "Syrve not configured"
   
   Decrypt password from vault/encrypted field

2. AUTHENTICATE:
   GET {base}/auth?login={login}&pass={sha1(password)}
   → token

3. SYNC CATEGORIES:
   GET {base}/v2/entities/products/group/list?key={token}
   
   Response: array of product groups with:
   - id (UUID)
   - name (string)
   - parentGroup (UUID or null)
   - isDeleted (boolean)
   
   For each group where isDeleted = false:
     UPSERT INTO categories (
       syrve_group_id, name, syrve_parent_group_id, synced_at
     )
     ON CONFLICT (syrve_group_id) DO UPDATE SET
       name = :name, 
       syrve_parent_group_id = :parent_id,
       synced_at = NOW()
   
   For deleted groups:
     UPDATE categories SET is_active = false
     WHERE syrve_group_id = :deleted_group_id

4. SYNC PRODUCTS:
   GET {base}/v2/entities/products/list?includeDeleted=false&key={token}
   
   Response: array of products with:
   - id, name, num (SKU), code
   - productType (GOODS, DISH, etc.)
   - parentGroup (group UUID)
   - mainUnit (unit UUID)
   - unitCapacity, unitName, unitMeasure
   - defaultSalePrice
   - barcodes: [{ barcode: string }]
   - isDeleted
   - ... (50+ fields available)
   
   For each product:
     a. Resolve category_id:
        SELECT id FROM categories WHERE syrve_group_id = product.parentGroup
     
     b. UPSERT product:
        INSERT INTO products (
          syrve_product_id, name, sku: product.num,
          category_id, syrve_group_id: product.parentGroup,
          product_type: product.productType,
          unit_name: product.unitName,
          unit_capacity: product.unitCapacity,
          unit_measure: product.unitMeasure,
          barcode_primary: product.barcodes[0]?.barcode,
          purchase_price: product.costPrice,
          retail_price: product.defaultSalePrice,
          syrve_data: product,  -- Store FULL Syrve JSON!
          is_countable: product.productType IN ('GOODS', 'DISH'),
          synced_at: NOW()
        )
        ON CONFLICT (syrve_product_id) DO UPDATE SET
          name = :name, sku = :sku,
          category_id = :category_id,
          retail_price = :retail_price,
          syrve_data = :syrve_data,
          synced_at = NOW(),
          updated_at = NOW()
     
     c. Sync barcodes:
        FOR each barcode in product.barcodes:
          INSERT INTO product_barcodes (
            product_id, barcode, synced_from_syrve: true
          )
          ON CONFLICT (barcode) DO NOTHING
   
   Products in DB but NOT in Syrve response:
     UPDATE products SET is_active = false
     WHERE syrve_product_id NOT IN (:synced_ids)
       AND synced_at < NOW() - INTERVAL '1 hour'

5. UPDATE CONFIG:
   UPDATE syrve_config SET
     last_product_sync_at = NOW(),
     last_sync_products_count = :total,
     last_sync_categories_count = :cat_count

6. LOG SYNC:
   INSERT INTO syrve_sync_logs (
     operation: 'product_sync', status: 'success',
     products_created, products_updated, categories_synced,
     duration_ms
   )

7. LOGOUT (try/finally — ALWAYS)
```

### Why Store Full Syrve JSON (`syrve_data` column)

Different categories have very different attributes. Instead of creating separate columns for every possible field (impossible with arbitrary categories), the `syrve_data` JSONB column stores the complete Syrve product object:

```jsonb
-- Wine product syrve_data example:
{
  "id": "abc-123",
  "name": "Château Margaux 2018",
  "num": "W-001",
  "productType": "GOODS",
  "parentGroup": "wine-group-id",
  "unitCapacity": 0.75,
  "unitName": "бут",
  "unitMeasure": "л",
  "defaultSalePrice": 450.00,
  "barcodes": [{"barcode": "4607001234567"}],
  // Wine-specific data preserved:
  "customFields": {
    "vintage": "2018",
    "region": "Bordeaux",
    "grape": "Cabernet Sauvignon"
  }
}

-- Beer product syrve_data example:
{
  "id": "def-456",
  "name": "Guinness Draft 0.5l",
  "productType": "GOODS",
  "unitCapacity": 0.5,
  "unitName": "бут",
  "barcodes": [{"barcode": "5000123456789"}],
  "customFields": {
    "style": "Stout",
    "abv": "4.2%"
  }
}
```

Admin and UI can render category-specific fields by reading from `syrve_data`.

---

## Inventory Commit (App → Syrve)

### Trigger

Admin reviews completed session → clicks "Send to Syrve"

### Edge Function: `syrve-inventory-commit`

```
Input: { session_id: string }
Output: {
  success: boolean,
  syrve_document_number: string,
  items_sent: number,
  validation: { valid: boolean, errorMessage?: string }
}

Process:
  1. Load session (must be status = 'completed')
  2. Load aggregated items:
     SELECT product_id, SUM(counted_quantity) AS total,
            p.syrve_product_id
     FROM inventory_items ii
     JOIN products p ON p.id = ii.product_id
     WHERE ii.session_id = :session_id
       AND p.syrve_product_id IS NOT NULL
     GROUP BY product_id, p.syrve_product_id
  
  3. Load Syrve config → decrypt password → authenticate
  
  4. Build XML inventory document:
     <document>
       <documentNumber>INV-{session-short}-{timestamp}</documentNumber>
       <dateIncoming>{completed_at}</dateIncoming>
       <status>PROCESSED</status>
       <storeId>{config.store_id}</storeId>
       <comment>Inventory App - Session {session_number}</comment>
       <items>
         <item>
           <productId>{syrve_product_id}</productId>
           <amountContainer>{total_counted}</amountContainer>
         </item>
         ...
       </items>
     </document>
  
  5. POST /documents/import/incomingInventory?key={token}
  
  6. Parse response → update session syrve_sync_status
  
  7. Logout (try/finally)
```

---

## Syrve API Reference

### Endpoints Used

| Operation | Method | Endpoint | Used In |
|-----------|--------|----------|---------|
| **Login** | GET | `/resto/api/auth?login={l}&pass={h}` | All operations |
| **Logout** | GET | `/resto/api/logout?key={t}` | All operations |
| **List Stores** | GET | `/resto/api/corporation/stores?key={t}` | Connection test |
| **List Product Groups** | GET | `/resto/api/v2/entities/products/group/list?key={t}` | Category sync |
| **List Products** | GET | `/resto/api/v2/entities/products/list?key={t}` | Product sync |
| **Submit Inventory** | POST | `/resto/api/documents/import/incomingInventory` | Inventory commit |

### Authentication Pattern

```typescript
async function withSyrveAuth<T>(fn: (token: string, baseUrl: string) => Promise<T>): Promise<T> {
  // 1. Load config from DB
  const config = await loadSyrveConfig();
  const password = await decryptPassword(config.api_password_encrypted);
  const baseUrl = config.server_url + '/resto/api';
  
  // 2. Hash password
  const hash = SHA1(password);
  
  // 3. Login
  const tokenRes = await fetch(`${baseUrl}/auth?login=${config.api_login}&pass=${hash}`);
  const token = await tokenRes.text();
  
  try {
    // 4. Execute operation
    return await fn(token, baseUrl);
  } finally {
    // 5. ALWAYS logout
    await fetch(`${baseUrl}/logout?key=${token}`);
  }
}
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| **Network unreachable** | "Cannot connect to Syrve server. Check network and URL." |
| **Invalid credentials** | "Authentication failed. Check login and password." |
| **License occupied** | Retry after 30s, max 3 attempts. "All API licenses in use." |
| **Invalid store ID** | "Store not found. Re-test connection to refresh stores." |
| **Product sync partial fail** | Continue syncing remaining; log failures; report count |
| **Inventory doc rejected** | Show Syrve error message to admin; allow retry |
| **Server timeout** | Retry once; if still failing, mark sync as failed |

---

## Security

1. **Password encrypted at rest** — never stored as plaintext in DB
2. **Password never sent to frontend** — only Edge Functions access it
3. **SHA1 hashing happens server-side** — in Edge Function
4. **RLS on syrve_config** — only admin role can read/write
5. **API token lifecycle** — acquired → used → immediately released
6. **All sync operations logged** — full audit trail in syrve_sync_logs
7. **Connection test uses separate endpoint** — no data mutation during test
