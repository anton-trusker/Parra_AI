import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useInventorySessions } from '@/hooks/useInventorySessions';
import { Search, Clock, CheckCircle2, AlertTriangle, XCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
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

export default function InventoryHistory() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: sessions = [], isLoading } = useInventorySessions();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !s.session_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, search, statusFilter]);

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory History</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} sessions</p>
      </div>

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
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Session</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Duration</th>
                  <th className="text-center p-4 font-medium">Counted</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors cursor-pointer" onClick={() => navigate('/sessions')}>
                    <td className="p-4 font-medium">{s.session_name}</td>
                    <td className="p-4"><span className="wine-badge bg-secondary text-secondary-foreground capitalize">{(s.session_type || 'full').replace('_', ' ')}</span></td>
                    <td className="p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}</td>
                    <td className="p-4 text-muted-foreground">{formatDuration(s.duration_seconds)}</td>
                    <td className="p-4 text-center">{s.total_wines_counted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {filtered.map(s => (
              <div key={s.id} className="wine-glass-effect rounded-xl p-4 cursor-pointer" onClick={() => navigate('/sessions')}>
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
