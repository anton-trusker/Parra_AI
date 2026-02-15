export interface MockCheckItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sku: string;
  expectedUnopened: number;
  expectedOpen: number;
  countedUnopened: number | null;
  countedOpen: number | null;
  varianceUnopened: number | null;
  varianceOpen: number | null;
  countMethod: 'manual' | 'barcode' | 'ai_scan';
  countedAt: string | null;
  countedBy: string | null;
  notes: string | null;
}

export interface MockActivityEntry {
  id: string;
  timestamp: string;
  type: 'count' | 'status_change' | 'ai_scan' | 'adjustment' | 'note';
  userName: string;
  description: string;
  details: string | null;
}

export const mockCheckItems: MockCheckItem[] = [
  { id: 'ci-01', productId: 'p-1', productName: 'Quinta do Vesuvio Vintage Port 2018', category: 'Port Wine', sku: 'QDV-PORT-18', expectedUnopened: 8, expectedOpen: 1, countedUnopened: 7, countedOpen: 1, varianceUnopened: -1, varianceOpen: 0, countMethod: 'ai_scan', countedAt: '2026-02-15T07:30:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-02', productId: 'p-2', productName: 'Pêra-Manca Tinto 2019', category: 'Red Wine', sku: 'PM-T-19', expectedUnopened: 12, expectedOpen: 0, countedUnopened: 12, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'manual', countedAt: '2026-02-15T07:35:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-03', productId: 'p-3', productName: 'Barca Velha 2011', category: 'Red Wine', sku: 'BV-11', expectedUnopened: 3, expectedOpen: 0, countedUnopened: 3, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'barcode', countedAt: '2026-02-15T07:40:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-04', productId: 'p-4', productName: 'Quinta do Crasto Reserva 2020', category: 'Red Wine', sku: 'QDC-R-20', expectedUnopened: 15, expectedOpen: 2, countedUnopened: 14, countedOpen: 1, varianceUnopened: -1, varianceOpen: -1, countMethod: 'manual', countedAt: '2026-02-15T07:50:00Z', countedBy: 'Maria Silva', notes: 'One bottle possibly moved to wine bar' },
  { id: 'ci-05', productId: 'p-5', productName: 'Niepoort Redoma Branco 2021', category: 'White Wine', sku: 'NR-B-21', expectedUnopened: 6, expectedOpen: 1, countedUnopened: 6, countedOpen: 1, varianceUnopened: 0, varianceOpen: 0, countMethod: 'ai_scan', countedAt: '2026-02-15T08:00:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-06', productId: 'p-6', productName: 'Luis Pato Vinha Formal 2015', category: 'Red Wine', sku: 'LP-VF-15', expectedUnopened: 4, expectedOpen: 0, countedUnopened: 4, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'barcode', countedAt: '2026-02-15T08:05:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-07', productId: 'p-7', productName: 'Soalheiro Alvarinho 2022', category: 'White Wine', sku: 'SA-22', expectedUnopened: 10, expectedOpen: 1, countedUnopened: 8, countedOpen: 1, varianceUnopened: -2, varianceOpen: 0, countMethod: 'manual', countedAt: '2026-02-15T08:10:00Z', countedBy: 'Maria Silva', notes: 'Two bottles unaccounted, checking delivery records' },
  { id: 'ci-08', productId: 'p-8', productName: 'Mouchão Tonel 3-4 2017', category: 'Red Wine', sku: 'MT-34-17', expectedUnopened: 5, expectedOpen: 0, countedUnopened: 5, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'ai_scan', countedAt: '2026-02-15T08:15:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-09', productId: 'p-9', productName: 'Taylor\'s Vintage Port 2016', category: 'Port Wine', sku: 'TV-SP-16', expectedUnopened: 7, expectedOpen: 1, countedUnopened: 7, countedOpen: 0, varianceUnopened: 0, varianceOpen: -1, countMethod: 'manual', countedAt: '2026-02-15T08:20:00Z', countedBy: 'Maria Silva', notes: 'Open bottle finished, not replaced yet' },
  { id: 'ci-10', productId: 'p-10', productName: 'Quinta da Pellada Primus 2018', category: 'Red Wine', sku: 'QDP-P-18', expectedUnopened: 2, expectedOpen: 0, countedUnopened: 2, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'barcode', countedAt: '2026-02-15T08:25:00Z', countedBy: 'Maria Silva', notes: null },
  { id: 'ci-11', productId: 'p-11', productName: 'Dow\'s Vintage Port 2017', category: 'Port Wine', sku: 'DVP-17', expectedUnopened: 9, expectedOpen: 2, countedUnopened: 10, countedOpen: 2, varianceUnopened: 1, varianceOpen: 0, countMethod: 'manual', countedAt: '2026-02-15T08:30:00Z', countedBy: 'Maria Silva', notes: 'Extra bottle found — likely from unrecorded delivery' },
  { id: 'ci-12', productId: 'p-12', productName: 'Chryseia 2019', category: 'Red Wine', sku: 'CHR-19', expectedUnopened: 6, expectedOpen: 0, countedUnopened: 6, countedOpen: 0, varianceUnopened: 0, varianceOpen: 0, countMethod: 'ai_scan', countedAt: '2026-02-15T08:35:00Z', countedBy: 'Maria Silva', notes: null },
  // Uncounted items
  { id: 'ci-13', productId: 'p-13', productName: 'Quinta do Vallado Reserva 2019', category: 'Red Wine', sku: 'QDV-R-19', expectedUnopened: 4, expectedOpen: 0, countedUnopened: null, countedOpen: null, varianceUnopened: null, varianceOpen: null, countMethod: 'manual', countedAt: null, countedBy: null, notes: null },
  { id: 'ci-14', productId: 'p-14', productName: 'Aveleda Alvarinho 2023', category: 'White Wine', sku: 'AV-A-23', expectedUnopened: 18, expectedOpen: 1, countedUnopened: null, countedOpen: null, varianceUnopened: null, varianceOpen: null, countMethod: 'manual', countedAt: null, countedBy: null, notes: null },
  { id: 'ci-15', productId: 'p-15', productName: 'Esporão Reserva 2020', category: 'Red Wine', sku: 'ESP-R-20', expectedUnopened: 11, expectedOpen: 1, countedUnopened: null, countedOpen: null, varianceUnopened: null, varianceOpen: null, countMethod: 'manual', countedAt: null, countedBy: null, notes: null },
];

export const mockActivityLog: MockActivityEntry[] = [
  { id: 'act-01', timestamp: '2026-02-15T07:00:00Z', type: 'status_change', userName: 'Maria Silva', description: 'Check started', details: 'Status changed from draft to in_progress' },
  { id: 'act-02', timestamp: '2026-02-15T07:30:00Z', type: 'ai_scan', userName: 'Maria Silva', description: 'AI scan: Quinta do Vesuvio Port (96% confidence)', details: 'Matched to existing product. Quantity: 7 unopened, 1 open' },
  { id: 'act-03', timestamp: '2026-02-15T07:35:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Pêra-Manca Tinto 2019', details: 'Manual count: 12 unopened. No variance.' },
  { id: 'act-04', timestamp: '2026-02-15T07:40:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Barca Velha 2011', details: 'Barcode scan: 3 unopened. No variance.' },
  { id: 'act-05', timestamp: '2026-02-15T07:50:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Quinta do Crasto Reserva 2020', details: 'Manual count: 14 unopened, 1 open. Variance: -1 / -1' },
  { id: 'act-06', timestamp: '2026-02-15T07:51:00Z', type: 'note', userName: 'Maria Silva', description: 'Added note to Quinta do Crasto', details: 'One bottle possibly moved to wine bar' },
  { id: 'act-07', timestamp: '2026-02-15T08:00:00Z', type: 'ai_scan', userName: 'Maria Silva', description: 'AI scan: Niepoort Redoma Branco (94% confidence)', details: 'Confirmed match. 6 unopened, 1 open.' },
  { id: 'act-08', timestamp: '2026-02-15T08:05:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Luis Pato Vinha Formal 2015', details: 'Barcode scan: 4 unopened. No variance.' },
  { id: 'act-09', timestamp: '2026-02-15T08:10:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Soalheiro Alvarinho 2022', details: 'Manual count: 8 unopened, 1 open. Variance: -2 / 0' },
  { id: 'act-10', timestamp: '2026-02-15T08:11:00Z', type: 'note', userName: 'Maria Silva', description: 'Added note to Soalheiro Alvarinho', details: 'Two bottles unaccounted, checking delivery records' },
  { id: 'act-11', timestamp: '2026-02-15T08:15:00Z', type: 'ai_scan', userName: 'Maria Silva', description: 'AI scan: Mouchão Tonel 3-4 (85% confidence)', details: 'Confirmed match. 5 unopened.' },
  { id: 'act-12', timestamp: '2026-02-15T08:20:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Taylor\'s Vintage Port 2016', details: 'Manual count: 7 unopened, 0 open. Variance: 0 / -1' },
  { id: 'act-13', timestamp: '2026-02-15T08:25:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Quinta da Pellada Primus 2018', details: 'Barcode scan: 2 unopened. No variance.' },
  { id: 'act-14', timestamp: '2026-02-15T08:30:00Z', type: 'count', userName: 'Maria Silva', description: 'Counted Dow\'s Vintage Port 2017', details: 'Manual count: 10 unopened, 2 open. Surplus: +1 / 0' },
  { id: 'act-15', timestamp: '2026-02-15T08:31:00Z', type: 'note', userName: 'Maria Silva', description: 'Added note to Dow\'s Vintage Port', details: 'Extra bottle found — likely from unrecorded delivery' },
  { id: 'act-16', timestamp: '2026-02-15T08:35:00Z', type: 'ai_scan', userName: 'Maria Silva', description: 'AI scan: Chryseia 2019 (95% confidence)', details: 'Confirmed match. 6 unopened.' },
];
