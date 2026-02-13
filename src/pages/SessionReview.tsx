import { useState, useMemo } from 'react';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import { useInventorySessions, useApproveSession, useFlagSession } from '@/hooks/useInventorySessions';
import { useBaselineItems, useProductAggregates, useCountEvents } from '@/hooks/useInventoryEvents';
import { Navigate } from 'react-router-dom';
import {
  Search, Filter, CheckCircle2, Clock, AlertTriangle, XCircle,
  ChevronDown, ChevronUp, ThumbsUp, Flag, Users, Edit2, Save, X, Send
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { InventorySession } from '@/hooks/useInventorySessions';
import type { Database } from '@/integrations/supabase/types';

type SessionStatus = Database['public']['Enums']['session_status_enum'];

// ─── Helpers ───

function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    draft: { cls: 'bg-secondary text-secondary-foreground', icon: Clock, label: 'Draft' },
    in_progress: { cls: 'bg-primary/15 text-primary', icon: Clock, label: 'In Progress' },
    completed: { cls: 'bg-wine-warning/15 text-wine-warning', icon: AlertTriangle, label: 'Pending Review' },
    paused: { cls: 'bg-secondary text-secondary-foreground', icon: Clock, label: 'Paused' },
    approved: { cls: 'stock-healthy', icon: CheckCircle2, label: 'Approved' },
    flagged: { cls: 'stock-out', icon: XCircle, label: 'Flagged' },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className={`wine-badge ${c.cls}`}>
      <c.icon className="w-3 h-3 mr-1" />
      {c.label}
    </span>
  );
}

function VarianceBadge({ variance }: { variance: number }) {
  if (variance === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--wine-success))]/15 text-[hsl(var(--wine-success))]">Match</span>;
  if (Math.abs(variance) <= 2) return <span className="text-xs px-2 py-0.5 rounded-full bg-wine-warning/15 text-wine-warning">{variance > 0 ? '+' : ''}{variance}</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">{variance > 0 ? '+' : ''}{variance}</span>;
}

// ─── Diff Table ───

interface DiffRow {
  product_id: string;
  wine_name: string;
  expected_qty: number;
  expected_liters: number;
  counted_qty: number;
  counted_liters: number;
  variance_qty: number;
  variance_liters: number;
  event_count: number;
}

function useWineNames(productIds: string[]) {
  return useQuery({
    queryKey: ['wine_names_for_review', productIds.sort().join(',')],
    queryFn: async () => {
      if (productIds.length === 0) return {};
      const { data } = await supabase
        .from('wines')
        .select('id, name, producer, vintage, volume_ml')
        .in('id', productIds);
      const map: Record<string, string> = {};
      (data || []).forEach(w => {
        const parts = [w.name];
        if (w.vintage) parts.push(String(w.vintage));
        if (w.volume_ml) parts.push(`${w.volume_ml}ml`);
        map[w.id] = parts.join(' · ');
      });
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

  const { data: wineNames = {} } = useWineNames(allProductIds);

  // Per-user breakdown
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
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name')
        .in('id', userIds);
      const map: Record<string, string> = {};
      (data || []).forEach(p => {
        map[p.id] = p.display_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || p.id.slice(0, 8);
      });
      return map;
    },
    enabled: userIds.length > 0,
  });

  const diffRows: DiffRow[] = useMemo(() => {
    const baselineMap = new Map(baseline.map(b => [b.product_id, b]));
    const aggregateMap = new Map(aggregates.map(a => [a.product_id, a]));

    return allProductIds.map(pid => {
      const b = baselineMap.get(pid);
      const a = aggregateMap.get(pid);
      const expectedQty = Number(b?.expected_qty) || 0;
      const expectedLiters = Number(b?.expected_liters) || 0;
      const countedQty = Number(a?.counted_qty_total) || 0;
      const countedLiters = Number(a?.counted_liters_total) || 0;
      return {
        product_id: pid,
        wine_name: wineNames[pid] || pid.slice(0, 8) + '…',
        expected_qty: expectedQty,
        expected_liters: expectedLiters,
        counted_qty: countedQty,
        counted_liters: countedLiters,
        variance_qty: countedQty - expectedQty,
        variance_liters: Math.round((countedLiters - expectedLiters) * 100) / 100,
        event_count: Number(a?.event_count) || 0,
      };
    }).sort((a, b) => Math.abs(b.variance_qty) - Math.abs(a.variance_qty));
  }, [allProductIds, baseline, aggregates, wineNames]);

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
        {/* Summary row */}
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

        {/* Diff table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground border-b border-border/50">
                <th className="text-left p-3 font-medium">Wine</th>
                {canSeeStock && <th className="text-center p-3 font-medium">Expected</th>}
                <th className="text-center p-3 font-medium">Counted</th>
                {canSeeStock && <th className="text-center p-3 font-medium">Variance</th>}
                <th className="text-center p-3 font-medium">Events</th>
              </tr>
            </thead>
            <tbody>
              {diffRows.map(row => (
                <tr key={row.product_id} className="border-b border-border/30 hover:bg-secondary/30">
                  <td className="p-3 font-medium text-xs max-w-[200px] truncate">{row.wine_name}</td>
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
              const userProducts = userItems.size;
              return (
                <div key={uid} className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="p-3 bg-secondary/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-sm">{userName}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{userProducts} products</span>
                      <span>{userTotal} bottles</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border/30">
                          <th className="text-left p-2 pl-3 font-medium text-xs">Wine</th>
                          <th className="text-center p-2 font-medium text-xs">Qty</th>
                          <th className="text-center p-2 font-medium text-xs">Litres</th>
                          <th className="text-center p-2 font-medium text-xs">Scans</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(userItems.entries()).map(([pid, v]) => (
                          <tr key={pid} className="border-b border-border/20">
                            <td className="p-2 pl-3 text-xs truncate max-w-[180px]">{wineNames[pid] || pid.slice(0, 8)}</td>
                            <td className="p-2 text-center font-semibold text-xs">{v.qty}</td>
                            <td className="p-2 text-center text-muted-foreground text-xs">{v.liters.toFixed(2)}</td>
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

// ─── Main Page ───

export default function SessionReview() {
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

  // Only managers+ can see expected stock and variances
  const isManager = role?.id === 'admin' || role?.id === 'super_admin';

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.session_type !== typeFilter) return false;
      if (search && !s.session_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, statusFilter, typeFilter, search]);

  // Staff can view sessions but not approve/flag — page accessible to all authenticated
  const canApprove = isManager;

  const pendingCount = sessions.filter(s => s.status === 'completed').length;
  const approvedCount = sessions.filter(s => s.status === 'approved').length;
  const flaggedCount = sessions.filter(s => s.status === 'flagged').length;

  const handleApprove = async (sessionId: string) => {
    try {
      await approveSession.mutateAsync({ id: sessionId, approvedBy: user!.id });
      toast.success('Session approved');
    } catch (e: any) {
      toast.error('Failed to approve: ' + e.message);
    }
  };

  const handleFlag = async (sessionId: string) => {
    if (!flagReason.trim()) { toast.error('Please enter a reason'); return; }
    try {
      await flagSession.mutateAsync({ id: sessionId, reason: flagReason });
      setFlagDialogSession(null);
      setFlagReason('');
      toast.warning('Session flagged for review');
    } catch (e: any) {
      toast.error('Failed to flag: ' + e.message);
    }
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory Sessions</h1>
        <p className="text-muted-foreground mt-1">
          {isManager ? 'Review, approve, and flag completed inventory sessions' : 'View inventory session progress'}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{sessions.length}</p>
          <p className="text-xs text-muted-foreground">Total Sessions</p>
        </div>
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-wine-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending Review</p>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] h-11 bg-card border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
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
                      <StatusBadge status={session.status} />
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

                    {/* Approve / Flag actions — only for managers on completed sessions */}
                    {canApprove && session.status === 'completed' && (
                      <div className="p-4 border-t border-border/50 space-y-3">
                        {flagDialogSession === session.id ? (
                          <div className="space-y-2">
                            <Textarea value={flagReason} onChange={e => setFlagReason(e.target.value)} placeholder="Reason for flagging..." className="bg-secondary border-border text-sm" rows={2} />
                            <div className="flex gap-2 justify-end">
                              <Button variant="ghost" size="sm" onClick={() => setFlagDialogSession(null)}>Cancel</Button>
                              <Button variant="destructive" size="sm" onClick={() => handleFlag(session.id)}>
                                <Flag className="w-3.5 h-3.5 mr-1" /> Confirm Flag
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setFlagDialogSession(session.id)}>
                              <Flag className="w-4 h-4 mr-1" /> Flag Issue
                            </Button>
                            <Button size="sm" className="wine-gradient text-primary-foreground hover:opacity-90" onClick={() => handleApprove(session.id)}>
                              <ThumbsUp className="w-4 h-4 mr-1" /> Approve
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Approved session info */}
                    {session.status === 'approved' && session.approval_notes && (
                      <div className="p-3 border-t border-border/50 bg-[hsl(var(--wine-success))]/5">
                        <p className="text-xs text-muted-foreground">Approval Notes: {session.approval_notes}</p>
                      </div>
                    )}

                    {/* Flagged session info */}
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
