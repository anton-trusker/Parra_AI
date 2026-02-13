# 07 — Edge Functions Logic Specification

## 1. `syrve-auth`
Handles authentication with Syrve Server API.
- **Trigger**: Called by other edge functions or "Test Connection" button.
- **Inputs**: `business_id` (used to fetch encrypted credentials).
- **Logic**:
  1. Fetch `server_url`, `api_login`, and `api_password_encrypted` from `syrve_config`.
  2. Decrypt password using `SYRVE_ENCRYPTION_KEY` env var.
  3. Compute SHA1 hash of the password.
  4. Call `GET {server_url}/resto/api/auth?login={login}&pass={hash}`.
  5. If success, store session token in temporary cache (or return to caller).
  6. Return `success: true` and session token.

---

## 2. `syrve-sync-products`
Synchronizes categories and products from Syrve to Supabase.
- **Trigger**: Manual "Sync Now" or scheduled Cron.
- **Inputs**: `business_id`.
- **Logic**:
  1. Obtain Syrve session token via `syrve-auth`.
  2. **Fetch Groups**: `GET {server_url}/resto/api/entities/products/group/list?key={token}`.
     - Upsert into `categories` table (map `syrve_group_id`).
  3. **Fetch Products**: `GET {server_url}/resto/api/entities/products/list?key={token}`.
     - Filter for countable items (e.g., `product_type IN ('GOODS', 'DISH')`).
     - Upsert into `products` table (map `syrve_product_id`, `sku`, `name`, `unit_name`, etc.).
     - Store full original JSON in `syrve_data` column.
  4. **Fetch Barcodes**: If separate API, sync into `product_barcodes`.
  5. Update `last_sync_at` in `syrve_config`.

---

## 3. `ai-recognize-product`
Uses Google Gemini to identify products from images.
- **Trigger**: Camera scan (no barcode match or manual trigger).
- **Inputs**: `image_base64`, `business_id`.
- **Logic**:
  1. Fetch `ai_api_key` for the business (fallback to system `GEMINI_API_KEY`).
  2. Construct prompt for Gemini 1.5 Pro:
     *"Analyze this product image. Identify the product name, SKU (if visible), and category. If it is wine, provide vintage, producer, and region. Return structured JSON."*
  3. Call Gemini API with image and prompt.
  4. Parse JSON response.
  5. Query local `products` table for matches based on Name or SKU.
  6. Return top 3 candidates with confidence scores.

---

## 4. `syrve-inventory-commit`
Aggregates and submits completed inventory sessions to Syrve.
- **Trigger**: "Approve & Sync" button on Session Review page.
- **Inputs**: `session_id`, `business_id`.
- **Logic**:
  1. Validate session status is `approved` or `pending_review`.
  2. **Aggregation**:
     - Query all `inventory_items` for the `session_id`.
     - Group by `product_id`.
     - Sum `quantity` (handling opened bottles via unit conversions).
  3. **XML/JSON Construction**:
     - Format data as required by Syrve `/resto/api/documents/import/incomingInventory`.
     - Include `store_id`, `date`, and line items with `syrve_product_id` and `amount`.
  4. **Submission**:
     - Obtain Syrve token.
     - POST document to Syrve API.
  5. **Completion**:
     - Update `inventory_sessions.syrve_document_id` with response from Syrve.
     - Set session status to `synced`.
     - Log success/failure in `audit_logs`.

---

## 5. `ai-label-extraction`
Advanced extraction for Product Passport enrichment.
- **Trigger**: "Auto-fill with AI" button on Product Detail page.
- **Inputs**: `image_url`, `business_id`.
- **Logic**:
  1. Fetch image from Supabase Storage.
  2. Prompt Gemini: *"Extract all possible information from this product label: Alcohol %, Volume, Producer, Region, Country, Grapes (if wine), Description."*
  3. Update `products.metadata` and `products.description` with results.
