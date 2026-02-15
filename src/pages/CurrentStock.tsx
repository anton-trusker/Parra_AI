import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, Product } from '@/hooks/useProducts';
import { useInventorySessions, useApproveSession, useFlagSession } from '@/hooks/useInventorySessions';
import { useBaselineItems, useProductAggregates, useCountEvents } from '@/hooks/useInventoryEvents';
import { useCreateSession, useCompleteSession, useSessionItems } from '@/hooks/useInventorySessions';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, Download, SlidersHorizontal, X, ClipboardCheck, Plus, Package,
  Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  ThumbsUp, Flag, Users, Filter, Send, Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import type { InventorySession } from '@/hooks/useInventorySessions';
import type { Database } from '@/integrations/supabase/types';

type SessionStatus = Database['public']['Enums']['session_status_enum'];

// ═══════════════════════════════════════════════
// Column & filter definitions for Inventory tab
// ═══════════════════════════════════════════════

const STOCK_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Product' },
  { key: 'sku', label: 'SKU' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'stock', label: 'Stock' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'synced', label: 'Last Synced' },
];

// ═══════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════

function StockStatusBadge({ stock }: { stock: number | null }) {
  const s = stock ?? 0;
  if (s <= 0) return <span className="wine-badge stock-out">✗ Out</span>;
  if (s < 5) return <span className="wine-badge stock-low">⚠ Low</span>;
  return <span className="wine-badge stock-healthy">✓ In Stock</span>;
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted-foreground">—</span>;
  return <span className="wine-badge bg-secondary text-secondary-foreground">{type}</span>;
}

// ═══════════════════════════════════════════════
// Inventory Tab
// ═══════════════════════════════════════════════

function buildStockColumns(isManager: boolean): DataTableColumn<Product>[] {
  return [
    { key: 'name', label: 'Product', minWidth: 180, render: p => <span className="font-medium">{p.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-xs text-muted-foreground font-mono">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-xs text-muted-foreground">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{(p as any).categories?.name || '—'}</span> },
    { key: 'type', label: 'Type', render: p => <TypeBadge type={p.product_type} /> },
    ...(isManager ? [
      { key: 'stock', label: 'Stock', align: 'right' as const, render: (p: Product) => <span className="font-semibold">{p.current_stock ?? 0}</span>, sortFn: (a: Product, b: Product) => (a.current_stock || 0) - (b.current_stock || 0) },
      { key: 'sale_price', label: 'Sale Price', align: 'right' as const, render: (p: Product) => <span className="text-accent">{p.sale_price?.toFixed(2) ?? '—'}</span>, sortFn: (a: Product, b: Product) => (a.sale_price || 0) - (b.sale_price || 0) },
      { key: 'purchase_price', label: 'Purchase Price', align: 'right' as const, render: (p: Product) => <span className="text-muted-foreground">{p.purchase_price?.toFixed(2) ?? '—'}</span> },
    ] : [
      { key: 'stock', label: 'Stock', align: 'right' as const, render: (p: Product) => <StockStatusBadge stock={p.current_stock} /> },
    ]),
    { key: 'synced', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
  ];
}

function InventoryTab({ isManager }: { isManager: boolean }) {
  const navigate = useNavigate();
  const { stockColumns, setStockColumns, stockFilters, setStockFilters, columnWidths, setColumnWidth } = useColumnStore();
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: filterValues.type?.length ? filterValues.type : undefined,
  });

  const totalStock = useMemo(() => products.reduce((s, p) => s + (Number(p.current_stock) || 0), 0), [products]);

  const optionsMap = useMemo(() => {
    const extract = (fn: (p: Product) => string | null | undefined) =>
      [...new Set(products.map(fn).filter(Boolean) as string[])].sort();
    return {
      type: extract(p => p.product_type),
      category: extract(p => (p as any).categories?.name),
    };
  }, [products]);

  const filterDefs: FilterDef[] = [
    { key: 'type', label: 'Type' },
    { key: 'category', label: 'Category' },
  ];

  const activeFilterCount = Object.values(filterValues).filter(f => f.length > 0).length;
  const fv = (key: string) => stockFilters.includes(key);
  const clearFilters = () => setFilterValues({});
  const setFilter = (key: string, values: string[]) => setFilterValues(prev => ({ ...prev, [key]: values }));
  const tableColumns = useMemo(() => buildStockColumns(isManager), [isManager]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <span>{products.length} products</span>
        {isManager && (
          <>
            <span>•</span>
            <span>{totalStock} total stock</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        <Button
          variant="outline" size="icon"
          className={`h-10 w-10 shrink-0 border-border relative ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <ColumnManager columns={STOCK_COLUMN_DEFS} visibleColumns={stockColumns} onChange={setStockColumns} />
      </div>

      {showFilters && (
        <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filters</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all
                </Button>
              )}
              <FilterManager filters={filterDefs} visibleFilters={stockFilters} onChange={setStockFilters} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {filterDefs.map(fd =>
              fv(fd.key) && optionsMap[fd.key as keyof typeof optionsMap] ? (
                <MultiSelectFilter key={fd.key} label={fd.label} options={optionsMap[fd.key as keyof typeof optionsMap] || []} selected={filterValues[fd.key] || []} onChange={v => setFilter(fd.key, v)} />
              ) : null
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <DataTable
            data={products}
            columns={tableColumns}
            visibleColumns={stockColumns}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={p => p.id}
            onRowClick={p => navigate(`/products/${p.id}`)}
            emptyMessage="No products match your filters"
            compact
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Check Review Tab (Session Review embedded)
// ═══════════════════════════════════════════════

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    draft: { cls: 'bg-secondary text-secondary-foreground', icon: Clock, label: 'Draft' },
    in_progress: { cls: 'bg-primary/15 text-primary', icon: Clock, label: 'In Progress' },
    completed: { cls: 'bg-wine-warning/15 text-wine-warning', icon: AlertTriangle, label: 'Pending Review' },
    paused: { cls: 'bg-secondary text-secondary-foreground', icon: Clock, label: 'Paused' },
    approved: { cls: 'stock-healthy', icon: CheckCircle2, label: 'Approved' },
    flagged: { cls: 'stock-out', icon: XCircle, label: 'Flagged' },
  };
  const c = cfg[status] || cfg.draft;
  return <span className={`wine-badge ${c.cls}`}><c.icon className="w-3 h-3 mr-1" />{c.label}</span>;
}

function VarianceBadge({ variance }: { variance: number }) {
  if (variance === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--wine-success))]/15 text-[hsl(var(--wine-success))]">Match</span>;
  if (Math.abs(variance) <= 2) return <span className="text-xs px-2 py-0.5 rounded-full bg-wine-warning/15 text-wine-warning">{variance > 0 ? '+' : ''}{variance}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">{variance > 0 ? '+' : ''}{variance}</span>;
}

function useProductNames(productIds: string[]) {
  return useQuery({
    queryKey: ['product_names_for_review', productIds.sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const { data } = await supabase.from('products').select('id, name').in('id', productIds);
      const map: Record<string, string> = {};
      (data || []).forEach(p => { map[p.id] = p.name; });
      return map;
    },
    enabled: productIds.length > 0,
  });
}

function SessionDiffTable({ sessionId, canSeeStock }: { sessionId: string; canSeeStock: boolean }) {
  const { data: baseline = [] } = useBaselineItems(sessionId);
  const { data: aggregates = [] } = useProductAggregates(sessionId);
  const { data: events = [] } = useCountEvents(sessionId);

  const allProductIds = useMemo(() => {
    const ids = new Set<string>();
    baseline.forEach(b => ids.add(b.product_id));
    aggregates.forEach(a => ids.add(a.product_id));
    return Array.from(ids);
  }, [baseline, aggregates]);

  const { data: productNames = {} } = useProductNames(allProductIds);

  const userBreakdown = useMemo(() => {
    const map = new Map<string, Map<string, { qty: number; liters: number; count: number }>>();
    events.forEach(e => {
      if (!map.has(e.user_id)) map.set(e.user_id, new Map());
      const userMap = map.get(e.user_id)!;
      const existing = userMap.get(e.product_id) || { qty: 0, liters: 0, count: 0 };
      existing.qty += Number(e.bottle_qty) || 0;
      existing.liters += Number(e.derived_liters) || 0;
      existing.count += 1;
      userMap.set(e.product_id, existing);
    });
    return map;
  }, [events]);

  const userIds = Array.from(userBreakdown.keys());

  const { data: userProfiles = {} } = useQuery({
    queryKey: ['profiles_for_session', userIds.join(',')],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data } = await supabase.from('profiles').select('id, display_name, first_name, last_name').in('id', userIds);
      const map: Record<string, string> = {};
      (data || []).forEach(p => { map[p.id] = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.id.slice(0, 8); });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const diffRows = useMemo(() => {
    const baselineMap = new Map(baseline.map(b => [b.product_id, b]));
    const aggregateMap = new Map(aggregates.map(a => [a.product_id, a]));
    return allProductIds.map(pid => {
      const b = baselineMap.get(pid);
      const a = aggregateMap.get(pid);
      const expectedQty = Number(b?.expected_qty) || 0;
      const countedQty = Number(a?.counted_qty_total) || 0;
      return { product_id: pid, product_name: productNames[pid] || pid.slice(0, 8) + '…', expected_qty: expectedQty, counted_qty: countedQty, variance_qty: countedQty - expectedQty, event_count: Number(a?.event_count) || 0 };
    }).sort((a, b) => Math.abs(b.variance_qty) - Math.abs(a.variance_qty));
  }, [allProductIds, baseline, aggregates, productNames]);

  const totalExpected = diffRows.reduce((s, r) => s + r.expected_qty, 0);
  const totalCounted = diffRows.reduce((s, r) => s + r.counted_qty, 0);
  const totalVariance = totalCounted - totalExpected;
  const varianceItems = diffRows.filter(r => r.variance_qty !== 0).length;

  if (diffRows.length === 0 && baseline.length === 0 && aggregates.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground text-center">No items recorded yet</p>;
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="m-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        {userIds.length > 1 && <TabsTrigger value="by-user"><Users className="w-3.5 h-3.5 mr-1" />By User</TabsTrigger>}
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-lg font-bold">{diffRows.length}</p>
            <p className="text-[10px] text-muted-foreground">Products</p>
          </div>
          {canSeeStock && (
            <div className="rounded-lg bg-secondary/50 p-2 text-center">
              <p className="text-lg font-bold">{totalExpected}</p>
              <p className="text-[10px] text-muted-foreground">Expected</p>
            </div>
          )}
          <div className="rounded-lg bg-secondary/50 p-2 text-center">
            <p className="text-lg font-bold">{totalCounted}</p>
            <p className="text-[10px] text-muted-foreground">Counted</p>
          </div>
          {canSeeStock && (
            <div className={`rounded-lg p-2 text-center ${totalVariance === 0 ? 'bg-[hsl(var(--wine-success))]/10' : Math.abs(totalVariance) <= 5 ? 'bg-wine-warning/10' : 'bg-destructive/10'}`}>
              <p className="text-lg font-bold">{totalVariance > 0 ? '+' : ''}{totalVariance}</p>
              <p className="text-[10px] text-muted-foreground">{varianceItems} variances</p>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="text-left p-3 font-medium">Product</th>
                {canSeeStock && <th className="text-center p-3 font-medium">Expected</th>}
                <th className="text-center p-3 font-medium">Counted</th>
                {canSeeStock && <th className="text-center p-3 font-medium">Variance</th>}
                <th className="text-center p-3 font-medium">Events</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map(row => (
                <tr key={row.product_id} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="p-3 font-medium text-xs max-w-[200px] truncate">{row.product_name}</td>
                  {canSeeStock && <td className="p-3 text-center text-muted-foreground">{row.expected_qty}</td>}
                  <td className="p-3 text-center font-semibold">{row.counted_qty}</td>
                  {canSeeStock && <td className="p-3 text-center"><VarianceBadge variance={row.variance_qty} /></td>}
                  <td className="p-3 text-center text-muted-foreground text-xs">{row.event_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>

      {userIds.length > 1 && (
        <TabsContent value="by-user">
          <div className="space-y-4 p-3">
            {userIds.map(uid => {
              const userName = userProfiles[uid] || uid.slice(0, 8);
              const userItems = userBreakdown.get(uid)!;
              const userTotal = Array.from(userItems.values()).reduce((s, v) => s + v.qty, 0);
              return (
                <div key={uid} className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="p-3 bg-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{userName.charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-sm">{userName}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{userItems.size} products</span>
                      <span>{userTotal} units</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="text-muted-foreground border-b border-border/30"><th className="text-left p-2 pl-3 font-medium text-xs">Product</th><th className="text-center p-2 font-medium text-xs">Qty</th><th className="text-center p-2 font-medium text-xs">Scans</th></tr></thead>
                      <tbody>
                        {Array.from(userItems.entries()).map(([pid, v]) => (
                          <tr key={pid} className="border-b border-border/20">
                            <td className="p-2 pl-3 text-xs truncate max-w-[180px]">{productNames[pid] || pid.slice(0, 8)}</td>
                            <td className="p-2 text-center font-semibold text-xs">{v.qty}</td>
                            <td className="p-2 text-center text-muted-foreground text-xs">{v.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
}

function CheckReviewTab() {
  const { user } = useAuthStore();
  const role = useUserRole();
  const { data: sessions = [], isLoading } = useInventorySessions();
  const approveSession = useApproveSession();
  const flagSession = useFlagSession();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [flagDialogSession, setFlagDialogSession] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const isManager = role?.id === 'admin' || role?.id === 'super_admin';

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.session_type !== typeFilter) return false;
      if (search && !s.session_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, statusFilter, typeFilter, search]);

  const pendingCount = sessions.filter(s => s.status === 'completed').length;
  const approvedCount = sessions.filter(s => s.status === 'approved').length;
  const flaggedCount = sessions.filter(s => s.status === 'flagged').length;

  const handleApprove = async (sessionId: string) => {
    try {
      await approveSession.mutateAsync({ id: sessionId, approvedBy: user!.id });
      toast.success('Session approved');
    } catch (e: any) { toast.error('Failed to approve: ' + e.message); }
  };

  const handleFlag = async (sessionId: string) => {
    if (!flagReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      await flagSession.mutateAsync({ id: sessionId, reason: flagReason });
      setFlagDialogSession(null);
      setFlagReason('');
      toast.warning('Session flagged for review');
    } catch (e: any) { toast.error('Failed to flag: ' + e.message); }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-wine-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[hsl(var(--wine-success))]">{approvedCount}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </div>
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{flaggedCount}</p>
          <p className="text-xs text-muted-foreground">Flagged</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-10 bg-card border-border"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-10 bg-card border-border"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full">Full Count</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="spot">Spot Check</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading sessions…</div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => {
            const isExpanded = expandedSession === session.id;
            return (
              <div key={session.id} className="wine-glass-effect rounded-xl overflow-hidden">
                <button className="w-full p-4 text-left flex items-center gap-4" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-heading font-semibold">{session.session_name}</p>
                      <SessionStatusBadge status={session.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>{session.session_type || 'full'}</span>
                      <span>{session.started_at ? new Date(session.started_at).toLocaleDateString() : '—'}</span>
                      <span>{session.total_wines_counted}/{session.total_wines_expected}</span>
                      <span>{formatDuration(session.duration_seconds)}</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-border">
                    <SessionDiffTable sessionId={session.id} canSeeStock={isManager} />
                    {isManager && session.status === 'completed' && (
                      <div className="p-4 border-t border-border/50 space-y-3">
                        {flagDialogSession === session.id ? (
                          <div className="space-y-2">
                            <Textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder="Reason for flagging..." className="bg-secondary border-border text-sm" rows={2} />
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setFlagDialogSession(null)}>Cancel</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleFlag(session.id)}><Flag className="w-3.5 h-3.5 mr-1" /> Confirm Flag</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setFlagDialogSession(session.id)}><Flag className="w-4 h-4 mr-1" /> Flag Issue</Button>
                            <Button size="sm" className="wine-gradient text-primary-foreground hover:opacity-90" onClick={() => handleApprove(session.id)}><ThumbsUp className="w-4 h-4 mr-1" /> Approve</Button>
                          </div>
                        )}
                      </div>
                    )}
                    {session.status === 'approved' && session.approval_notes && (
                      <div className="p-3 border-t border-border/50 bg-[hsl(var(--wine-success))]/5">
                        <p className="text-xs text-muted-foreground">Approval Notes: {session.approval_notes}</p>
                      </div>
                    )}
                    {session.status === 'flagged' && session.flagged_reason && (
                      <div className="p-3 border-t border-border/50 bg-destructive/5">
                        <p className="text-xs text-destructive">Flagged: {session.flagged_reason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredSessions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sessions match your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Start Count Tab (embedded InventoryCount)
// ═══════════════════════════════════════════════

function StartCountTab() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const [phase, setPhase] = useState<'setup' | 'scanning' | 'summary'>('setup');
  const [countType, setCountType] = useState('full');
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [counted, setCounted] = useState(0);
  const [startTime] = useState(() => Date.now());

  const createSession = useCreateSession();
  const completeSession = useCompleteSession();
  const { data: sessionItems = [] } = useSessionItems(sessionId ?? undefined);
  const { data: hideScannerDesktop = false } = useAppSetting<boolean>('inventory_hide_scanner_desktop', false);

  const { data: activeSession } = useQuery({
    queryKey: ['active_inventory_session'],
    queryFn: async () => {
      const { data } = await supabase.from('inventory_sessions').select('*').eq('status', 'in_progress' as any).limit(1).maybeSingle();
      return data;
    },
    refetchInterval: 10000,
  });

  const handleStart = useCallback(async () => {
    if (!user) return;
    try {
      const session = await createSession.mutateAsync({
        session_name: `${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Count`,
        session_type: countType,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        started_by: user.id,
        description: notes || null,
      });
      setSessionId(session.id);
      setPhase('scanning');
    } catch (e: any) { toast.error('Failed to create session: ' + e.message); }
  }, [user, countType, notes, createSession]);

  const handleJoinSession = useCallback(() => {
    if (activeSession) {
      setSessionId(activeSession.id);
      setPhase('scanning');
      toast.success('Joined active session');
    }
  }, [activeSession]);

  const handleCount = useCallback(() => setCounted(c => c + 1), []);

  const handleEndSession = useCallback(async () => {
    if (counted === 0) { setPhase('setup'); toast.info('Session cancelled'); return; }
    if (!sessionId || !user) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await completeSession.mutateAsync({ id: sessionId, completedBy: user.id, duration, totalCounted: counted });
      setPhase('summary');
    } catch (e: any) { toast.error('Failed to complete session: ' + e.message); }
  }, [counted, sessionId, user, startTime, completeSession]);

  if (!isMobile && hideScannerDesktop) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4 animate-fade-in">
        <Package className="w-16 h-16 mx-auto text-muted-foreground/50" />
        <h2 className="text-xl font-heading font-bold">Desktop Scanning Disabled</h2>
        <p className="text-muted-foreground">Scanning is configured for mobile devices only. Open this on a mobile device to start counting.</p>
      </div>
    );
  }

  if (phase === 'setup') {
    return <CountSetup countType={countType} onCountTypeChange={setCountType} notes={notes} onNotesChange={setNotes} onStart={handleStart} isLoading={createSession.isPending} activeSession={activeSession} onJoinSession={handleJoinSession} />;
  }

  if (phase === 'summary' && sessionId) {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    return <SessionSummary sessionId={sessionId} sessionName={`${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Count`} items={sessionItems} duration={duration} onStartNew={() => { setCounted(0); setSessionId(null); setPhase('setup'); }} onClose={() => navigate('/dashboard')} />;
  }

  return <CameraScanner sessionId={sessionId!} counted={counted} onCount={handleCount} onEndSession={handleEndSession} />;
}

// ═══════════════════════════════════════════════
// Main Page: Inventarisation Check
// ═══════════════════════════════════════════════

export default function CurrentStock() {
  const role = useUserRole();
  const isManager = role?.id === 'admin' || role?.id === 'super_admin';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventarisation Check</h1>
        <p className="text-muted-foreground mt-1">Manage inventory counts, review sessions, and track stock</p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="inventory" className="gap-1.5">
            <Package className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1.5">
            <ClipboardCheck className="w-4 h-4" />
            Check Review
          </TabsTrigger>
          <TabsTrigger value="count" className="gap-1.5">
            <Package className="w-4 h-4" />
            Start Count
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <InventoryTab isManager={isManager} />
        </TabsContent>

        <TabsContent value="review" className="mt-4">
          <CheckReviewTab />
        </TabsContent>

        <TabsContent value="count" className="mt-4">
          <StartCountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
