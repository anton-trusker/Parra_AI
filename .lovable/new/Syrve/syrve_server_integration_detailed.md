# Syrve (iiko) Integration - Detailed Implementation Guide (Server API)

## 1. Overview
This document details the technical implementation of the integration between our Wine Inventory System and **Syrve Server API** (Local Installation).

**Target Environment:**
*   **Base URL**: `https://parra.syrve.online:443/resto/api`
*   **API Protocol**: REST over HTTP/HTTPS
*   **Data Format**: XML (Strict)
*   **Authentication**: SHA1 Hash + Token

## 2. Database Schema Extensions

To support this integration, we need specific tables for configuration, mapping, and logging.

### 2.1 Configuration
**Table**: `integration_syrve_config`
Stores authentication credentials and global settings for the Server API.
```sql
CREATE TABLE integration_syrve_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_url TEXT NOT NULL DEFAULT 'https://parra.syrve.online:443/resto/api',
    api_login TEXT NOT NULL,
    api_password_hash TEXT, -- SHA1 hash of the password, stored for convenience logic
    default_store_id TEXT, -- Fallback store ID
    sync_interval_minutes INTEGER DEFAULT 60,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Product Cache & Mapping
**Table**: `integration_syrve_products`
Caches the Syrve nomenclature.
```sql
CREATE TABLE integration_syrve_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    syrve_product_id TEXT NOT NULL UNIQUE, -- 'id' from Syrve <item>
    parent_group_id TEXT,
    name TEXT NOT NULL,
    product_code TEXT, -- 'code' field, often used as SKU
    measure_unit TEXT,
    price NUMERIC,
    product_type TEXT, -- 'GOODS', 'DISH', etc.
    is_deleted BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_syrve_products_code ON integration_syrve_products(product_code);
CREATE INDEX idx_syrve_products_name ON integration_syrve_products(name);
```

### 2.3 Store/Location Mapping
**Table**: `integration_syrve_stores`
Maps local `locations` to Syrve `stores`.
```sql
CREATE TABLE integration_syrve_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID REFERENCES locations(id),
    syrve_store_id TEXT NOT NULL, -- UUID from Syrve
    syrve_store_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(location_id)
);
```

### 2.4 Sync History
**Table**: `integration_syrve_sync_log`
Audit trail of API interactions.
```sql
CREATE TABLE integration_syrve_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- 'AUTH', 'CATALOG_SYNC', 'INVENTORY_CHECK', 'INVENTORY_COMMIT'
    status TEXT NOT NULL, -- 'SUCCESS', 'ERROR'
    request_payload TEXT, -- Storing XML can be large, consider truncating
    response_payload TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.5 Security & Credential Storage (Best Practice)
To avoid storing plain-text passwords, you should store ONLY the **SHA1 Hash** of the API password.

**SQL Setup Example:**
```sql
-- Calculate SHA1 hash locally first:
-- Linux/Mac: echo -n "your_password" | openssl sha1
-- Node.js: crypto.createHash('sha1').update('your_password').digest('hex')

INSERT INTO integration_syrve_config (api_login, api_password_hash)
VALUES ('admin', '5baa61e4c9b93f3f0682250b6cf8331b7ee68fd8');
-- Note: Do NOT store the plain text password.
```

## 3. Authentication Flow (Server API)

The Server API uses a specific SHA1-based login flow that consumes a license seat.

1.  **Prepare Credentials**:
    *   Get `login` and `password` from config.
    *   Compute SHA1 hash of `password` (if not already stored).
    *   Command: `echo -n "password" | openssl sha1`

2.  **Login Request**:
    *   **GET** `/auth?login={login}&pass={sha1_hash}`
    *   **Response**: A plain text UUID string (The Token). e.g., `b354d18c-3d3a-e1a6-c3b9-9ef7b5055318`

3.  **Usage**:
    *   Append `?key={token}` to **ALL** subsequent API URL requests.
    *   *Note*: Do not use Bearer header.

4.  **Logout (CRITICAL)**:
    *   **GET** `/logout?key={token}`
    *   **Trigger**: Must be called immediately after a sync job finishes to release the license.
    *   **Reason**: Server API licenses are strictly concurrent. Front-of-house terminals may fail if licenses are hogged.

## 4. Workflows

### 4.1. Catalog Sync
**Goal**: Update `integration_syrve_products`.

1.  **Login** (See Section 3).
2.  **Fetch**: `GET /products?key={token}&includeDeleted=false`
    *   **Response**: XML `<productDto><items><item>...</item></items></productDto>`
3.  **Process**:
    *   Parse XML.
    *   Upsert into `integration_syrve_products`.
4.  **Logout**.

### 4.2. Inventory Check (Variance Analysis)
**Goal**: Compare physical count against Syrve system stock.

1.  **Trigger**: User initiates sync for a completed `Inventory Session`.
2.  **Login**.
3.  **Construct XML Payload**:
    *   Root: `<document>`
    *   `documentNumber`: `INV-{session_id}`
    *   `dateIncoming`: ISO8601 Date
    *   `storeId`: Mapped Syrve Store ID
    *   `items` loop:
        *   `<item>`
        *   `<productId>`: Mapped Syrve Product ID
        *   `<amountContainer>`: **Counted Quantity**
        *   `<amountUnit>`: Main unit ID
4.  **Send Validation Request**:
    *   **POST** `/documents/check/incomingInventory?key={token}`
    *   **Header**: `Content-Type: application/xml`
    *   **Body**: The constructed XML.
5.  **Parse Response**:
    *   Root: `<incomingInventoryValidationResult>`
    *   Iterate `<items><item>...`:
        *   `actualAmount`: Our count.
        *   `expectedAmount`: Syrve's theoretical system stock.
        *   `differenceAmount`: Variance (`Actual - Expected`).
6.  **Store Variance**: Save these values to `inventory_items` or a specific sync result table for user review.
7.  **Logout**.

### 4.3. Inventory Commit (Finalize)
**Goal**: Update Syrve stock to match physical count.

1.  **Trigger**: User confirms "Push to Syrve".
2.  **Login**.
3.  **Reuse XML Payload** from Step 4.2.
4.  **Send Import Request**:
    *   **POST** `/documents/import/incomingInventory?key={token}`
    *   **Body**: Same XML.
5.  **Verify Success**:
    *   Check for strict success response. XML often returns `<valid>true</valid>`.
6.  **Logout**.

## 5. Implementation Notes & Best Practices

*   **Concurrency**:
    *   Implement a **Singleton Queue** for all Syrve interactions.
    *   Never run parallel jobs if license count is limited (usually 1 for integrations).
*   **XML Parsing**:
    *   Use a robust XML parser (e.g., `fast-xml-parser` or `xml2js`).
    *   The API is case-sensitive and order-sensitive in some XML versions.
*   **Error Handling**:
    *   If Login fails with "License limit exceeded", wait 30s and retry (Linear Backoff).
    *   Always ensure `finally { logout() }` block in code.

## 6. Next Implementation Steps
1.  Run SQL migration for new tables.
2.  Create `SyrveServerClient` class.
3.  Implement `auth` queue system.
