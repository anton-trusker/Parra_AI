# 03 — Authentication \u0026 Authorization

**Complete Security Model for Wine Inventory Platform**

This document defines authentication flows, Row-Level Security (RLS) policies, role-based access control, and storage security.

---

## Table of Contents

1. [Auth Overview](#auth-overview)
2. [Dual Login Methods](#dual-login-methods)
3. [Role-Based Access Control](#role-based-access-control)
4. [RLS Policies](#rls-policies)
5. [Storage Security](#storage-security)
6. [Permission System](#permission-system)
7. [Security Best Practices](#security-best-practices)

---

## Auth Overview

### **Architecture**

```
User Login (Email or Username/Password)
        ↓
Supabase Auth (JWT)
        ↓
auth.users (id, email)
        ↓
profiles (user metadata, login_name)
        ↓
user_roles → roles (permissions JSONB)
        ↓
RLS Policies check auth.uid() + roles
        ↓
Access Granted/Denied
```

### **Key Features**

- **Dual Login**: Email/password OR username/password (synthetic email)
- **JWT Sessions**: Supabase Auth tokens with automatic refresh
- **Role Hierarchy**: Super Admin > Manager > Staff > Viewer
- **Row-Level Security**: Postgres RLS enforces data access
- **Manager-Only Data**: Baseline expected quantities hidden from staff
- **Auction Trail**: All sensitive actions logged in `audit_logs`

---

## Dual Login Methods

### **Method 1: Email + Password** (Standard)

Standard Supabase Auth flow.

**Frontend**:
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'manager@restaurant.com',
  password: 'secure-password'
});
```

**Database**:
- `auth.users.email` = actual email
- `profiles.email` = optional mirror
- `profiles.login_name` = optional (can be same as email prefix)

### **Method 2: Username + Password** (Synthetic Email)

For staff who don't want to expose personal emails.

**Pattern**: `{username}@inventory.local`

**Frontend**:
```typescript
const loginWithUsername = async (username: string, password: string) => {
  const syntheticEmail = `${username.toLowerCase()}@inventory.local`;
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password: password
  });
  
  return { data, error };
};
```

**User Creation (Edge Function)**:
```typescript
// POST /functions/v1/create-user
{
  "login_name": "staff1",
  "full_name": "John Doe",
  "password": "secure-password",
  "role_ids": ["staff-role-uuid"]
}

// Edge Function logic:
const syntheticEmail = `${login_name}@inventory.local`;

// Create auth user
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email: syntheticEmail,
  password: password,
  email_confirm: true  // Auto-confirm
});

// Create profile
await supabase.from('profiles').insert({
  id: authData.user.id,
  login_name: login_name,
  full_name: full_name,
  email: syntheticEmail
});

// Assign roles
await supabase.from('user_roles').insert(
  role_ids.map(role_id => ({
    user_id: authData.user.id,
    role_id: role_id
  }))
);
```

**Database Constraints**:
```sql
-- Ensure login_name uniqueness
CREATE UNIQUE INDEX idx_profiles_login_name ON profiles(login_name);

-- Ensure synthetic emails are valid
ALTER TABLE profiles ADD CONSTRAINT chk_login_name_format 
    CHECK (login_name ~ '^[a-z0-9_-]+$');
```

---

## Role-Based Access Control

### **Role Hierarchy**

| Role | Description | Default Permissions |
|------|-------------|---------------------|
| **Super Admin** | Platform owner | Full access (`{"*": "full"}`) |
| **Manager** | Restaurant admin | Configure, approve, manage users |
| **Staff** | Inventory counter | Count items, view products |
| **Viewer** | Read-only | View reports and data |

### **Roles Table Schema**

```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_super_admin BOOLEAN NOT NULL DEFAULT false
);
```

### **Permissions Structure**

Permissions stored as JSONB in format: `{"module.action": "level"}`

**Permission Levels**:
- `none` — No access
- `view` — Read-only
- `edit` — Create and update
- `full` — Create, read, update, delete

**Example**:
```json
{
  "catalog.view": "full",
  "catalog.edit": "full",
  "inventory.count": "full",
  "inventory.approve": "full",
  "users.manage": "view",
  "settings.configure": "none"
}
```

**Module/Action Keys** (from `referenceData.ts`):
```typescript
const MODULES = [
  {
    key: 'catalog',
    subActions: [
      { key: 'view', label: 'View Products' },
      { key: 'edit', label: 'Edit Products' },
      { key: 'delete', label: 'Delete Products' }
    ]
  },
  {
    key: 'inventory',
    subActions: [
      { key: 'count', label: 'Count Items' },
      { key: 'approve', label: 'Approve Sessions' },
      { key: 'view_expected', label: 'View Expected Quantities' }
    ]
  },
  // ... more modules
];

const permKey = (module: string, action: string) => `${module}.${action}`;
```

### **Permission Checking**

**Frontend (React)**:
```typescript
const usePermissions = () => {
  const user = useAuthStore(state => state.user);
  const userRoles = useAuthStore(state => state.roles);
  
  const hasPermission = (module: string, action: string, requiredLevel: PermissionLevel) => {
    if (!user || !userRoles) return false;
    
    // Super admins bypass all checks
    if (user Roles.some(r => r.is_super_admin)) return true;
    
    const key = `${module}.${action}`;
    
   // Check all user's roles
    for (const role of userRoles) {
      const permLevel = role.permissions[key];
      if (checkLevel(permLevel, requiredLevel)) {
        return true;
      }
    }
    
    return false;
  };
  
  return { hasPermission };
};

// Usage
const { hasPermission } = usePermissions();

if (hasPermission('inventory', 'approve', 'full')) {
  // Show approve button
}
```

**Backend (RLS Policy)**:
```sql
-- Helper function
CREATE OR REPLACE FUNCTION has_permission(
    module_name TEXT,
    action_name TEXT,
    required_level TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    user_perms JSONB;
    perm_value TEXT;
BEGIN
    -- Get aggregated permissions from all user's roles
    SELECT jsonb_object_agg(
        key,
        value
    ) INTO user_perms
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    CROSS JOIN LATERAL jsonb_each_text(r.permissions)
    WHERE ur.user_id = auth.uid();
    
    -- Check if super admin
    IF EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid() AND r.is_super_admin = true
    ) THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    perm_value := user_perms->>module_name || '.' || action_name;
    
    RETURN check_permission_level(perm_value, required_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## RLS Policies

### **Policy Patterns**

#### **1. Authenticated Access**

All authenticated users can read public data.

```sql
CREATE POLICY "Allow authenticated read" ON products
    FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);
```

#### **2. Role-Based Write**

Only managers can create/update.

```sql
CREATE POLICY "Managers can edit products" ON products
    FOR UPDATE
    USING (has_permission('catalog', 'edit', 'edit'));
```

#### **3. Manager-Only Data**

Baseline quantities hidden from staff.

```sql
CREATE POLICY "Only managers can view baseline" ON inventory_baseline_items
    FOR SELECT
    USING (has_permission('inventory', 'view_expected', 'view'));
```

#### **4. Own Data Only**

Users can only see their own counting events.

```sql
CREATE POLICY "Users can view own count events" ON inventory_count_events
    FOR SELECT
    USING (counted_by = auth.uid() OR has_permission('inventory', 'approve', 'view'));
```

#### **5. Append-Only**

Staff can insert but not update/delete counting events.

```sql
CREATE POLICY "Staff can insert count events" ON inventory_count_events
    FOR INSERT
    WITH CHECK (
        counted_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM inventory_sessions
            WHERE id = inventory_count_events.session_id
            AND status = 'in_progress'
        )
    );

-- No UPDATE or DELETE policies for staff
```

### **Complete RLS Policy Set**

#### **`profiles`**

```sql
-- Users can view all active profiles
CREATE POLICY "Users can view active profiles" ON profiles
    FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (id = auth.uid());

-- Managers can manage all profiles
CREATE POLICY "Managers can manage profiles" ON profiles
    FOR ALL
    USING (has_permission('users', 'manage', 'full'));
```

#### **`products`**

```sql
-- Everyone can view active products
CREATE POLICY "Authenticated users can view products" ON products
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Managers can edit products
CREATE POLICY "Catalog managers can edit products" ON products
    FOR INSERT OR UPDATE OR DELETE
    USING (has_permission('catalog', 'edit', 'edit'));
```

#### **`inventory_sessions`**

```sql
-- Users can view sessions they created or are active
CREATE POLICY "Users can view own sessions" ON inventory_sessions
    FOR SELECT
    USING (
        created_by = auth.uid() OR
        has_permission('inventory', 'approve', 'view')
    );

-- Managers can create sessions
CREATE POLICY "Managers can create sessions" ON inventory_sessions
    FOR INSERT
    WITH CHECK (has_permission('inventory', 'approve', 'edit'));

-- Managers can update sessions
CREATE POLICY "Managers can update sessions" ON inventory_sessions
    FOR UPDATE
    USING (has_permission('inventory', 'approve', 'edit'));
```

#### **`inventory_baseline_items`**

```sql
-- MANAGER-ONLY: Only those with view_expected permission can see baseline
CREATE POLICY "Only managers can view baseline" ON inventory_baseline_items
    FOR SELECT
    USING (has_permission('inventory', 'view_expected', 'view'));

-- Only Edge Functions can insert/update baseline
CREATE POLICY "Service role can manage baseline" ON inventory_baseline_items
    FOR ALL
    USING (auth.role() = 'service_role');
```

#### **`inventory_count_events`**

```sql
-- Users can view own events or if they have approval permission
CREATE POLICY "Users can view count events" ON inventory_count_events
    FOR SELECT
    USING (
        counted_by = auth.uid() OR
        has_permission('inventory', 'approve', 'view')
    );

-- Staff can append events during in_progress sessions
CREATE POLICY "Staff can insert count events" ON inventory_count_events
    FOR INSERT
    WITH CHECK (
        counted_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM inventory_sessions
            WHERE id = session_id AND status = 'in_progress'
        )
    );

-- NO UPDATE or DELETE policies (append-only for staff)
-- Managers use method='manager_adjustment' to insert corrections
```

#### **`inventory_product_aggregates`**

```sql
-- All users can view aggregates (no expected quantities here)
CREATE POLICY "Users can view aggregates" ON inventory_product_aggregates
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only triggers/functions update aggregates
CREATE POLICY "Service role can update aggregates" ON inventory_product_aggregates
    FOR ALL
    USING (auth.role() = 'service_role');
```

---

## Storage Security

### **Bucket Configuration**

All buckets are **private** with RLS policies.

| Bucket | Purpose | Access |
|--------|---------|--------|
| `product-labels` | Confirmed product label library | Authenticated users (signed URLs) |
| `inventory-evidence` | Per-session evidence photos | Session participants + managers |
| `ai-scans` | Temporary AI recognition uploads | Uploader + managers |
| `logos` | Business logos | Public |
| `avatars` | User profile pictures | Authenticated users |

### **Storage RLS Policies**

#### **Upload Policies**

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'ai-scans' AND
        (storage.foldername(name))[1] = auth.uid()::TEXT
    );

-- Users can upload session evidence
CREATE POLICY "Users can upload session evidence" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'inventory-evidence' AND
        EXISTS (
            SELECT 1 FROM inventory_sessions
            WHERE id::TEXT = (storage.foldername(name))[1]
            AND (created_by = auth.uid() OR status = 'in_progress')
        )
    );
```

#### **Download Policies**

```sql
-- Users can download product labels
CREATE POLICY "Authenticated users can view product labels" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'product-labels' AND auth.role() = 'authenticated');

-- Users can download session evidence if they have access to session
CREATE POLICY "Users can view session evidence" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'inventory-evidence' AND
        EXISTS (
            SELECT 1 FROM inventory_sessions
            WHERE id::TEXT = (storage.foldername(name))[1]
            AND (created_by = auth.uid() OR has_permission('inventory', 'approve', 'view'))
        )
    );
```

### **Signed URLs**

For temporary access to private files:

```typescript
const { data, error } = await supabase.storage
    .from('product-labels')
    .createSignedUrl('product-123/label.jpg', 3600); // 1 hour expiry

console.log(data.signedUrl);
```

---

## Permission System

### **Default Role Configuration**

```sql
-- Super Admin
INSERT INTO roles (name, permissions, is_super_admin, is_system_role) VALUES
('Super Admin', '{"*": "full"}', true, true);

-- Manager
INSERT INTO roles (name, permissions, is_system_role) VALUES
('Manager', '{
  "catalog.view": "full",
  "catalog.edit": "full",
  "inventory.count": "full",
  "inventory.approve": "full",
  "inventory.view_expected": "full",
  "users.manage": "edit",
  "settings.configure": "edit",
  "integrations.syrve": "full"
}', true);

-- Staff
INSERT INTO roles (name, permissions, is_system_role) VALUES
('Staff', '{
  "catalog.view": "view",
  "inventory.count": "edit",
  "inventory.view_expected": "none"
}', true);

-- Viewer
INSERT INTO roles (name, permissions, is_system_role) VALUES
('Viewer', '{
  "catalog.view": "view",
  "inventory.view_expected": "none"
}', true);
```

---

## Security Best Practices

### **1. Password Requirements**

```typescript
// Enforce in Edge Function user creation
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false
};
```

### **2. Session Management**

- JWT tokens auto-refresh before expiry
- Logout revokes refresh token
- Idle timeout: 24 hours (configurable)

### **3. Encryption**

```sql
-- Encrypt Syrve credentials
CREATE OR REPLACE FUNCTION encrypt_password(plain_password TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT := current_setting('app.encryption_key');
BEGIN
    RETURN encode(encrypt(plain_password::bytea, encryption_key::bytea, 'aes'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrypt (service role only)
CREATE OR REPLACE FUNCTION decrypt_password(encrypted_password TEXT)
RETURNS TEXT AS $$
DECLARE
    encryption_key TEXT := current_setting('app.encryption_key');
BEGIN
    RETURN convert_from(decrypt(decode(encrypted_password, 'base64'), encryption_key::bytea, 'aes'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **4. Audit Logging**

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES profiles(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Log sensitive actions
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
    VALUES (
        auth.uid(),
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to sensitive tables
CREATE TRIGGER audit_inventory_approval
    AFTER UPDATE ON inventory_sessions
    FOR EACH ROW
    WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
    EXECUTE FUNCTION log_audit();
```

### **5. Rate Limiting**

```typescript
// In Edge Functions
const RATE_LIMITS = {
  'auth-login': { maxRequests: 5, windowMs: 60000 }, // 5 per minute
  'ai-scan': { maxRequests: 20, windowMs: 60000 },   // 20 per minute
  'syrve-sync': { maxRequests: 1, windowMs: 300000 } // 1 per 5 minutes
};
```

---

## Next Steps

- Review [04-syrve-integration.md](04-syrve-integration.md) for Syrve API security
- Study [05-edge-functions.md](05-edge-functions.md) for function-level permissions
- Examine [08-deployment-guide.md](08-deployment-guide.md) for secrets management
