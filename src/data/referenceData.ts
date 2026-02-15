// ====================== ROLES & PERMISSIONS ======================

export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

export type ModuleKey =
  | 'dashboard'
  | 'catalog'
  | 'stock'
  | 'count'
  | 'history'
  | 'sessions'
  | 'reports'
  | 'settings'
  | 'users';

export interface SubAction {
  key: string;
  label: string;
}

export interface ModuleConfig {
  key: ModuleKey;
  label: string;
  subActions: SubAction[];
}

export const ALL_MODULES: ModuleConfig[] = [
  { key: 'dashboard', label: 'Dashboard', subActions: [
    { key: 'view_analytics', label: 'View Analytics' },
    { key: 'view_stock_alerts', label: 'View Stock Alerts' },
    { key: 'export_reports', label: 'Export Reports' },
  ]},
  { key: 'catalog', label: 'Product Catalog', subActions: [
    { key: 'view_products', label: 'View Products' },
    { key: 'edit_products', label: 'Edit Products' },
    { key: 'delete_products', label: 'Delete Products' },
    { key: 'edit_pricing', label: 'Edit Pricing' },
    { key: 'manage_categories', label: 'Manage Categories' },
  ]},
  { key: 'stock', label: 'Inventory (Current Stock)', subActions: [
    { key: 'view_stock_levels', label: 'View Stock Levels' },
    { key: 'adjust_stock', label: 'Adjust Stock' },
    { key: 'view_cost_value', label: 'View Cost / Value' },
  ]},
  { key: 'count', label: 'Inventory Count', subActions: [
    { key: 'start_session', label: 'Start Count Session' },
    { key: 'perform_count', label: 'Perform Count' },
    { key: 'edit_quantities', label: 'Edit Counted Quantities' },
    { key: 'submit_count', label: 'Submit Count' },
  ]},
  { key: 'history', label: 'History & Audit', subActions: [
    { key: 'view_logs', label: 'View History Logs' },
    { key: 'export_history', label: 'Export History' },
  ]},
  { key: 'sessions', label: 'Session Review', subActions: [
    { key: 'view_sessions', label: 'View Sessions' },
    { key: 'approve_reject', label: 'Approve / Reject Sessions' },
    { key: 'reopen_sessions', label: 'Reopen Sessions' },
    { key: 'delete_sessions', label: 'Delete Sessions' },
  ]},
  { key: 'reports', label: 'Reports', subActions: [
    { key: 'view_reports', label: 'View Reports' },
    { key: 'export_reports', label: 'Export Reports' },
    { key: 'view_financials', label: 'View Financial Data' },
  ]},
  { key: 'settings', label: 'Settings', subActions: [
    { key: 'view_settings', label: 'View Settings' },
    { key: 'edit_general', label: 'Edit General Settings' },
    { key: 'edit_syrve', label: 'Edit Syrve Integration' },
  ]},
  { key: 'users', label: 'User Management', subActions: [
    { key: 'view_users', label: 'View Users' },
    { key: 'create_edit_users', label: 'Create / Edit Users' },
    { key: 'delete_users', label: 'Delete Users' },
    { key: 'assign_roles', label: 'Assign Roles' },
  ]},
];

export const ALL_PERMISSION_LEVELS: { value: PermissionLevel; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'view', label: 'View' },
  { value: 'edit', label: 'Edit' },
  { value: 'full', label: 'Full' },
];

export type PermissionKey = `${ModuleKey}.${string}`;

export interface AppRole {
  id: string;
  name: string;
  color: string;
  isBuiltin: boolean;
  permissions: Record<string, PermissionLevel>;
}

export function permKey(module: ModuleKey, action: string): string {
  return `${module}.${action}`;
}

export function getAllPermissionKeys(): string[] {
  return ALL_MODULES.flatMap(m => m.subActions.map(a => permKey(m.key, a.key)));
}

export function buildPermissions(level: PermissionLevel): Record<string, PermissionLevel> {
  const perms: Record<string, PermissionLevel> = {};
  ALL_MODULES.forEach(m => m.subActions.forEach(a => { perms[permKey(m.key, a.key)] = level; }));
  return perms;
}

const fullPermissions = buildPermissions('full');

const staffPermissions: Record<string, PermissionLevel> = {
  ...buildPermissions('none'),
  'dashboard.view_analytics': 'view',
  'dashboard.view_stock_alerts': 'view',
  'catalog.view_products': 'view',
  'count.start_session': 'edit',
  'count.perform_count': 'edit',
  'count.edit_quantities': 'edit',
  'count.submit_count': 'edit',
  'history.view_logs': 'view',
};

export const defaultRoles: AppRole[] = [
  { id: 'role_admin', name: 'Admin', color: 'hsl(0, 72%, 51%)', isBuiltin: true, permissions: fullPermissions },
  { id: 'role_staff', name: 'Staff', color: 'hsl(210, 40%, 50%)', isBuiltin: true, permissions: staffPermissions },
];
