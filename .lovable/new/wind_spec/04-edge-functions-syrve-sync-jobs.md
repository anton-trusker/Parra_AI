# Edge Functions — Syrve Sync, Inventory Export, AI

This document defines the Edge Function surface for a new Supabase project.

## Naming alignment (repo vs docs)
The repository and documentation currently reference multiple naming styles.

Use the **kebab-case** names below as the authoritative deployed Supabase Edge Function names, and treat the others as aliases.

| Canonical function name | Aliases found in docs/code |
|---|---|
| `syrve-connect-test` | `syrve_test_connection`, `syrve-connect-test` |
| `syrve-save-config` | `syrve_save_config` |
| `syrve-bootstrap-sync` | `syrve_bootstrap_sync` |
| `syrve-sync-products` | `syrve_sync_products`, `syrve-product-sync`, `syrve-product-sync` |
| `inventory-create-session` | `inventory_create_session` |
| `inventory-load-baseline` | `inventory_start_session`, `inventory_load_baseline` |
| `inventory-submit-to-syrve` | `inventory_submit_to_syrve`, `inventory-submit`, `inventory-submit-to-syrve` |
| `ai-label-recognition` | `recognize_label`, `recognize-label`, `ai-recognize-product` |
| `compute-label-hash` | `compute_label_hash` |
| `admin-reindex-products` | `reindex_products` |
| `syrve-process-outbox` | `process_outbox`, `syrve-process-outbox` |

## Function conventions
- All functions validate:
  - authentication
  - role-based permissions (manager-only where appropriate)
- Syrve pattern is always:
  - login → execute → logout (try/finally)
- Secrets:
  - Syrve credentials stored encrypted in `syrve_config.api_password_encrypted`
  - AI provider keys stored as Supabase secrets or in `app_settings.settings`

---

# 1) Authentication

## 1.1 `auth-login-username`
Purpose: allow username/password login (no real email shown).

Request:
```json
{ "username": "manager1", "password": "..." }
```

Process:
- Convert to synthetic email: `username@inventory.local`
- Call Supabase Auth `signInWithPassword` (server-side)

Response:
- Supabase session tokens + user info.

Note:
- If you keep current frontend approach, this function is optional; client can sign in directly.

---

# 2) Syrve integration

## 2.1 `syrve-connect-test`
Purpose: validate Syrve credentials without saving.

Request:
```json
{ "server_url": "http://ip:8080", "login": "apiuser", "password": "plaintext" }
```

Response:
```json
{ "success": true, "server_version": "7.8.2", "stores": [{"id":"uuid","name":"Main"}] }
```

Key rules:
- Append `/resto/api` inside function.
- Hash password with SHA1 for Syrve auth.
- Always logout.

## 2.2 `syrve-save-config`
Purpose: encrypt and store connection.

Request:
```json
{ "server_url": "...", "login": "...", "password": "...", "default_store_id": "uuid" }
```

Process:
- Encrypt password (Supabase Vault or AES key)
- Upsert `syrve_config` (singleton row)

## 2.3 `syrve-bootstrap-sync`
Purpose: first-time sync pack.

Process:
- Create `syrve_sync_runs` row (run_type=`bootstrap`)
- Fetch and persist:
  - `/corporation/departments`
  - `/corporation/stores`
  - `/corporation/groups` (optional)
  - `/v2/entities/products/group/list`
  - `/v2/entities/products/list`
- Write all payloads into `syrve_raw_objects`
- Upsert canonical tables:
  - `org_nodes`, `stores`, `categories`, `products`, `product_barcodes`

## 2.4 `syrve-sync-products`
Purpose: incremental products sync.

- Similar to bootstrap but only catalog endpoints.

---

# 3) Inventory session orchestration

## 3.1 `inventory-create-session`
Purpose: create session record.

Request:
```json
{ "store_id": "uuid", "title": "Inventory Feb 13", "scope": {"category_ids": ["..."]} }
```

Response:
```json
{ "session_id": "uuid" }
```

## 3.2 `inventory-load-baseline`
Purpose: pull baseline from Syrve at session start.

Request:
```json
{ "session_id": "uuid" }
```

Process:
- Validate session status draft
- Call Syrve stock endpoint (stock-and-sales) for selected store
- Insert `inventory_baseline_items`
- Set session `baseline_taken_at`, status `in_progress`

## 3.3 `inventory-submit-to-syrve`
Purpose: submit approved session.

Request:
```json
{ "session_id": "uuid" }
```

Process:
- Validate session status = approved
- Aggregate totals from `inventory_count_events` (or aggregates table)
- Build XML
- Insert outbox job (`syrve_outbox_jobs`) with payload_hash
- Return job id

Response:
```json
{ "success": true, "outbox_job_id": "uuid" }
```

---

# 4) Outbox processing (reliability)

## 4.1 `syrve-process-outbox`
Purpose: process pending outbox jobs.

Run modes:
- manual trigger (manager clicks retry)
- scheduled cron (recommended)

Process:
- Fetch next `pending` job (FOR UPDATE SKIP LOCKED)
- Mark `processing`
- Execute Syrve operation:
  - optional check
  - import inventory document
- Update job `status`, store `response_xml`, errors
- Update session `syrve_document_id`, `syrve_synced_at`, status=`synced` on success

Idempotency:
- unique `(job_type, payload_hash)` prevents double send

---

# 5) AI recognition

## 5.1 `ai-label-recognition` (or `ai-scan`)
Purpose: recognize label from stored image.

Request:
```json
{ "session_id": "uuid", "image_path": "ai-scans/...jpg" }
```

Process (recommended pipeline):
- Create `media_assets` for image
- Create `ai_runs`
- OCR text (Google Vision)
- candidate retrieval (pgvector similarity search via `product_search_index`)
- Vision verification (Gemini 1.5 Flash)
- Return list + confidence

Response:
```json
{ "run_id": "uuid", "candidates": [{"product_id":"uuid","confidence":0.98}], "ocr_text": "..." }
```

Note: This function may also be called `ai-scan` in some documentation. Both names refer to the same functionality.

## 5.2 `compute-label-hash`
Purpose: compute perceptual hash for cheap re-matching.

---

# 6) Missing implementation note (current repo)
The repo currently calls `supabase.functions.invoke('syrve-connect-test')`, but `supabase/functions/` is empty.

For a new Supabase project, you must create the Edge Functions under:
- `supabase/functions/<function-name>/index.ts`

and deploy them with Supabase CLI.
