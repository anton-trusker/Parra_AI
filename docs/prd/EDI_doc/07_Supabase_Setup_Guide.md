# 07 - Supabase Setup Guide (New Project)

Follow these steps to initialize a fresh Supabase environment for the Wine Inventory Platform.

## 1. Project Initialization
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Enable the following extensions in **Database > Extensions**:
   - `pgvector` (for future AI search improvements)
   - `uuid-ossp` (for UUID generation)
   - `vault` (for secret management)

## 2. Infrastructure Setup (Dashboard)

### 2.1 Storage Buckets
Create the following buckets with appropriate permissions:
- `product-images`: Publicly readable, authenticated write.
- `ai-scans`: Private, authenticated write.

### 2.2 Vault & Secrets
Store the following secrets in **Project Settings > API > Edge Function Secrets**:
- `SYRVE_ENCRYPTION_KEY`: A 32-character string for AES decryption.
- `OPENAI_API_KEY`: For embeddings and fallback vision.
- `GEMINI_API_KEY`: Main vision provider for `ai-scan`.

## 3. Database Schema (SQL Editor)

Run the SQL migrations in the following order:

1. **Core Schema**: `doc/new/db/phase-01-database-setup.md` (or the equivalent SQL).
2. **Inventory Logic**: `doc/new/db/20240101000008_create_inventory_tables.sql`.
3. **AI Layer**: `doc/new/db/20260212000001_create_ai_recognition_tables.sql`.
4. **Integration Layer**: Run the SQL for `integration_syrve_config` (refer to Layer 7 in `02_Database_Reference.md`).

## 4. Edge Function Deployment

Deploy the following functions using the Supabase CLI:

```bash
supabase functions deploy auth-login-username
supabase functions deploy syrve-product-sync
supabase functions deploy ai-scan
supabase functions deploy syrve-inventory-commit
# ... other functions in supabase/functions directory
```

## 5. Post-Setup Checklist
- [ ] Insert initial `ai_config` record with `is_active = true`.
- [ ] Configure `integration_syrve_config` with target ERP credentials.
- [ ] Verify `profiles` table has appropriate `role` assignments for initial users.
- [ ] Run `syrve-product-sync` to populate the catalog.
