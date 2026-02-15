export interface MockStore {
  id: string;
  name: string;
  address: string;
  city: string;
  productCount: number;
  totalStock: number;
  lastSyncAt: string;
  isActive: boolean;
}

export const mockStores: MockStore[] = [
  {
    id: 'store-1',
    name: 'Main Restaurant',
    address: '15 Rua Augusta',
    city: 'Lisbon',
    productCount: 187,
    totalStock: 1420,
    lastSyncAt: '2026-02-15T08:30:00Z',
    isActive: true,
  },
  {
    id: 'store-2',
    name: 'Wine Bar Downtown',
    address: '42 Av. da Liberdade',
    city: 'Lisbon',
    productCount: 94,
    totalStock: 620,
    lastSyncAt: '2026-02-15T07:15:00Z',
    isActive: true,
  },
  {
    id: 'store-3',
    name: 'Beach Club Cascais',
    address: '8 Praia do Guincho',
    city: 'Cascais',
    productCount: 53,
    totalStock: 310,
    lastSyncAt: '2026-02-14T22:00:00Z',
    isActive: true,
  },
];
