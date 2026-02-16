# 03 - Authentication & Security

## 1. Authentication Strategy

The platform supports two distinct authentication flows to cater to different user operations:

### A. Email Auth (Standard)
*   **Method**: Email & Password.
*   **Provider**: Supabase Auth (Native).
*   **Flow**: Standard PKCE flow.
*   **Use Case**: Dashboard access, configuration, report viewing (for those who prefer email).

### B. Username Auth (Simplified)
*   **Method**: Username & Password (no email required).
*   **Supported Roles**: **Staff** and **Managers**.
*   **Mechanism**: "Proxy Auth" via Edge Function.
*   **Flow**:
    1.  App sends `{ business_slug, username, password }` to `auth-login-username` Edge Function.
    2.  Edge Function validates credentials against a private `app_credentials` table (or similar).
    3.  Edge Function signs in as the corresponding Supabase User.
    4.  Edge Function returns the `access_token` and `refresh_token`.
*   **Benefit**: High security (RLS works normally) without forcing staff to have real emails.

## 2. Row Level Security (RLS)

Every query is sandboxed to the user's tenant.

### The "Tenant Check" Function
We use a helper function to avoid repetitive joins.

```sql
-- Helper to get current user's business_id
CREATE OR REPLACE FUNCTION auth.my_business_id()
RETURNS uuid AS $$
  SELECT business_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql STABLE;

-- Helper to check role
CREATE OR REPLACE FUNCTION auth.has_role(req_role text)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = req_role
  )
$$ LANGUAGE sql STABLE;
```

### Policy Examples

**1. Products (Read-Only for Staff, Write for Manager)**

```sql
-- Read: Staff and Managers can see their own business products
CREATE POLICY "View products" ON products FOR SELECT
USING (business_id = auth.my_business_id());

-- Write: Only Managers (Syrve sync is technically a service_role, but if mapped to a manager...)
-- Actually, Sync Jobs run as service_role. Managers might edit metadata.
CREATE POLICY "Edit products" ON products FOR UPDATE
USING (business_id = auth.my_business_id() AND auth.has_role('manager'));
```

**2. Inventory Sessions (Lifecycle Strictness)**

```sql
-- View: All roles
CREATE POLICY "View sessions" ON inventory_sessions FOR SELECT
USING (business_id = auth.my_business_id());

-- Manager: Create/Delete
CREATE POLICY "Manage sessions" ON inventory_sessions FOR ALL
USING (business_id = auth.my_business_id() AND auth.has_role('manager'));
```

**3. Count Events (Append-Only for Staff)**

```sql
-- Staff can INSERT into active sessions
CREATE POLICY "Staff count" ON inventory_count_events FOR INSERT
WITH CHECK (
  business_id = auth.my_business_id() AND
  EXISTS (
    SELECT 1 FROM inventory_sessions s
    WHERE s.id = session_id 
    AND s.status = 'in_progress'
    AND s.business_id = auth.my_business_id()
  )
);

-- Staff cannot UPDATE/DELETE their own counts (Audit integrity)
-- Managers might create "Correction" events instead of deleting.
```

## 3. Data Protection

*   **Syrve Password**: Stored in `syrve_config.api_password_encrypted`.
    *   **Encryption**: Use `pgsodium` `crypto_aead_det_encrypt` or Supabase Vault.
    *   **Access**: Only `postgres` (service_role) and specific Edge Functions can decrypt. No frontend access.
*   **PII**: User emails are in `auth.users`. `profiles` only has names/avatars.

## 4. API Security

*   All Edge Functions verify the `Authorization: Bearer <token>` header.
*   Functions that perform Syrve Writes (`inventory_submit`) must re-validate the session status before proceeding, even if the user had UI permission.
