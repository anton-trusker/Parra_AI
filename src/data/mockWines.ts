export interface Wine {
  id: string;
  name: string;
  fullName?: string;
  producer: string;
  estate?: string;
  vintage: number | null;
  isNonVintage?: boolean;
  type: 'Red' | 'White' | 'Rosé' | 'Sparkling' | 'Fortified' | 'Dessert';
  region: string;
  subRegion?: string;
  appellation?: string;
  country: string;
  volume: number;
  volumeLabel?: string;
  bottleSize?: string;
  abv: number;
  closureType?: string;
  bottleColor?: string;
  // Pricing
  price: number;
  purchasePrice?: number;
  salePrice?: number;
  glassPrice?: number;
  availableByGlass?: boolean;
  currency?: string;
  // Stock
  sku: string;
  barcode?: string;
  barcodeType?: string;
  grapeVarieties: string[];
  stockUnopened: number;
  stockOpened: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  // Location
  location: string;
  cellarSection?: string;
  rackNumber?: string;
  shelfPosition?: string;
  // Supplier
  supplierName?: string;
  // Tasting & characteristics
  tastingNotes?: string;
  body?: string;
  sweetness?: string;
  acidity?: string;
  tannins?: string;
  foodPairing?: string;
  // Media
  hasImage: boolean;
  imageUrl?: string;
  // Status
  isActive: boolean;
  isDiscontinued?: boolean;
  isArchived?: boolean;
  // Audit
  createdAt?: string;
  updatedAt?: string;
}

export const mockWines: Wine[] = [
  { id: '1', name: 'Château Margaux', fullName: 'Château Margaux Premier Grand Cru Classé 2015', producer: 'Château Margaux', estate: 'Château Margaux', vintage: 2015, type: 'Red', region: 'Bordeaux', subRegion: 'Margaux', appellation: 'AOC Margaux', country: 'France', volume: 750, volumeLabel: 'Standard', bottleSize: 'Standard', abv: 13.5, closureType: 'cork', bottleColor: 'dark_green', price: 450, purchasePrice: 320, salePrice: 450, glassPrice: 65, availableByGlass: true, sku: 'CM-2015-750', barcode: '3760004131201', barcodeType: 'EAN-13', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 10, stockOpened: 2, minStockLevel: 6, maxStockLevel: 24, reorderPoint: 8, reorderQuantity: 6, stockStatus: 'in_stock', location: 'Cellar A - Rack 3', cellarSection: 'Cellar A', rackNumber: '3', shelfPosition: 'A', supplierName: 'Fine Wine Imports', tastingNotes: 'Elegant tannins with blackcurrant and cedar notes', body: 'full', sweetness: 'dry', acidity: 'medium', tannins: 'firm', foodPairing: 'Beef, Lamb, Hard Cheese', hasImage: true, isActive: true, createdAt: '2025-08-15T10:00:00', updatedAt: '2026-02-09T14:00:00' },
  { id: '2', name: 'Barolo Riserva', fullName: 'Barolo Riserva DOCG 2018', producer: 'Giuseppe Rinaldi', vintage: 2018, type: 'Red', region: 'Piedmont', subRegion: 'Barolo', appellation: 'DOCG Barolo', country: 'Italy', volume: 750, volumeLabel: 'Standard', abv: 14.5, closureType: 'cork', price: 89, purchasePrice: 58, salePrice: 89, sku: 'BR-2018-750', barcode: '8000174001050', barcodeType: 'EAN-13', grapeVarieties: ['Nebbiolo'], stockUnopened: 2, stockOpened: 0, minStockLevel: 6, reorderPoint: 4, stockStatus: 'low_stock', location: 'Cellar A - Rack 5', cellarSection: 'Cellar A', rackNumber: '5', supplierName: 'Italian Estates', tastingNotes: 'Rose petals, tar, and dark cherry with firm tannins', body: 'full', sweetness: 'dry', acidity: 'high', tannins: 'grippy', foodPairing: 'Truffle pasta, Braised meats', hasImage: true, isActive: true, createdAt: '2025-09-01T10:00:00', updatedAt: '2026-02-09T14:38:00' },
  { id: '3', name: 'Sassicaia', fullName: 'Sassicaia Bolgheri DOC 2019', producer: 'Tenuta San Guido', vintage: 2019, type: 'Red', region: 'Tuscany', subRegion: 'Bolgheri', appellation: 'DOC Bolgheri Sassicaia', country: 'Italy', volume: 750, abv: 14, closureType: 'cork', price: 220, purchasePrice: 160, salePrice: 220, sku: 'SS-2019-750', grapeVarieties: ['Cabernet Sauvignon', 'Cabernet Franc'], stockUnopened: 0, stockOpened: 0, minStockLevel: 4, stockStatus: 'out_of_stock', location: 'Cellar B - Rack 1', cellarSection: 'Cellar B', rackNumber: '1', hasImage: false, isActive: true, createdAt: '2025-07-20T10:00:00', updatedAt: '2026-02-08T12:00:00' },
  { id: '4', name: 'Opus One', fullName: 'Opus One Napa Valley 2020', producer: 'Opus One Winery', vintage: 2020, type: 'Red', region: 'Napa Valley', country: 'USA', volume: 750, abv: 14.5, price: 400, purchasePrice: 280, salePrice: 400, sku: 'OO-2020-750', barcode: '0086003123458', barcodeType: 'UPC-A', grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'], stockUnopened: 15, stockOpened: 1, minStockLevel: 8, maxStockLevel: 30, reorderPoint: 10, reorderQuantity: 6, stockStatus: 'in_stock', location: 'Cellar A - Rack 1', cellarSection: 'Cellar A', rackNumber: '1', supplierName: 'US Premium Wines', tastingNotes: 'Rich blend with dark fruit and vanilla oak notes', body: 'full', sweetness: 'dry', acidity: 'medium', tannins: 'firm', foodPairing: 'Steak, Game meats', hasImage: true, isActive: true, createdAt: '2025-10-01T10:00:00', updatedAt: '2026-02-09T13:15:00' },
  { id: '5', name: 'Dom Pérignon', fullName: 'Dom Pérignon Vintage Brut 2012', producer: 'Moët & Chandon', vintage: 2012, type: 'Sparkling', region: 'Champagne', country: 'France', volume: 750, abv: 12.5, closureType: 'cork', price: 280, purchasePrice: 200, salePrice: 280, glassPrice: 45, availableByGlass: true, sku: 'DP-2012-750', barcode: '3185370554210', barcodeType: 'EAN-13', grapeVarieties: ['Chardonnay', 'Pinot Noir'], stockUnopened: 8, stockOpened: 0, minStockLevel: 4, stockStatus: 'in_stock', location: 'Cellar B - Rack 2', cellarSection: 'Cellar B', rackNumber: '2', tastingNotes: 'Toasty brioche with citrus and mineral notes', body: 'medium', acidity: 'high', foodPairing: 'Oysters, Caviar', hasImage: true, isActive: true, createdAt: '2025-06-15T10:00:00', updatedAt: '2026-02-08T16:20:00' },
  { id: '6', name: 'Cloudy Bay', fullName: 'Cloudy Bay Sauvignon Blanc 2023', producer: 'Cloudy Bay Vineyards', vintage: 2023, type: 'White', region: 'Marlborough', country: 'New Zealand', volume: 750, abv: 13, closureType: 'screw_cap', price: 28, purchasePrice: 16, salePrice: 28, glassPrice: 12, availableByGlass: true, sku: 'CB-2023-750', grapeVarieties: ['Sauvignon Blanc'], stockUnopened: 24, stockOpened: 3, minStockLevel: 12, maxStockLevel: 48, reorderPoint: 18, reorderQuantity: 12, stockStatus: 'in_stock', location: 'Bar Fridge', cellarSection: 'Bar', tastingNotes: 'Vibrant passionfruit and grapefruit with herbaceous edge', body: 'light', sweetness: 'dry', acidity: 'high', foodPairing: 'Seafood, Salads, Goat cheese', hasImage: true, isActive: true, createdAt: '2025-11-01T10:00:00', updatedAt: '2026-02-08T15:00:00' },
  { id: '7', name: 'Whispering Angel', fullName: 'Whispering Angel Côtes de Provence 2023', producer: "Château d'Esclans", vintage: 2023, type: 'Rosé', region: 'Provence', country: 'France', volume: 750, abv: 13, closureType: 'screw_cap', price: 24, purchasePrice: 14, salePrice: 24, glassPrice: 10, availableByGlass: true, sku: 'WA-2023-750', grapeVarieties: ['Grenache', 'Cinsault'], stockUnopened: 18, stockOpened: 2, minStockLevel: 10, stockStatus: 'in_stock', location: 'Bar Fridge', cellarSection: 'Bar', tastingNotes: 'Pale pink with strawberry and white peach', body: 'light', sweetness: 'dry', acidity: 'medium', foodPairing: 'Light salads, Grilled fish', hasImage: true, isActive: true, createdAt: '2025-11-15T10:00:00', updatedAt: '2026-02-07T12:00:00' },
  { id: '8', name: 'Penfolds Grange', fullName: 'Penfolds Grange Bin 95 Shiraz 2016', producer: 'Penfolds', vintage: 2016, type: 'Red', region: 'Barossa Valley', country: 'Australia', volume: 750, abv: 14.5, closureType: 'cork', price: 680, purchasePrice: 480, salePrice: 680, sku: 'PG-2016-750', grapeVarieties: ['Shiraz'], stockUnopened: 4, stockOpened: 0, minStockLevel: 3, stockStatus: 'in_stock', location: 'Cellar A - Rack 2', cellarSection: 'Cellar A', rackNumber: '2', tastingNotes: 'Concentrated dark fruit, spice, and chocolatey oak', body: 'full', sweetness: 'dry', acidity: 'medium', tannins: 'firm', foodPairing: 'Wagyu beef, Dark chocolate', hasImage: true, isActive: true, createdAt: '2025-08-01T10:00:00', updatedAt: '2026-02-06T10:00:00' },
  { id: '9', name: 'Tignanello', fullName: 'Tignanello Toscana IGT 2020', producer: 'Marchesi Antinori', vintage: 2020, type: 'Red', region: 'Tuscany', country: 'Italy', volume: 750, abv: 14, closureType: 'cork', price: 120, purchasePrice: 78, salePrice: 120, sku: 'TG-2020-750', grapeVarieties: ['Sangiovese', 'Cabernet Sauvignon'], stockUnopened: 6, stockOpened: 1, minStockLevel: 4, stockStatus: 'in_stock', location: 'Cellar B - Rack 3', cellarSection: 'Cellar B', rackNumber: '3', body: 'full', sweetness: 'dry', tannins: 'medium', hasImage: true, isActive: true, createdAt: '2025-09-15T10:00:00', updatedAt: '2026-02-08T14:30:00' },
  { id: '10', name: 'Chablis Grand Cru', fullName: 'Chablis Grand Cru Les Clos 2021', producer: 'William Fèvre', vintage: 2021, type: 'White', region: 'Burgundy', subRegion: 'Chablis', appellation: 'AOC Chablis Grand Cru', country: 'France', volume: 750, abv: 13, closureType: 'cork', price: 75, purchasePrice: 48, salePrice: 75, glassPrice: 18, availableByGlass: true, sku: 'CG-2021-750', grapeVarieties: ['Chardonnay'], stockUnopened: 5, stockOpened: 1, minStockLevel: 6, stockStatus: 'low_stock', location: 'Cellar B - Rack 4', cellarSection: 'Cellar B', rackNumber: '4', tastingNotes: 'Crisp minerality with citrus and flinty notes', body: 'medium', sweetness: 'dry', acidity: 'high', foodPairing: 'Oysters, White fish', hasImage: true, isActive: true, createdAt: '2025-10-10T10:00:00', updatedAt: '2026-02-07T16:00:00' },
  { id: '11', name: 'Château Margaux', fullName: 'Château Margaux Premier Grand Cru Classé 2018', producer: 'Château Margaux', estate: 'Château Margaux', vintage: 2018, type: 'Red', region: 'Bordeaux', subRegion: 'Margaux', appellation: 'AOC Margaux', country: 'France', volume: 750, abv: 13.5, closureType: 'cork', price: 520, purchasePrice: 380, salePrice: 520, sku: 'CM-2018-750', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 6, stockOpened: 0, minStockLevel: 4, stockStatus: 'in_stock', location: 'Cellar A - Rack 3', cellarSection: 'Cellar A', rackNumber: '3', body: 'full', sweetness: 'dry', tannins: 'firm', hasImage: true, isActive: true, createdAt: '2025-12-01T10:00:00', updatedAt: '2026-02-05T10:00:00' },
  { id: '12', name: 'Château Margaux', fullName: 'Château Margaux Premier Grand Cru Classé 2015 Half', producer: 'Château Margaux', estate: 'Château Margaux', vintage: 2015, type: 'Red', region: 'Bordeaux', subRegion: 'Margaux', appellation: 'AOC Margaux', country: 'France', volume: 375, volumeLabel: 'Half Bottle', bottleSize: 'Half', abv: 13.5, closureType: 'cork', price: 240, purchasePrice: 170, salePrice: 240, sku: 'CM-2015-375', grapeVarieties: ['Cabernet Sauvignon', 'Merlot'], stockUnopened: 3, stockOpened: 0, minStockLevel: 2, stockStatus: 'in_stock', location: 'Cellar A - Rack 3', cellarSection: 'Cellar A', rackNumber: '3', hasImage: true, isActive: true, createdAt: '2025-08-15T10:00:00', updatedAt: '2026-02-04T10:00:00' },
];

// ====================== INVENTORY MOVEMENTS ======================

export interface InventoryMovement {
  id: string;
  wineId: string;
  wineName: string;
  userId: string;
  userName: string;
  method: 'manual' | 'barcode' | 'image_ai';
  unopened: number;
  opened: number;
  confidence?: number;
  notes?: string;
  timestamp: string;
  sessionId: string;
}

export const mockMovements: InventoryMovement[] = [
  { id: 'm1', wineId: '1', wineName: 'Château Margaux 2015 750ml', userId: '2', userName: 'Sarah Miller', method: 'barcode', unopened: 10, opened: 2, timestamp: '2026-02-09T14:45:00', sessionId: 'S004', notes: '' },
  { id: 'm2', wineId: '2', wineName: 'Barolo Riserva 2018 750ml', userId: '2', userName: 'Sarah Miller', method: 'image_ai', unopened: 2, opened: 0, confidence: 92.5, timestamp: '2026-02-09T14:38:00', sessionId: 'S004' },
  { id: 'm3', wineId: '4', wineName: 'Opus One 2020 750ml', userId: '1', userName: 'Marco Rossi', method: 'manual', unopened: 15, opened: 1, timestamp: '2026-02-09T13:15:00', sessionId: 'S003' },
  { id: 'm4', wineId: '5', wineName: 'Dom Pérignon 2012 750ml', userId: '2', userName: 'Sarah Miller', method: 'barcode', unopened: 8, opened: 0, timestamp: '2026-02-08T16:20:00', sessionId: 'S002' },
  { id: 'm5', wineId: '6', wineName: 'Cloudy Bay 2023 750ml', userId: '1', userName: 'Marco Rossi', method: 'manual', unopened: 24, opened: 3, timestamp: '2026-02-08T15:00:00', sessionId: 'S001' },
  { id: 'm6', wineId: '9', wineName: 'Tignanello 2020 750ml', userId: '2', userName: 'Sarah Miller', method: 'image_ai', unopened: 6, opened: 1, confidence: 88.3, timestamp: '2026-02-08T14:30:00', sessionId: 'S002' },
];

// ====================== INVENTORY SESSIONS ======================

export type SessionStatus = 'draft' | 'in_progress' | 'completed' | 'paused' | 'approved' | 'flagged';

export interface InventorySession {
  id: string;
  sessionName: string;
  sessionType: 'full' | 'partial' | 'spot_check';
  description?: string;
  status: SessionStatus;
  locationFilter?: string;
  totalWinesExpected: number;
  totalWinesCounted: number;
  startedAt: string;
  completedAt?: string;
  duration?: number; // seconds
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
}

export interface InventoryItem {
  id: string;
  sessionId: string;
  wineId: string;
  wineName: string;
  expectedUnopened: number;
  expectedOpened: number;
  countedUnopened: number;
  countedOpened: number;
  varianceUnopened: number; // counted - expected
  varianceOpened: number;
  totalVariance: number;
  hasVariance: boolean;
  countedAt: string;
  countedBy: string;
  countedByName: string;
  countingMethod: 'manual' | 'barcode' | 'image_ai';
  countingDurationSeconds?: number;
  confidence?: number;
}

export const mockSessions: InventorySession[] = [
  { id: 'S001', sessionName: 'Weekly Full Count', sessionType: 'full', description: 'Weekly full inventory', status: 'approved', totalWinesExpected: 12, totalWinesCounted: 12, startedAt: '2026-02-08T14:00:00', completedAt: '2026-02-08T16:30:00', duration: 9000, createdBy: '1', createdByName: 'Marco Rossi', approvedBy: '1', approvedAt: '2026-02-08T17:00:00' },
  { id: 'S002', sessionName: 'Evening Bar Check', sessionType: 'partial', description: 'Bar area partial count', status: 'completed', locationFilter: 'Bar', totalWinesExpected: 4, totalWinesCounted: 3, startedAt: '2026-02-08T14:15:00', completedAt: '2026-02-08T16:45:00', duration: 9000, createdBy: '2', createdByName: 'Sarah Miller' },
  { id: 'S003', sessionName: 'Cellar A Spot Check', sessionType: 'spot_check', description: 'Spot check Cellar A', status: 'completed', locationFilter: 'Cellar A', totalWinesExpected: 6, totalWinesCounted: 4, startedAt: '2026-02-09T12:00:00', completedAt: '2026-02-09T13:30:00', duration: 5400, createdBy: '1', createdByName: 'Marco Rossi' },
  { id: 'S004', sessionName: 'Daily Count Feb 9', sessionType: 'full', status: 'in_progress', totalWinesExpected: 12, totalWinesCounted: 2, startedAt: '2026-02-09T14:30:00', duration: 0, createdBy: '2', createdByName: 'Sarah Miller' },
];

export const mockInventoryItems: InventoryItem[] = [
  // S001 items (approved session)
  { id: 'ii1', sessionId: 'S001', wineId: '6', wineName: 'Cloudy Bay 2023', expectedUnopened: 24, expectedOpened: 3, countedUnopened: 24, countedOpened: 3, varianceUnopened: 0, varianceOpened: 0, totalVariance: 0, hasVariance: false, countedAt: '2026-02-08T15:00:00', countedBy: '1', countedByName: 'Marco Rossi', countingMethod: 'manual' },
  { id: 'ii2', sessionId: 'S001', wineId: '7', wineName: 'Whispering Angel 2023', expectedUnopened: 18, expectedOpened: 2, countedUnopened: 18, countedOpened: 2, varianceUnopened: 0, varianceOpened: 0, totalVariance: 0, hasVariance: false, countedAt: '2026-02-08T15:10:00', countedBy: '1', countedByName: 'Marco Rossi', countingMethod: 'barcode' },
  // S002 items (completed, pending review, has variance)
  { id: 'ii3', sessionId: 'S002', wineId: '5', wineName: 'Dom Pérignon 2012', expectedUnopened: 10, expectedOpened: 0, countedUnopened: 8, countedOpened: 0, varianceUnopened: -2, varianceOpened: 0, totalVariance: -2, hasVariance: true, countedAt: '2026-02-08T16:20:00', countedBy: '2', countedByName: 'Sarah Miller', countingMethod: 'barcode' },
  { id: 'ii4', sessionId: 'S002', wineId: '9', wineName: 'Tignanello 2020', expectedUnopened: 8, expectedOpened: 0, countedUnopened: 6, countedOpened: 1, varianceUnopened: -2, varianceOpened: 1, totalVariance: -1, hasVariance: true, countedAt: '2026-02-08T14:30:00', countedBy: '2', countedByName: 'Sarah Miller', countingMethod: 'image_ai', confidence: 88.3 },
  // S003 items (completed, minor variance)
  { id: 'ii5', sessionId: 'S003', wineId: '4', wineName: 'Opus One 2020', expectedUnopened: 14, expectedOpened: 1, countedUnopened: 15, countedOpened: 1, varianceUnopened: 1, varianceOpened: 0, totalVariance: 1, hasVariance: true, countedAt: '2026-02-09T13:15:00', countedBy: '1', countedByName: 'Marco Rossi', countingMethod: 'manual' },
  { id: 'ii6', sessionId: 'S003', wineId: '1', wineName: 'Château Margaux 2015', expectedUnopened: 10, expectedOpened: 2, countedUnopened: 10, countedOpened: 2, varianceUnopened: 0, varianceOpened: 0, totalVariance: 0, hasVariance: false, countedAt: '2026-02-09T12:30:00', countedBy: '1', countedByName: 'Marco Rossi', countingMethod: 'barcode' },
  // S004 items (in progress)
  { id: 'ii7', sessionId: 'S004', wineId: '1', wineName: 'Château Margaux 2015', expectedUnopened: 10, expectedOpened: 2, countedUnopened: 10, countedOpened: 2, varianceUnopened: 0, varianceOpened: 0, totalVariance: 0, hasVariance: false, countedAt: '2026-02-09T14:45:00', countedBy: '2', countedByName: 'Sarah Miller', countingMethod: 'barcode' },
  { id: 'ii8', sessionId: 'S004', wineId: '2', wineName: 'Barolo Riserva 2018', expectedUnopened: 4, expectedOpened: 0, countedUnopened: 2, countedOpened: 0, varianceUnopened: -2, varianceOpened: 0, totalVariance: -2, hasVariance: true, countedAt: '2026-02-09T14:38:00', countedBy: '2', countedByName: 'Sarah Miller', countingMethod: 'image_ai', confidence: 92.5 },
];

// ====================== USERS ======================

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  lastLogin: string;
  totalCounts: number;
  phone?: string;
  jobTitle?: string;
  department?: string;
  notes?: string;
  avatarUrl?: string;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  createdAt?: string;
}

export const mockUsers: MockUser[] = [
  { id: '1', name: 'Marco Rossi', email: 'admin@wine.com', role: 'admin', status: 'active', lastLogin: '2026-02-09T14:00:00', totalCounts: 432, phone: '+39 338 123 4567', jobTitle: 'Head Sommelier', department: 'Beverage', createdAt: '2024-01-15T10:00:00' },
  { id: '2', name: 'Sarah Miller', email: 'staff@wine.com', role: 'staff', status: 'active', lastLogin: '2026-02-09T14:45:00', totalCounts: 287, phone: '+39 338 765 4321', jobTitle: 'Wine Steward', department: 'Beverage', createdAt: '2024-06-01T10:00:00' },
  { id: '3', name: 'John Davis', email: 'john@wine.com', role: 'staff', status: 'active', lastLogin: '2026-02-08T18:30:00', totalCounts: 156, jobTitle: 'Bartender', department: 'Bar', createdAt: '2024-09-15T10:00:00' },
  { id: '4', name: 'Elena Garcia', email: 'elena@wine.com', role: 'staff', status: 'inactive', lastLogin: '2026-01-15T10:00:00', totalCounts: 89, jobTitle: 'Assistant Sommelier', department: 'Beverage', notes: 'On leave until March', createdAt: '2025-01-10T10:00:00' },
];
