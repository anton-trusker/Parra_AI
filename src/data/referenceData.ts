// ====================== REFERENCE DATA (configurable via Admin General Settings) ======================

export interface GlassDimension {
  id: string;
  label: string;
  volumeLitres: number; // e.g. 0.125, 0.250
}

export interface SubLocation {
  id: string;
  name: string;
}

export interface LocationConfig {
  id: string;
  name: string;
  type: string;
  subLocations: SubLocation[];
}

export interface VolumeOption {
  id: string;
  ml: number;
  label: string; // e.g. "0.375L", "0.75L", "1.5L"
  bottleSize: string; // "Half", "Standard", "Magnum"
}

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
  key: string; // e.g. 'view_analytics'
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
  { key: 'catalog', label: 'Wine Catalog', subActions: [
    { key: 'view_wines', label: 'View Wines' },
    { key: 'add_edit_wines', label: 'Add / Edit Wines' },
    { key: 'delete_wines', label: 'Delete Wines' },
    { key: 'edit_pricing', label: 'Edit Pricing' },
    { key: 'manage_categories', label: 'Manage Categories' },
  ]},
  { key: 'stock', label: 'Inventory (Current Stock)', subActions: [
    { key: 'view_stock_levels', label: 'View Stock Levels' },
    { key: 'adjust_stock', label: 'Adjust Stock' },
    { key: 'transfer_locations', label: 'Transfer Between Locations' },
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
    { key: 'manage_locations', label: 'Manage Locations' },
    { key: 'manage_volumes', label: 'Manage Volumes & Glasses' },
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

// Permission key is "module.subAction" e.g. "catalog.add_edit_wines"
export type PermissionKey = `${ModuleKey}.${string}`;

export interface AppRole {
  id: string;
  name: string;
  color: string;
  isBuiltin: boolean;
  permissions: Record<string, PermissionLevel>; // keys are PermissionKey strings
}

// Helper to build a full permission key
export function permKey(module: ModuleKey, action: string): string {
  return `${module}.${action}`;
}

// Helper to get all permission keys
export function getAllPermissionKeys(): string[] {
  return ALL_MODULES.flatMap(m => m.subActions.map(a => permKey(m.key, a.key)));
}

// Build a permissions record with a default level for all sub-actions
export function buildPermissions(level: PermissionLevel): Record<string, PermissionLevel> {
  const perms: Record<string, PermissionLevel> = {};
  ALL_MODULES.forEach(m => m.subActions.forEach(a => { perms[permKey(m.key, a.key)] = level; }));
  return perms;
}

// Countries with their regions, sub-regions, and appellations
export interface WineRegionData {
  country: string;
  regions: {
    name: string;
    subRegions: string[];
    appellations: string[];
  }[];
}

// ====================== DEFAULT DATA ======================

export const defaultGlassDimensions: GlassDimension[] = [
  { id: 'g1', label: '0.100L', volumeLitres: 0.1 },
  { id: 'g2', label: '0.125L', volumeLitres: 0.125 },
  { id: 'g3', label: '0.150L', volumeLitres: 0.15 },
  { id: 'g4', label: '0.175L', volumeLitres: 0.175 },
  { id: 'g5', label: '0.200L', volumeLitres: 0.2 },
  { id: 'g6', label: '0.250L', volumeLitres: 0.25 },
];

export const defaultLocations: LocationConfig[] = [
  { id: 'loc1', name: 'Cellar A', type: 'cellar', subLocations: [
    { id: 'sub1', name: 'Rack 1' },
    { id: 'sub2', name: 'Rack 2' },
    { id: 'sub3', name: 'Shelf 1' },
  ]},
  { id: 'loc2', name: 'Cellar B', type: 'cellar', subLocations: [
    { id: 'sub4', name: 'Rack 1' },
    { id: 'sub5', name: 'Shelf 1' },
  ]},
  { id: 'loc3', name: 'Bar', type: 'bar', subLocations: [] },
  { id: 'loc4', name: 'Bar Fridge', type: 'bar', subLocations: [
    { id: 'sub6', name: 'Shelf 1' },
    { id: 'sub7', name: 'Shelf 2' },
    { id: 'sub8', name: 'Shelf 3' },
  ]},
  { id: 'loc5', name: 'Storage Room', type: 'storage', subLocations: [] },
];

export const defaultVolumes: VolumeOption[] = [
  { id: 'v1', ml: 187, label: '0.187L', bottleSize: 'Split' },
  { id: 'v2', ml: 375, label: '0.375L', bottleSize: 'Half' },
  { id: 'v3', ml: 500, label: '0.500L', bottleSize: 'Half Litre' },
  { id: 'v4', ml: 750, label: '0.750L', bottleSize: 'Standard' },
  { id: 'v5', ml: 1000, label: '1.000L', bottleSize: 'Litre' },
  { id: 'v6', ml: 1500, label: '1.500L', bottleSize: 'Magnum' },
  { id: 'v7', ml: 3000, label: '3.000L', bottleSize: 'Jeroboam' },
  { id: 'v8', ml: 5000, label: '5.000L', bottleSize: 'Rehoboam' },
];

const fullPermissions = buildPermissions('full');

const staffPermissions: Record<string, PermissionLevel> = {
  ...buildPermissions('none'),
  // Dashboard: view only
  'dashboard.view_analytics': 'view',
  'dashboard.view_stock_alerts': 'view',
  // Catalog: view only
  'catalog.view_wines': 'view',
  // Count: edit level
  'count.start_session': 'edit',
  'count.perform_count': 'edit',
  'count.edit_quantities': 'edit',
  'count.submit_count': 'edit',
  // History: view
  'history.view_logs': 'view',
};

export const defaultRoles: AppRole[] = [
  { id: 'role_admin', name: 'Admin', color: 'hsl(0, 72%, 51%)', isBuiltin: true, permissions: fullPermissions },
  { id: 'role_staff', name: 'Staff', color: 'hsl(210, 40%, 50%)', isBuiltin: true, permissions: staffPermissions },
];

export const defaultWineRegions: WineRegionData[] = [
  {
    country: 'France',
    regions: [
      { name: 'Bordeaux', subRegions: ['Margaux', 'Pauillac', 'Saint-Julien', 'Saint-Émilion', 'Pomerol', 'Pessac-Léognan', 'Sauternes', 'Médoc', 'Haut-Médoc', 'Graves'], appellations: ['AOC Margaux', 'AOC Pauillac', 'AOC Saint-Julien', 'AOC Saint-Émilion Grand Cru', 'AOC Pomerol', 'AOC Pessac-Léognan', 'AOC Sauternes', 'AOC Médoc', 'AOC Haut-Médoc', 'AOC Graves'] },
      { name: 'Burgundy', subRegions: ['Chablis', 'Côte de Nuits', 'Côte de Beaune', 'Côte Chalonnaise', 'Mâconnais', 'Beaujolais'], appellations: ['AOC Chablis', 'AOC Chablis Grand Cru', 'AOC Gevrey-Chambertin', 'AOC Nuits-Saint-Georges', 'AOC Meursault', 'AOC Puligny-Montrachet', 'AOC Pommard', 'AOC Beaune'] },
      { name: 'Champagne', subRegions: ['Montagne de Reims', 'Côte des Blancs', 'Vallée de la Marne', 'Côte des Bar'], appellations: ['AOC Champagne', 'AOC Champagne Grand Cru', 'AOC Champagne Premier Cru'] },
      { name: 'Rhône Valley', subRegions: ['Northern Rhône', 'Southern Rhône'], appellations: ['AOC Châteauneuf-du-Pape', 'AOC Hermitage', 'AOC Côte-Rôtie', 'AOC Gigondas', 'AOC Côtes du Rhône'] },
      { name: 'Loire Valley', subRegions: ['Sancerre', 'Vouvray', 'Muscadet', 'Chinon', 'Anjou'], appellations: ['AOC Sancerre', 'AOC Vouvray', 'AOC Muscadet', 'AOC Chinon', 'AOC Pouilly-Fumé'] },
      { name: 'Alsace', subRegions: ['Haut-Rhin', 'Bas-Rhin'], appellations: ['AOC Alsace', 'AOC Alsace Grand Cru', 'AOC Crémant d\'Alsace'] },
      { name: 'Provence', subRegions: ['Côtes de Provence', 'Bandol', 'Cassis'], appellations: ['AOC Côtes de Provence', 'AOC Bandol', 'AOC Cassis'] },
      { name: 'Languedoc-Roussillon', subRegions: ['Corbières', 'Minervois', 'Fitou'], appellations: ['AOC Corbières', 'AOC Minervois', 'AOC Fitou', 'AOC Languedoc'] },
    ],
  },
  {
    country: 'Italy',
    regions: [
      { name: 'Piedmont', subRegions: ['Barolo', 'Barbaresco', 'Langhe', 'Asti', 'Roero'], appellations: ['DOCG Barolo', 'DOCG Barbaresco', 'DOCG Asti', 'DOC Langhe', 'DOCG Roero'] },
      { name: 'Tuscany', subRegions: ['Chianti', 'Montalcino', 'Bolgheri', 'Montepulciano', 'Maremma'], appellations: ['DOCG Chianti Classico', 'DOCG Brunello di Montalcino', 'DOC Bolgheri', 'DOC Bolgheri Sassicaia', 'DOCG Vino Nobile di Montepulciano'] },
      { name: 'Veneto', subRegions: ['Valpolicella', 'Soave', 'Prosecco', 'Bardolino'], appellations: ['DOCG Amarone della Valpolicella', 'DOCG Prosecco Superiore', 'DOC Soave', 'DOC Valpolicella'] },
      { name: 'Sicily', subRegions: ['Etna', 'Marsala', 'Vittoria'], appellations: ['DOC Etna', 'DOC Marsala', 'DOCG Cerasuolo di Vittoria'] },
      { name: 'Friuli-Venezia Giulia', subRegions: ['Collio', 'Colli Orientali'], appellations: ['DOC Collio', 'DOC Friuli Colli Orientali'] },
    ],
  },
  {
    country: 'Spain',
    regions: [
      { name: 'Rioja', subRegions: ['Rioja Alta', 'Rioja Alavesa', 'Rioja Baja'], appellations: ['DOCa Rioja', 'DOCa Rioja Gran Reserva'] },
      { name: 'Ribera del Duero', subRegions: [], appellations: ['DO Ribera del Duero'] },
      { name: 'Priorat', subRegions: [], appellations: ['DOCa Priorat'] },
      { name: 'Rías Baixas', subRegions: ['Val do Salnés', 'Condado do Tea'], appellations: ['DO Rías Baixas'] },
      { name: 'Jerez', subRegions: [], appellations: ['DO Jerez-Xérès-Sherry', 'DO Manzanilla-Sanlúcar de Barrameda'] },
      { name: 'Penedès', subRegions: [], appellations: ['DO Penedès', 'DO Cava'] },
    ],
  },
  {
    country: 'USA',
    regions: [
      { name: 'Napa Valley', subRegions: ['Oakville', 'Rutherford', 'Stags Leap', 'Howell Mountain', 'Calistoga', 'St. Helena'], appellations: ['Napa Valley AVA', 'Oakville AVA', 'Rutherford AVA', 'Stags Leap District AVA'] },
      { name: 'Sonoma County', subRegions: ['Russian River Valley', 'Dry Creek Valley', 'Alexander Valley', 'Sonoma Coast'], appellations: ['Sonoma County AVA', 'Russian River Valley AVA', 'Dry Creek Valley AVA'] },
      { name: 'Oregon', subRegions: ['Willamette Valley', 'Dundee Hills'], appellations: ['Willamette Valley AVA', 'Dundee Hills AVA'] },
      { name: 'Washington State', subRegions: ['Columbia Valley', 'Walla Walla Valley', 'Red Mountain'], appellations: ['Columbia Valley AVA', 'Walla Walla Valley AVA'] },
    ],
  },
  {
    country: 'Australia',
    regions: [
      { name: 'Barossa Valley', subRegions: ['Eden Valley'], appellations: ['Barossa Valley GI', 'Eden Valley GI'] },
      { name: 'McLaren Vale', subRegions: [], appellations: ['McLaren Vale GI'] },
      { name: 'Margaret River', subRegions: [], appellations: ['Margaret River GI'] },
      { name: 'Hunter Valley', subRegions: [], appellations: ['Hunter Valley GI'] },
      { name: 'Yarra Valley', subRegions: [], appellations: ['Yarra Valley GI'] },
    ],
  },
  {
    country: 'New Zealand',
    regions: [
      { name: 'Marlborough', subRegions: ['Wairau Valley', 'Awatere Valley'], appellations: ['Marlborough GI'] },
      { name: 'Central Otago', subRegions: ['Bannockburn', 'Gibbston'], appellations: ['Central Otago GI'] },
      { name: 'Hawke\'s Bay', subRegions: ['Gimblett Gravels'], appellations: ['Hawke\'s Bay GI'] },
    ],
  },
  {
    country: 'Germany',
    regions: [
      { name: 'Mosel', subRegions: ['Bernkastel', 'Piesport', 'Trittenheim'], appellations: ['Mosel QbA', 'Mosel Kabinett', 'Mosel Spätlese'] },
      { name: 'Rheingau', subRegions: ['Rüdesheim', 'Johannisberg'], appellations: ['Rheingau QbA'] },
      { name: 'Pfalz', subRegions: [], appellations: ['Pfalz QbA'] },
      { name: 'Baden', subRegions: ['Kaiserstuhl'], appellations: ['Baden QbA'] },
    ],
  },
  {
    country: 'Portugal',
    regions: [
      { name: 'Douro Valley', subRegions: ['Cima Corgo', 'Baixo Corgo'], appellations: ['DOC Douro', 'DOC Porto'] },
      { name: 'Alentejo', subRegions: [], appellations: ['DOC Alentejo'] },
      { name: 'Dão', subRegions: [], appellations: ['DOC Dão'] },
      { name: 'Vinho Verde', subRegions: [], appellations: ['DOC Vinho Verde'] },
    ],
  },
  {
    country: 'Argentina',
    regions: [
      { name: 'Mendoza', subRegions: ['Luján de Cuyo', 'Uco Valley', 'Maipú'], appellations: ['Mendoza IG', 'Luján de Cuyo DOC'] },
      { name: 'Salta', subRegions: ['Cafayate'], appellations: ['Salta IG'] },
    ],
  },
  {
    country: 'Chile',
    regions: [
      { name: 'Maipo Valley', subRegions: ['Alto Maipo'], appellations: ['Valle del Maipo DO'] },
      { name: 'Colchagua Valley', subRegions: [], appellations: ['Valle de Colchagua DO'] },
      { name: 'Casablanca Valley', subRegions: [], appellations: ['Valle de Casablanca DO'] },
    ],
  },
  {
    country: 'South Africa',
    regions: [
      { name: 'Stellenbosch', subRegions: ['Simonsberg', 'Helderberg'], appellations: ['Stellenbosch WO'] },
      { name: 'Swartland', subRegions: [], appellations: ['Swartland WO'] },
      { name: 'Constantia', subRegions: [], appellations: ['Constantia WO'] },
    ],
  },
  {
    country: 'Austria',
    regions: [
      { name: 'Wachau', subRegions: [], appellations: ['DAC Wachau'] },
      { name: 'Kamptal', subRegions: [], appellations: ['DAC Kamptal'] },
      { name: 'Burgenland', subRegions: ['Neusiedlersee'], appellations: ['DAC Neusiedlersee'] },
    ],
  },
  {
    country: 'Greece',
    regions: [
      { name: 'Santorini', subRegions: [], appellations: ['PDO Santorini'] },
      { name: 'Nemea', subRegions: [], appellations: ['PDO Nemea'] },
      { name: 'Naoussa', subRegions: [], appellations: ['PDO Naoussa'] },
    ],
  },
];

// Helper to get all unique countries
export function getCountries(): string[] {
  return defaultWineRegions.map(r => r.country);
}

// Helper to get regions for a given country
export function getRegionsForCountry(country: string): string[] {
  const c = defaultWineRegions.find(r => r.country === country);
  return c ? c.regions.map(r => r.name) : [];
}

// Helper to get sub-regions for a given country+region
export function getSubRegionsForRegion(country: string, region: string): string[] {
  const c = defaultWineRegions.find(r => r.country === country);
  if (!c) return [];
  const r = c.regions.find(rr => rr.name === region);
  return r ? r.subRegions : [];
}

// Helper to get appellations for a given country+region
export function getAppellationsForRegion(country: string, region: string): string[] {
  const c = defaultWineRegions.find(r => r.country === country);
  if (!c) return [];
  const r = c.regions.find(rr => rr.name === region);
  return r ? r.appellations : [];
}
