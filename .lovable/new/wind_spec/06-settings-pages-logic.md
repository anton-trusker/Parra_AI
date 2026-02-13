# Settings Page Logic — Complete Specification

This document specifies all settings pages, their fields, logic, and database mappings for the Inventory AI platform.

---

## Settings Pages Overview

| Page | Path | Access | Purpose |
|------|------|--------|---------|
| Syrve Integration | `/settings/syrve` | Manager, Super Admin | Connect to Syrve Server API |
| Business Identity | `/settings/business` | Manager, Super Admin | Business name, logo, localization |
| User Management | `/settings/users` | Manager, Super Admin | Create/edit users, assign roles |
| Role Management | `/settings/roles` | Manager, Super Admin | Create/edit roles, permissions |
| Glass & Serving | `/settings/serving` | Manager, Super Admin | Glass sizes, serving rules, category mapping |
| AI Configuration | `/settings/ai` | Manager, Super Admin | AI providers, API keys, model settings |
| Inventory Settings | `/settings/inventory` | Manager, Super Admin | Inventory defaults, approval workflow |
| System Logs | `/settings/logs` | Manager, Super Admin | Audit logs, error logs, sync logs |

---

## 1) Syrve Integration Settings (`/settings/syrve`)

### Fields
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Server URL | text input | `syrve_config.server_url` | Required, URL format | Syrve Server API endpoint |
| API Login | text input | `syrve_config.api_login` | Required | Syrve API user login |
| API Password | password | `syrve_config.api_password_encrypted` | Required, encrypted storage | Stored encrypted via Vault |
| Connection Status | read-only badge | `syrve_config.connection_status` | Auto-updated | `disconnected`, `connected`, `error` |
| Default Store | dropdown | `syrve_config.default_store_id` | Optional | Populated after successful connection test |
| Default Department | dropdown | `syrve_config.default_department_id` | Optional | Syrve department selection |
| Selected Categories | multi-select | `syrve_config.selected_category_ids` | Optional | Categories to sync from Syrve |
| Last Sync | read-only timestamp | `syrve_config.last_sync_at` | Auto-updated | Last successful sync time |

### Actions
| Action | Button | Edge Function | Description |
|--------|--------|---------------|-------------|
| Test Connection | "Test Connection" | `syrve-connect-test` | Validates Syrve credentials without saving |
| Save Config | "Save Configuration" | `syrve-save-config` | Encrypts and stores connection settings |
| Full Sync | "Sync All Data" | `syrve-bootstrap-sync` | First-time or full refresh sync |
| Incremental Sync | "Sync Products" | `syrve-sync-products` | Incremental catalog sync |

### Logic Flow
1. Manager enters Server URL, Login, Password
2. Clicks "Test Connection" → calls `syrve-connect-test`
3. On success: dropdowns populate with stores/departments from Syrve
4. Manager selects Default Store, optionally Default Department and Categories
5. Clicks "Save Configuration" → encrypts password, stores in `syrve_config`
6. Clicks "Sync All Data" → triggers `syrve-bootstrap-sync`

---

## 2) Business Identity Settings (`/settings/business`)

### Fields
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Business Name | text input | `business_profile.name` | Required | Display name in UI |
| Legal Name | text input | `business_profile.legal_name` | Optional | Legal entity name |
| Logo | image upload | `business_profile.logo_url` | Optional, image file | Supabase Storage bucket `logos` |
| Country | dropdown | `business_profile.country` | Optional | Affects tax/legal formats |
| City | text input | `business_profile.city` | Optional | |
| Address | textarea | `business_profile.address` | Optional | |
| Currency | dropdown | `business_profile.currency` | Required | Default: EUR |
| Language | dropdown | `business_profile.language` | Required | Default: en |
| Timezone | dropdown | `business_profile.timezone` | Required | Default: Europe/Lisbon |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Save Changes | "Save" | Updates `business_profile` singleton row |
| Upload Logo | "Upload Logo" | Uploads to Storage, updates `logo_url` |
| Remove Logo | "Remove" | Clears `logo_url`, deletes from Storage |

### Logic Flow
1. Load single row from `business_profile` (singleton table)
2. Display form with current values
3. On save: update the singleton row
4. Logo upload: generate signed URL, upload to `logos` bucket, store path in `logo_url`

---

## 3) User Management (`/settings/users`)

### Fields (User List)
| Column | Source | Notes |
|--------|--------|-------|
| Full Name | `profiles.full_name` | |
| Login Name | `profiles.login_name` | Unique identifier for login |
| Email | `profiles.email` | Optional, may be synthetic |
| Roles | `user_roles` + `roles` | Comma-separated role names |
| Status | `profiles.is_active` | Active / Inactive badge |
| Actions | | Edit, Deactivate buttons |

### Fields (Create/Edit User Modal)
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Full Name | text input | `profiles.full_name` | Optional | Display name |
| Login Name | text input | `profiles.login_name` | Required, unique | Used for login |
| Email | text input | `profiles.email` | Optional | Real email or synthetic |
| Password | password | `auth.users` (via Edge Function) | Required on create | Sent to `auth-signup` or `create-user` Edge Function |
| Roles | multi-select | `user_roles.role_id` | Required at least one | Links to `roles` table |
| Is Active | toggle | `profiles.is_active` | Default: true | Can deactivate without deleting |

### Actions
| Action | Button | Edge Function | Description |
|--------|--------|---------------|-------------|
| Create User | "Add User" | `create-user` | Creates auth user + profile + role assignment |
| Edit User | "Edit" | | Updates profile and role assignments |
| Deactivate | "Deactivate" | | Sets `is_active = false` |
| Reset Password | "Reset Password" | | Triggers password reset flow |

### Logic Flow
1. Load users from `profiles` joined with `user_roles` and `roles`
2. Display in table with filters (Active/Inactive, by Role)
3. Create: open modal, validate login_name uniqueness, call `create-user` Edge Function
4. Edit: update `profiles`, sync `user_roles` (delete old, insert new assignments)
5. Deactivate: set `profiles.is_active = false` (does not delete auth user)

---

## 4) Role Management (`/settings/roles`)

### Fields (Role List)
| Column | Source | Notes |
|--------|--------|-------|
| Role Name | `roles.name` | System roles marked with badge |
| Color | `roles.color` | Visual indicator |
| Permissions | `roles.permissions` | Summary count of permissions |
| System Role | `roles.is_system_role` | Cannot delete system roles |
| Actions | | Edit, Delete buttons |

### Fields (Create/Edit Role Modal)
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Role Name | text input | `roles.name` | Required, unique | e.g., "manager", "staff" |
| Color | color picker | `roles.color` | Optional | Hex color code |
| Is System Role | read-only | `roles.is_system_role` | Auto-set | Only for default roles |
| Is Super Admin | toggle | `roles.is_super_admin` | Default: false | Grants full access |

### Permission Matrix
Permissions stored in `roles.permissions` as JSON object:

```json
{
  "catalog.view": true,
  "catalog.edit": false,
  "inventory.count": true,
  "inventory.approve": false,
  "inventory.export": false,
  "settings.view": true,
  "settings.manage": false,
  "users.view": true,
  "users.manage": false,
  "roles.view": false,
  "roles.manage": false,
  "reports.view": true,
  "logs.view": false
}
```

### UI Permission Categories
| Category | Permissions | Description |
|----------|-------------|-------------|
| Catalog | view, edit | View products, edit enrichment |
| Inventory | count, approve, export | Count items, approve sessions, export to Syrve |
| Settings | view, manage | View settings, modify configuration |
| Users | view, manage | View users, create/edit/deactivate |
| Roles | view, manage | View roles, create/edit permissions |
| Reports | view | Access reports and analytics |
| Logs | view | View audit and error logs |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Create Role | "Add Role" | Opens modal with permission matrix |
| Edit Role | "Edit" | Modify name, color, permissions |
| Delete Role | "Delete" | Only if no users assigned and not system role |
| Clone Role | "Clone" | Copy permissions from existing role |

### Logic Flow
1. Load roles from `roles` table
2. Display with permission summary (e.g., "8 permissions enabled")
3. Create/Edit: show permission matrix with checkboxes for each key
4. Save: serialize permissions to JSON, store in `roles.permissions`
5. System roles (`super_admin`, `manager`, `staff`) cannot be deleted

---

## 5) Glass & Serving Settings (`/settings/serving`)

### Glass Dimensions Section
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Glass Name | text input | `glass_dimensions.name` | Required, unique | e.g., "Standard Pour" |
| Capacity (ml) | number input | `glass_dimensions.capacity_ml` | Required, > 0 | e.g., 150 |
| Is Active | toggle | `glass_dimensions.is_active` | Default: true | Can deactivate unused |

### Bottle Sizes Section
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Size Name | text input | `bottle_sizes.name` | Required, unique | e.g., "Standard Bottle" |
| Volume (ml) | number input | `bottle_sizes.ml` | Required, > 0 | e.g., 750 |
| Is Active | toggle | `bottle_sizes.is_active` | Default: true | Can deactivate unused |

### Product Serving Rules Section
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Product | dropdown | `product_serving_rules.product_id` | Optional if category set | Specific product override |
| Category | dropdown | `product_serving_rules.category_id` | Optional if product set | Category default |
| Sold by Glass | toggle | `product_serving_rules.sold_by_glass` | Default: false | Enables glass selection |
| Glass Size | dropdown | `product_serving_rules.glass_dimension_id` | Required if sold_by_glass | Links to glass_dimensions |
| Bottle Size (ml) | number | `product_serving_rules.bottle_size_ml` | Optional | Override bottle size |
| Priority | number | `product_serving_rules.priority` | Default: 100 | Lower = higher priority |
| Is Active | toggle | `product_serving_rules.is_active` | Default: true | |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Add Glass | "Add Glass Size" | Creates new `glass_dimensions` row |
| Edit Glass | "Edit" | Modify glass size |
| Delete Glass | "Delete" | Only if not used in serving rules |
| Add Bottle Size | "Add Bottle Size" | Creates new `bottle_sizes` row |
| Add Serving Rule | "Add Rule" | Creates `product_serving_rules` row |
| Edit Rule | "Edit" | Modify serving rule |
| Delete Rule | "Delete" | Remove rule |

---

## 6) AI Configuration (`/settings/ai`)

### Fields
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| AI Recognition Enabled | toggle | `app_settings.ai_recognition_enabled` | Default: true | Master switch |
| OCR Provider | dropdown | `ai_config.ocr_provider` | Options: google_vision | Text extraction from images |
| Vision Provider | dropdown | `ai_config.vision_provider` | Options: gemini, openai | Label verification |
| Embedding Provider | dropdown | `ai_config.embedding_provider` | Options: openai | Product matching |
| Use System Key | toggle | `ai_config.use_system_key` | Default: true | Use platform-provided API key |
| Custom API Key | password | `ai_config.custom_api_key_encrypted` | Optional | User's own API key (encrypted) |
| Model Config | JSON editor | `ai_config.model_config` | Optional | Advanced model parameters |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Save Settings | "Save" | Updates `ai_config` singleton |
| Test OCR | "Test OCR" | Upload test image, run OCR |
| Reindex Products | "Reindex All" | Calls `admin-reindex-products` Edge Function |
| View AI Logs | "View Logs" | Navigate to AI run history |

### Logic Flow
1. Load `ai_config` singleton row
2. Toggle "Use System Key" shows/hides Custom API Key field
3. Save: encrypt custom key if provided, update row
4. Reindex: triggers embedding regeneration for all products

---

## 7) Inventory Settings (`/settings/inventory`)

### Fields
| Field | Type | Database Table.Column | Validation | Notes |
|-------|------|----------------------|------------|-------|
| Requires Approval | toggle | `app_settings.inventory_requires_approval` | Default: true | Manager must approve before export |
| Default Store | dropdown | `app_settings.default_store_id` | Optional | Pre-selected in new sessions |
| Default Bottle Size | dropdown | `app_settings.default_bottle_size_ml` | Optional | From `bottle_sizes` |
| Default Glass | dropdown | `app_settings.default_glass_id` | Optional | From `glass_dimensions` |
| Par Level Alert | toggle | Feature flag | | Warn when stock below par_level |
| Auto-Calculate Variances | toggle | Feature flag | | Auto-flag discrepancies |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Save Settings | "Save" | Updates `app_settings` singleton |
| View Inventory Reports | "Reports" | Navigate to inventory analytics |
| Manage Stock Alerts | "Stock Alerts" | Configure par level notifications |

---

## 8) System Logs (`/settings/logs`)

### Log Types (Tabs)
| Tab | Table | Columns | Access |
|-----|-------|---------|--------|
| Audit Log | `audit_logs` | Time, User, Action, Entity, Details | Manager, Super Admin |
| Error Log | `error_logs` | Time, Severity, Source, Message, Context | Manager, Super Admin |
| Syrve API | `syrve_api_logs` | Time, Action, Status, Request, Response | Manager, Super Admin |
| Sync History | `syrve_sync_runs` | Time, Type, Status, Stats, Error | Manager, Super Admin |
| AI Runs | `ai_runs` | Time, Type, Status, Model, Duration, Confidence | Manager, Super Admin |

### Filters (per tab)
| Filter | Field | Type |
|--------|-------|------|
| Date Range | `created_at` | Date picker range |
| User | `actor_user_id` | Dropdown of users |
| Action | `action` | Multi-select (audit only) |
| Status | `status` | Multi-select (sync, AI, API) |
| Severity | `severity` | Multi-select (errors only) |

### Actions
| Action | Button | Description |
|--------|--------|-------------|
| Export CSV | "Export" | Download filtered results |
| Refresh | "Refresh" | Reload latest entries |
| Clear Filters | "Clear" | Reset all filters |

### Logic Flow
1. Load paginated data from respective log table
2. Default sort: `created_at` desc (newest first)
3. Apply filters server-side for performance
4. Export: generate CSV with current filters

---

## Database Tables Summary

| Table | Purpose | Singleton |
|-------|---------|-----------|
| `business_profile` | Business identity, branding | Yes (1 row) |
| `app_settings` | Inventory defaults, feature flags | Yes (1 row) |
| `syrve_config` | Syrve API connection | Yes (1 row) |
| `ai_config` | AI providers, API keys | Yes (1 row) |
| `profiles` | User accounts | No (many rows) |
| `roles` | Role definitions | No (many rows) |
| `user_roles` | User-role assignments | No (many rows) |
| `glass_dimensions` | Glass sizes | No (many rows) |
| `bottle_sizes` | Bottle sizes | No (many rows) |
| `product_serving_rules` | Per-product/category serving | No (many rows) |
| `audit_logs` | Activity log | No (append-only) |
| `error_logs` | Error tracking | No (append-only) |
| `syrve_api_logs` | API call history | No (append-only) |
| `syrve_sync_runs` | Sync job status | No (append-only) |
| `ai_runs` | AI job status | No (append-only) |

---

## Edge Functions for Settings

| Function | Used In | Purpose |
|----------|---------|---------|
| `syrve-connect-test` | Syrve Settings | Validate Syrve credentials |
| `syrve-save-config` | Syrve Settings | Store encrypted config |
| `create-user` | User Management | Create auth user + profile |
| `admin-reindex-products` | AI Settings | Regenerate all embeddings |
| `update-role` | Role Management | Update role permissions |

---

## RLS Policies for Settings

| Table | Policy | Roles | Access |
|-------|--------|-------|--------|
| `business_profile` | select | All authenticated | Read |
| `business_profile` | update | manager, super_admin | Modify |
| `app_settings` | select | All authenticated | Read |
| `app_settings` | update | manager, super_admin | Modify |
| `syrve_config` | select | manager, super_admin | Read |
| `syrve_config` | update | manager, super_admin | Modify |
| `ai_config` | select | manager, super_admin | Read |
| `ai_config` | update | manager, super_admin | Modify |
| `profiles` | select | All authenticated | Read own + team |
| `profiles` | insert | manager, super_admin | Create users |
| `profiles` | update | manager, super_admin | Edit users |
| `roles` | select | All authenticated | Read |
| `roles` | insert/update/delete | manager, super_admin | Modify |
| `user_roles` | all | manager, super_admin | Full access |
| `glass_dimensions` | all | manager, super_admin | Full access |
| `bottle_sizes` | all | manager, super_admin | Full access |
| `product_serving_rules` | all | manager, super_admin | Full access |
| `audit_logs` | select | manager, super_admin | Read |
| `error_logs` | select | manager, super_admin | Read |
| `syrve_api_logs` | select | manager, super_admin | Read |
| `syrve_sync_runs` | select | manager, super_admin | Read |
| `ai_runs` | select | manager, super_admin | Read |
