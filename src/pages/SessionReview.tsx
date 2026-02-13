import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useInventorySessions, useSessionItems, useApproveSession, useFlagSession } from '@/hooks/useInventorySessions';
import { Navigate } from 'react-router-dom';
import { Search, Filter, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronUp, ThumbsUp, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { InventorySession } from '@/hooks/useInventorySessions';
import type { Database } from '@/integrations/supabase/types';

type SessionStatus = Database['public']['Enums']['session_status_enum'];

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

function SessionItemsTable({ sessionId }: { sessionId: string }) {
  const { data: items = [], isLoading } = useSessionItems(sessionId);
  if (isLoading) return <p className="p-4 text-sm text-muted-foreground text-center">Loading items…</p>;
  if (items.length === 0) return <p className="p-4 text-sm text-muted-foreground text-center">No items recorded yet</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground border-b border-border/50">
            <th className="text-left p-3 font-medium">Wine ID</th>
            <th className="text-center p-3 font-medium">Unopened</th>
            <th className="text-center p-3 font-medium">Opened</th>
            <th className="text-left p-3 font-medium">Method</th>
            <th className="text-left p-3 font-medium">Time</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} className="border-b border-border/30">
              <td className="p-3 font-medium font-mono text-xs">{item.wine_id.slice(0, 8)}…</td>
              <td className="p-3 text-center font-semibold">{item.counted_quantity_unopened ?? '—'}</td>
              <td className="p-3 text-center text-muted-foreground">{item.counted_quantity_opened ?? '—'}</td>
              <td className="p-3 capitalize text-muted-foreground">{item.counting_method?.replace('_', ' ') || '—'}</td>
              <td className="p-3 text-muted-foreground text-xs">{item.counted_at ? new Date(item.counted_at).toLocaleTimeString() : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SessionReview() {
  const { user } = useAuthStore();
  const { data: sessions = [], isLoading } = useInventorySessions();
  const approveSession = useApproveSession();
  const flagSession = useFlagSession();
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [flagDialogSession, setFlagDialogSession] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.session_type !== typeFilter) return false;
      if (search && !s.session_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, statusFilter, typeFilter, search]);

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

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
        <p className="text-muted-foreground mt-1">Review, approve, and flag completed inventory sessions</p>
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
                    <SessionItemsTable sessionId={session.id} />

                    {session.status === 'completed' && (
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
