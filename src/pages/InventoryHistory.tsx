import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useInventorySessions } from '@/hooks/useInventorySessions';
import { useStores } from '@/hooks/useStores';
import { Search, Clock, CheckCircle2, AlertTriangle, XCircle, Warehouse, Play, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type SessionStatus = Database['public']['Enums']['session_status_enum'];

function StatusBadge({ status }: { status: SessionStatus }) {
  const cfg: Record<string, { cls: string; icon: any; label: string }> = {
    draft: { cls: 'bg-secondary text-secondary-foreground border border-border', icon: Clock, label: 'Draft' },
    in_progress: { cls: 'bg-primary/15 text-primary border border-primary/30', icon: Play, label: 'In Progress' },
    completed: { cls: 'bg-amber-500/15 text-amber-600 border border-amber-500/30', icon: AlertTriangle, label: 'Pending Review' },
    paused: { cls: 'bg-secondary text-secondary-foreground border border-border', icon: Clock, label: 'Paused' },
    approved: { cls: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/30', icon: CheckCircle2, label: 'Approved' },
    flagged: { cls: 'bg-destructive/15 text-destructive border border-destructive/30', icon: XCircle, label: 'Flagged' },
  };
  const c = cfg[status] || cfg.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${c.cls}`}>
      <c.icon className="w-3 h-3" />
      {c.label}
    </span>
  );
}

export default function InventoryHistory() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useInventorySessions();
  const { data: stores = [] } = useStores();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !s.session_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, search, statusFilter]);

  const quickCounts = useMemo(() => ({
    all: sessions.length,
    in_progress: sessions.filter(s => s.status === 'in_progress').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    approved: sessions.filter(s => s.status === 'approved').length,
    flagged: sessions.filter(s => s.status === 'flagged').length,
  }), [sessions]);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory History</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} sessions</p>
      </div>

      {/* Quick Status Filters */}
      <div className="quick-filter-bar">
        <button onClick={() => setStatusFilter('all')} className={`quick-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}>
          All <span className="text-[10px] opacity-70">({quickCounts.all})</span>
        </button>
        <button onClick={() => setStatusFilter('in_progress')} className={`quick-filter-pill ${statusFilter === 'in_progress' ? 'active' : ''}`}>
          <Play className="w-3 h-3" /> In Progress <span className="text-[10px] opacity-70">({quickCounts.in_progress})</span>
        </button>
        <button onClick={() => setStatusFilter('completed')} className={`quick-filter-pill ${statusFilter === 'completed' ? 'active' : ''}`}>
          <AlertTriangle className="w-3 h-3" /> Review <span className="text-[10px] opacity-70">({quickCounts.completed})</span>
        </button>
        <button onClick={() => setStatusFilter('approved')} className={`quick-filter-pill ${statusFilter === 'approved' ? 'active' : ''}`}>
          <CheckCircle2 className="w-3 h-3" /> Approved <span className="text-[10px] opacity-70">({quickCounts.approved})</span>
        </button>
        <button onClick={() => setStatusFilter('flagged')} className={`quick-filter-pill ${statusFilter === 'flagged' ? 'active' : ''}`}>
          <XCircle className="w-3 h-3" /> Flagged <span className="text-[10px] opacity-70">({quickCounts.flagged})</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-border bg-muted/40">
                  <th className="text-left p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Session</th>
                  <th className="text-left p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="text-left p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Duration</th>
                  <th className="text-center p-4 font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">Counted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, idx) => (
                  <tr key={s.id} className={`border-b border-border/40 hover:bg-primary/5 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-muted/10' : ''}`} onClick={() => navigate('/sessions')}>
                    <td className="p-4 font-medium">{s.session_name}</td>
                    <td className="p-4"><Badge variant="outline" className="text-[10px] font-semibold capitalize">{(s.session_type || 'full').replace('_', ' ')}</Badge></td>
                    <td className="p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap text-xs">{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-muted-foreground text-xs">{formatDuration(s.duration_seconds)}</td>
                    <td className="p-4 text-center font-semibold">{s.total_wines_counted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(s => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate('/sessions')}>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-heading font-semibold">{s.session_name}</p>
                  <StatusBadge status={s.status} />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="capitalize">{(s.session_type || 'full').replace('_', ' ')}</span>
                  <span>{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</span>
                  <span>{s.total_wines_counted} counted</span>
                  <span>{formatDuration(s.duration_seconds)}</span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No sessions found</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}