import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import { useProducts, Product } from '@/hooks/useProducts';
import { useInventorySessions, useApproveSession, useFlagSession } from '@/hooks/useInventorySessions';
import { useBaselineItems, useProductAggregates, useCountEvents } from '@/hooks/useInventoryEvents';
import { useCreateSession, useCompleteSession, useSessionItems } from '@/hooks/useInventorySessions';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStores } from '@/hooks/useStores';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp,
  ThumbsUp, Flag, Users, Play, Package, ClipboardCheck, Ban, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CountSetup from '@/components/count/CountSetup';
import CameraScanner from '@/components/count/CameraScanner';
import SessionSummary from '@/components/count/SessionSummary';
import { EnhancedTableWithPreferences } from '@/components/ui/enhanced-table';
import { TableColumn } from '@/components/ui/enhanced-table/types';
import type { Database } from '@/integrations/supabase/types';

type SessionStatus = Database['public']['Enums']['session_status_enum'];

function StockStatusBadge({ stock }: { stock: number | null }) {
  const s = stock ?? 0;
  if (s <= 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">✗ Out</span>;
  if (s < 5) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">⚠ Low</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">✓ In Stock</span>;
}

function TypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="outline" className="text-[10px] font-semibold">{type}</Badge>;
}

function InventoryTab({ isManager }: { isManager: boolean }) {
  const navigate = useNavigate();
  const { data: stores = [] } = useStores();
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
  });

  const totalStock = useMemo(() => products.reduce((s, p) => s + (Number(p.total_stock ?? p.current_stock) || 0), 0), [products]);

  // Quick filter
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const quickCounts = useMemo(() => ({
    outOfStock: products.filter(p => (p.total_stock ?? p.current_stock ?? 0) <= 0).length,
    lowStock: products.filter(p => (p.total_stock ?? p.current_stock ?? 0) > 0 && (p.total_stock ?? p.current_stock ?? 0) < 5).length,
    inStock: products.filter(p => (p.total_stock ?? p.current_stock ?? 0) >= 5).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (quickFilter === 'outOfStock') result = result.filter(p => (p.total_stock ?? p.current_stock ?? 0) <= 0);
    if (quickFilter === 'lowStock') result = result.filter(p => (p.total_stock ?? p.current_stock ?? 0) > 0 && (p.total_stock ?? p.current_stock ?? 0) < 5);
    if (quickFilter === 'inStock') result = result.filter(p => (p.total_stock ?? p.current_stock ?? 0) >= 5);
    
    // Filter by warehouse if selected
    if (selectedWarehouse && selectedWarehouse !== 'all') {
      result = result.filter(p => {
        const hasStockInWarehouse = p.store_names?.includes(stores.find(s => s.id === selectedWarehouse)?.name || '');
        return hasStockInWarehouse;
      });
    }
    
    return result;
  }, [products, quickFilter, selectedWarehouse, stores]);

  const tableColumns: TableColumn<Product>[] = useMemo(() => [
    { 
      id: 'name', title: 'Product', dataIndex: 'name', 
      width: 250, visible: true, sortable: true, filterable: true,
      render: (val, p) => <span className="font-medium">{p.name}</span>
    },
    { 
      id: 'sku', title: 'SKU', dataIndex: 'sku', 
      width: 120, visible: true, sortable: true, filterable: true,
      render: (val) => <span className="text-xs text-muted-foreground font-mono">{val || '—'}</span>
    },
    { 
      id: 'code', title: 'Code', dataIndex: 'code', 
      width: 100, visible: false, sortable: true, filterable: true,
      render: (val) => <span className="text-xs text-muted-foreground">{val || '—'}</span>
    },
    { 
      id: 'category', title: 'Category', dataIndex: 'categories', 
      width: 150, visible: true, sortable: true, filterable: true,
      render: (val, p) => <span className="text-muted-foreground">{(p as any).categories?.name || '—'}</span>
    },
    { 
      id: 'type', title: 'Type', dataIndex: 'product_type', 
      width: 100, visible: true, sortable: true, filterable: true,
      render: (val) => <TypeBadge type={val} />
    },
    { 
      id: 'stock', title: 'Stock', dataIndex: 'current_stock', 
      width: 100, visible: true, sortable: true, filterable: false, align: 'right',
      render: (val, p) => isManager ? (
        <span className="font-semibold tabular-nums">{p.total_stock ?? p.current_stock ?? 0}</span>
      ) : (
        <StockStatusBadge stock={p.total_stock ?? p.current_stock} />
      )
    },
    ...(isManager ? [
      { 
        id: 'sale_price', title: 'Sale Price', dataIndex: 'sale_price', 
        width: 100, visible: true, sortable: true, filterable: false, align: 'right' as const,
        render: (val: number | null) => <span className="text-accent font-medium">{val?.toFixed(2) ?? '—'}</span>
      },
      { 
        id: 'purchase_price', title: 'Purchase Price', dataIndex: 'purchase_price', 
        width: 120, visible: false, sortable: true, filterable: false, align: 'right' as const,
        render: (val: number | null) => <span className="text-muted-foreground">{val?.toFixed(2) ?? '—'}</span>
      }
    ] : []),
    { 
      id: 'synced', title: 'Last Synced', dataIndex: 'synced_at', 
      width: 120, visible: false, sortable: true, filterable: false,
      render: (val: string | null) => <span className="text-xs text-muted-foreground">{val ? new Date(val).toLocaleDateString() : '—'}</span>
    }
  ], [isManager]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <span>{filteredProducts.length} products</span>
        {isManager && (
          <>
            <span className="text-border">•</span>
            <span>{totalStock} total stock</span>
          </>
        )}
      </div>

      {/* Quick Filters */}
      <div className="quick-filter-bar">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick:</span>
        <button onClick={() => setQuickFilter(quickFilter === 'outOfStock' ? null : 'outOfStock')} className={`quick-filter-pill ${quickFilter === 'outOfStock' ? 'active' : ''}`}>
          <Ban className="w-3 h-3" /> Out of Stock <span className="text-[10px] opacity-70">({quickCounts.outOfStock})</span>
        </button>
        <button onClick={() => setQuickFilter(quickFilter === 'lowStock' ? null : 'lowStock')} className={`quick-filter-pill ${quickFilter === 'lowStock' ? 'active' : ''}`}>
          <AlertTriangle className="w-3 h-3" /> Low Stock <span className="text-[10px] opacity-70">({quickCounts.lowStock})</span>
        </button>
        <button onClick={() => setQuickFilter(quickFilter === 'inStock' ? null : 'inStock')} className={`quick-filter-pill ${quickFilter === 'inStock' ? 'active' : ''}`}>
          <CheckCircle2 className="w-3 h-3" /> In Stock <span className="text-[10px] opacity-70">({quickCounts.inStock})</span>
        </button>
        {quickFilter && (
          <button onClick={() => setQuickFilter(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        {stores.length > 0 && (
          <Select value={selectedWarehouse || 'all'} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="w-[180px] h-10 bg-card border-border">
              <SelectValue placeholder="All Warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Warehouses</SelectItem>
              {stores.map(store => (
                <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <EnhancedTableWithPreferences
          tableName="current_stock"
          data={filteredProducts}
          columns={tableColumns}
          loading={isLoading}
          rowKey="id"
          onRowClick={(p) => navigate(`/products/${p.id}`)}
          virtualized={true}
          height={600}
          className="border-none"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Check Review Tab
// ═══════════════════════════════════════════════

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    draft: { cls: 'bg-secondary text-secondary-foreground border border-border', icon: Clock, label: 'Draft' },
    in_progress: { cls: 'bg-primary/15 text-primary border border-primary/30', icon: Play, label: 'In Progress' },
    completed: { cls: 'bg-amber-500/15 text-amber-600 border border-amber-500/30', icon: AlertTriangle, label: 'Pending Review' },
    paused: { cls: 'bg-secondary text-secondary-foreground border border-border', icon: Clock, label: 'Paused' },
    approved: { cls: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30', icon: CheckCircle2, label: 'Approved' },
    flagged: { cls: 'bg-destructive/15 text-destructive border border-destructive/30', icon: XCircle, label: 'Flagged' },
  };
  const c = cfg[status] || cfg.draft;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${c.cls}`}><c.icon className="w-3 h-3" />{c.label}</span>;
}

function VarianceBadge({ variance }: { variance: number }) {
  if (variance === 0) return <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">Match</span>;
  if (Math.abs(variance) <= 2) return <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">{variance > 0 ? '+' : ''}{variance}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-destructive/15 text-destructive border border-destructive/30">{variance > 0 ? '+' : ''}{variance}</span>;
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
    <div className="modern-tabs">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="m-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {userIds.length > 1 && <TabsTrigger value="by-user"><Users className="w-3.5 h-3.5 mr-1" />By User</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
            <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
              <p className="text-lg font-bold">{diffRows.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Products</p>
            </div>
            {canSeeStock && (
              <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
                <p className="text-lg font-bold">{totalExpected}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Expected</p>
              </div>
            )}
            <div className="rounded-lg bg-muted/30 border border-border p-3 text-center">
              <p className="text-lg font-bold">{totalCounted}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Counted</p>
            </div>
            {canSeeStock && (
              <div className={`rounded-lg border p-3 text-center ${totalVariance === 0 ? 'bg-emerald-500/10 border-emerald-500/30' : Math.abs(totalVariance) <= 5 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                <p className="text-lg font-bold">{totalVariance > 0 ? '+' : ''}{totalVariance}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{varianceItems} variances</p>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b-2 border-border bg-muted/30">
                  <th className="text-left p-3 font-semibold text-[11px] uppercase tracking-wider">Product</th>
                  {canSeeStock && <th className="text-center p-3 font-semibold text-[11px] uppercase tracking-wider">Expected</th>}
                  <th className="text-center p-3 font-semibold text-[11px] uppercase tracking-wider">Counted</th>
                  {canSeeStock && <th className="text-center p-3 font-semibold text-[11px] uppercase tracking-wider">Variance</th>}
                  <th className="text-center p-3 font-semibold text-[11px] uppercase tracking-wider">Events</th>
                </tr>
              </thead>
              <tbody>
                {diffRows.map((row, idx) => (
                  <tr key={row.product_id} className={`border-b border-border/30 hover:bg-primary/5 transition-colors ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}>
                    <td className="p-3 font-medium text-xs max-w-[200px] truncate">{row.product_name}</td>
                    {canSeeStock && <td className="p-3 text-center text-muted-foreground tabular-nums">{row.expected_qty}</td>}
                    <td className="p-3 text-center font-semibold tabular-nums">{row.counted_qty}</td>
                    {canSeeStock && <td className="p-3 text-center"><VarianceBadge variance={row.variance_qty} /></td>}
                    <td className="p-3 text-center text-muted-foreground text-xs tabular-nums">{row.event_count}</td>
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
                  <div key={uid} className="rounded-lg border border-border overflow-hidden">
                    <div className="p-3 bg-muted/30 flex items-center justify-between border-b border-border">
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
                        <thead><tr className="text-muted-foreground border-b border-border/50 bg-muted/20"><th className="text-left p-2 pl-3 font-semibold text-[10px] uppercase tracking-wider">Product</th><th className="text-center p-2 font-semibold text-[10px] uppercase tracking-wider">Qty</th><th className="text-center p-2 font-semibold text-[10px] uppercase tracking-wider">Scans</th></tr></thead>
                        <tbody>
                          {Array.from(userItems.entries()).map(([pid, v], idx) => (
                            <tr key={pid} className={`border-b border-border/20 ${idx % 2 === 1 ? 'bg-muted/10' : ''}`}>
                              <td className="p-2 pl-3 text-xs truncate max-w-[180px]">{productNames[pid] || pid.slice(0, 8)}</td>
                              <td className="p-2 text-center font-semibold text-xs tabular-nums">{v.qty}</td>
                              <td className="p-2 text-center text-muted-foreground text-xs tabular-nums">{v.count}</td>
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
    </div>
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

  // Quick filters
  const quickCounts = useMemo(() => ({
    all: sessions.length,
    completed: pendingCount,
    approved: approvedCount,
    flagged: flaggedCount,
    in_progress: sessions.filter(s => s.status === 'in_progress').length,
  }), [sessions, pendingCount, approvedCount, flaggedCount]);

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
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pending</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{approvedCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Approved</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{flaggedCount}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Flagged</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filter-bar">
        <button onClick={() => setStatusFilter('all')} className={`quick-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}>
          All <span className="text-[10px] opacity-70">({quickCounts.all})</span>
        </button>
        <button onClick={() => setStatusFilter('completed')} className={`quick-filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}>
          <AlertTriangle className="w-3 h-3" /> Pending <span className="text-[10px] opacity-70">({quickCounts.completed})</span>
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`quick-filter-pill ${statusFilter === 'approved' ? 'active' : ''}`}>
          <CheckCircle2 className="w-3 h-3" /> Approved <span className="text-[10px] opacity-70">({quickCounts.approved})</span>
        </button>
        <button onClick={() => setStatusFilter('flagged')} className={`quick-filter-pill ${statusFilter === 'flagged' ? 'active' : ''}`}>
          <XCircle className="w-3 h-3" /> Flagged <span className="text-[10px] opacity-70">({quickCounts.flagged})</span>
        </button>
        <button onClick={() => setStatusFilter('in_progress')} className={`quick-filter-pill ${statusFilter === 'in_progress' ? 'active' : ''}`}>
          <Play className="w-3 h-3" /> Active <span className="text-[10px] opacity-70">({quickCounts.in_progress})</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
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
              <div key={session.id} className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-all">
                <button className="w-full p-4 text-left flex items-center gap-4" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-heading font-semibold">{session.session_name}</p>
                      <SessionStatusBadge status={session.status} />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{session.session_type || 'full'}</span>
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
                      <div className="p-4 border-t border-border space-y-3">
                        {flagDialogSession === session.id ? (
                          <div className="space-y-2">
                            <Textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder="Reason for flagging..." className="bg-muted/30 border-border text-sm" rows={2} />
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
                      <div className="p-3 border-t border-emerald-500/30 bg-emerald-500/5">
                        <p className="text-xs text-muted-foreground">Approval Notes: {session.approval_notes}</p>
                      </div>
                    )}
                    {session.status === 'flagged' && session.flagged_reason && (
                      <div className="p-3 border-t border-destructive/30 bg-destructive/5">
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
// Start Count Tab
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
// Main Page
// ═══════════════════════════════════════════════

export default function CurrentStock() {
  const role = useUserRole();
  const isManager = role?.id === 'admin' || role?.id === 'super_admin';

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventarisation Check</h1>
        <p className="text-muted-foreground mt-1">Manage inventory counts, review sessions, and track stock</p>
      </div>

      <div className="modern-tabs">
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
    </div>
  );
}
