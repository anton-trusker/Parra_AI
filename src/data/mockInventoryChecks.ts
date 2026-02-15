export type CheckStatus = 'draft' | 'in_progress' | 'pending_review' | 'approved' | 'synced' | 'cancelled';

export interface MockInventoryCheck {
  id: string;
  title: string;
  storeId: string;
  storeName: string;
  status: CheckStatus;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  totalItems: number;
  countedItems: number;
  varianceItems: number;
  description: string | null;
}

export const checkStatusConfig: Record<CheckStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/15 text-blue-400' },
  pending_review: { label: 'Pending Review', color: 'bg-amber-500/15 text-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-500/15 text-emerald-400' },
  synced: { label: 'Synced', color: 'bg-primary/15 text-primary' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/15 text-destructive' },
};

export const mockInventoryChecks: MockInventoryCheck[] = [
  {
    id: 'chk-001',
    title: 'Weekly Full Count — Main Restaurant',
    storeId: 'store-1',
    storeName: 'Main Restaurant',
    status: 'synced',
    createdBy: 'Maria Silva',
    createdAt: '2026-02-10T09:00:00Z',
    startedAt: '2026-02-10T10:00:00Z',
    completedAt: '2026-02-10T14:30:00Z',
    approvedBy: 'João Costa',
    approvedAt: '2026-02-10T16:00:00Z',
    totalItems: 187,
    countedItems: 187,
    varianceItems: 12,
    description: 'Regular weekly inventory count',
  },
  {
    id: 'chk-002',
    title: 'Wine Bar Spot Check',
    storeId: 'store-2',
    storeName: 'Wine Bar Downtown',
    status: 'approved',
    createdBy: 'Pedro Almeida',
    createdAt: '2026-02-12T08:00:00Z',
    startedAt: '2026-02-12T09:30:00Z',
    completedAt: '2026-02-12T11:00:00Z',
    approvedBy: 'Maria Silva',
    approvedAt: '2026-02-13T10:00:00Z',
    totalItems: 94,
    countedItems: 94,
    varianceItems: 3,
    description: null,
  },
  {
    id: 'chk-003',
    title: 'Beach Club Monthly Count',
    storeId: 'store-3',
    storeName: 'Beach Club Cascais',
    status: 'pending_review',
    createdBy: 'Ana Rodrigues',
    createdAt: '2026-02-14T07:00:00Z',
    startedAt: '2026-02-14T08:00:00Z',
    completedAt: '2026-02-14T12:00:00Z',
    approvedBy: null,
    approvedAt: null,
    totalItems: 53,
    countedItems: 51,
    varianceItems: 8,
    description: 'Monthly full inventory',
  },
  {
    id: 'chk-004',
    title: 'Main Restaurant — Premium Wines',
    storeId: 'store-1',
    storeName: 'Main Restaurant',
    status: 'in_progress',
    createdBy: 'Maria Silva',
    createdAt: '2026-02-15T06:00:00Z',
    startedAt: '2026-02-15T07:00:00Z',
    completedAt: null,
    approvedBy: null,
    approvedAt: null,
    totalItems: 45,
    countedItems: 28,
    varianceItems: 2,
    description: 'Partial count of premium wines section',
  },
  {
    id: 'chk-005',
    title: 'Wine Bar — Spirits Audit',
    storeId: 'store-2',
    storeName: 'Wine Bar Downtown',
    status: 'draft',
    createdBy: 'João Costa',
    createdAt: '2026-02-15T08:00:00Z',
    startedAt: null,
    completedAt: null,
    approvedBy: null,
    approvedAt: null,
    totalItems: 32,
    countedItems: 0,
    varianceItems: 0,
    description: 'Spirits section audit',
  },
  {
    id: 'chk-006',
    title: 'Weekly Full Count — Main Restaurant',
    storeId: 'store-1',
    storeName: 'Main Restaurant',
    status: 'synced',
    createdBy: 'Maria Silva',
    createdAt: '2026-02-03T09:00:00Z',
    startedAt: '2026-02-03T10:00:00Z',
    completedAt: '2026-02-03T15:00:00Z',
    approvedBy: 'João Costa',
    approvedAt: '2026-02-03T17:00:00Z',
    totalItems: 185,
    countedItems: 185,
    varianceItems: 5,
    description: null,
  },
  {
    id: 'chk-007',
    title: 'Beach Club — Reopening Count',
    storeId: 'store-3',
    storeName: 'Beach Club Cascais',
    status: 'cancelled',
    createdBy: 'Ana Rodrigues',
    createdAt: '2026-01-28T08:00:00Z',
    startedAt: null,
    completedAt: null,
    approvedBy: null,
    approvedAt: null,
    totalItems: 53,
    countedItems: 0,
    varianceItems: 0,
    description: 'Cancelled due to schedule change',
  },
  {
    id: 'chk-008',
    title: 'All Stores — Year-End Audit',
    storeId: 'store-1',
    storeName: 'Main Restaurant',
    status: 'synced',
    createdBy: 'João Costa',
    createdAt: '2025-12-31T06:00:00Z',
    startedAt: '2025-12-31T07:00:00Z',
    completedAt: '2025-12-31T18:00:00Z',
    approvedBy: 'João Costa',
    approvedAt: '2026-01-02T10:00:00Z',
    totalItems: 334,
    countedItems: 334,
    varianceItems: 22,
    description: 'Annual year-end full audit across all locations',
  },
];
