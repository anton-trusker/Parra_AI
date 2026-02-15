export interface MockStoreStock {
  productId: string;
  productName: string;
  category: string;
  sku: string;
  stores: {
    storeId: string;
    storeName: string;
    unopened: number;
    open: number;
    lastCounted: string | null;
  }[];
  totalUnopened: number;
  totalOpen: number;
}

export const mockStockByStore: MockStoreStock[] = [
  { productId: 'p-1', productName: 'Quinta do Vesuvio Vintage Port 2018', category: 'Port Wine', sku: 'QDV-PORT-18', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 7, open: 1, lastCounted: '2026-02-15T07:30:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 3, open: 0, lastCounted: '2026-02-12T10:00:00Z' }, { storeId: 'store-3', storeName: 'Beach Club Cascais', unopened: 2, open: 0, lastCounted: '2026-02-14T09:00:00Z' }], totalUnopened: 12, totalOpen: 1 },
  { productId: 'p-2', productName: 'Pêra-Manca Tinto 2019', category: 'Red Wine', sku: 'PM-T-19', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 12, open: 0, lastCounted: '2026-02-15T07:35:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 4, open: 1, lastCounted: '2026-02-12T10:05:00Z' }], totalUnopened: 16, totalOpen: 1 },
  { productId: 'p-3', productName: 'Barca Velha 2011', category: 'Red Wine', sku: 'BV-11', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 3, open: 0, lastCounted: '2026-02-15T07:40:00Z' }], totalUnopened: 3, totalOpen: 0 },
  { productId: 'p-5', productName: 'Niepoort Redoma Branco 2021', category: 'White Wine', sku: 'NR-B-21', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 6, open: 1, lastCounted: '2026-02-15T08:00:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 5, open: 0, lastCounted: '2026-02-12T10:20:00Z' }, { storeId: 'store-3', storeName: 'Beach Club Cascais', unopened: 3, open: 1, lastCounted: '2026-02-14T10:00:00Z' }], totalUnopened: 14, totalOpen: 2 },
  { productId: 'p-7', productName: 'Soalheiro Alvarinho 2022', category: 'White Wine', sku: 'SA-22', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 8, open: 1, lastCounted: '2026-02-15T08:10:00Z' }, { storeId: 'store-3', storeName: 'Beach Club Cascais', unopened: 6, open: 0, lastCounted: '2026-02-14T10:30:00Z' }], totalUnopened: 14, totalOpen: 1 },
  { productId: 'p-9', productName: 'Taylor\'s Vintage Port 2016', category: 'Port Wine', sku: 'TV-SP-16', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 7, open: 0, lastCounted: '2026-02-15T08:20:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 4, open: 1, lastCounted: '2026-02-12T10:30:00Z' }], totalUnopened: 11, totalOpen: 1 },
  { productId: 'p-11', productName: 'Dow\'s Vintage Port 2017', category: 'Port Wine', sku: 'DVP-17', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 10, open: 2, lastCounted: '2026-02-15T08:30:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 6, open: 0, lastCounted: '2026-02-12T10:35:00Z' }], totalUnopened: 16, totalOpen: 2 },
  { productId: 'p-12', productName: 'Chryseia 2019', category: 'Red Wine', sku: 'CHR-19', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 6, open: 0, lastCounted: '2026-02-15T08:35:00Z' }, { storeId: 'store-3', storeName: 'Beach Club Cascais', unopened: 2, open: 0, lastCounted: '2026-02-14T11:00:00Z' }], totalUnopened: 8, totalOpen: 0 },
  { productId: 'p-14', productName: 'Aveleda Alvarinho 2023', category: 'White Wine', sku: 'AV-A-23', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 18, open: 1, lastCounted: '2026-02-10T13:00:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 12, open: 0, lastCounted: '2026-02-12T10:40:00Z' }, { storeId: 'store-3', storeName: 'Beach Club Cascais', unopened: 8, open: 1, lastCounted: '2026-02-14T11:15:00Z' }], totalUnopened: 38, totalOpen: 2 },
  { productId: 'p-15', productName: 'Esporão Reserva 2020', category: 'Red Wine', sku: 'ESP-R-20', stores: [{ storeId: 'store-1', storeName: 'Main Restaurant', unopened: 11, open: 1, lastCounted: '2026-02-10T13:30:00Z' }, { storeId: 'store-2', storeName: 'Wine Bar Downtown', unopened: 7, open: 0, lastCounted: '2026-02-12T10:45:00Z' }], totalUnopened: 18, totalOpen: 1 },
];
