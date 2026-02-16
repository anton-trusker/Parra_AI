# Supabase Auth + RLS + Permissions

## Goals
- Support login using:
  - **Email + password** (standard Supabase)
  - **Login name + password** (no email shown to users)
- Enforce role-based access control
- Enforce role visibility rules:
  - Staff cannot see manager-only baseline expected stock
  - Super admin has full platform access

---

# 1) Auth model

## 1.1 Two supported login modes

### Mode A — Email login
- User's `auth.users.email` is a real email
- `profiles.email` mirrors it (optional)

### Mode B — Login name + password ("passport" style)
Supabase Auth requires an email for `signInWithPassword`. We implement login-name auth via **synthetic email**:

- Synthetic email format:
  - `lower(login_name) || '@inventory.local'`

Store:
- `profiles.login_name` = user-facing credential

This is already how the current frontend works:
- `authStore.login()` converts `loginName` to `loginName@inventory.local`

### Recommendation
Use a consistent synthetic email format to ensure uniqueness.

---

# 2) Required DB helpers

## 2.1 Role checks
Two options:

### Option 1 (recommended): `roles` + `user_roles`
- Roles are in `public.roles`
- Assignment in `public.user_roles`
- Add helpers:
  - `has_role(role_name text)`
  - `has_any_role(role_names text[])`

### Option 2: embed role_id on profile
Current code reads `profile.role_id` in `authStore.ts`. If you keep this pattern:
- Add `profiles.role_id uuid references roles(id)`
- Treat `user_roles` as the future model.

---

# 3) RLS: baseline patterns

## 3.1 Authenticated access
All tables are accessible to authenticated users. RLS policies enforce:
- `SELECT`: allow if authenticated
- `INSERT`: allow if has appropriate role
- `UPDATE`: allow if has appropriate role
- `DELETE`: restrict to managers/super_admin only

## 3.2 Protecting expected stock (manager-only)
`inventory_baseline_items`:
- `SELECT` only if user has role in: `manager`, `admin`, `super_admin`
- `INSERT/UPDATE/DELETE` only for manager/admin (usually done by Edge Functions)

`inventory_product_aggregates`:
- Staff may `SELECT` aggregates (no expected values included)

## 3.3 Counting events (append-only)
`inventory_count_events`:
- Staff can `INSERT` if:
  - session.status = `in_progress`
- Staff can `SELECT` events they created or for active sessions
- Optional: prevent `UPDATE/DELETE` for staff entirely (append-only)

Manager adjustments:
- Manager inserts `method='manager_adjustment'` events.

---

# 4) Storage security
Buckets are private.

## 4.1 Bucket policies
- Only authenticated users can upload to their role-appropriate path:
  - `profiles/<user_id>/<resource>/<file>`
  - `inventory-evidence/<session_id>/<file>`
  - `ai-scans/<session_id>/<file>`

## 4.2 Serving files
- Use signed URLs generated server-side (Edge Function) or client-side with Supabase if allowed.

---

# 5) Role model (recommended set)
- `super_admin` (platform owner; full access to all data and settings)
- `manager` (restaurant admin; can configure app, connect to Syrve, manage staff, approve inventory)
- `staff` (counting; can count inventory, cannot see expected baseline)
- Optional:
  - `viewer` (read-only access)

Permissions storage:
- Store permission map in `roles.permissions` as JSON:
  - keys like `catalog.view`, `inventory.approve`, `settings.manage`

The current frontend uses a module/subaction permission key system (`referenceData.ts`). Keep the same keys inside `roles.permissions`.

