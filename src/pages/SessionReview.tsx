import { useState, useMemo } from 'react';
import { mockSessions, mockInventoryItems, InventorySession, SessionStatus } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Search, Filter, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronUp, ThumbsUp, Flag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

function VarianceCell({ variance }: { variance: number }) {
  if (variance === 0) return <span className="text-[hsl(var(--wine-success))]">0</span>;
  const cls = Math.abs(variance) <= 1
    ? 'text-[hsl(var(--wine-warning))] bg-[hsl(var(--wine-warning)/0.1)]'
    : 'text-destructive bg-destructive/10';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{variance > 0 ? '+' : ''}{variance}</span>;
}

function VarianceRowBg(totalVariance: number): string {
  if (totalVariance === 0) return '';
  if (Math.abs(totalVariance) <= 1) return 'bg-[hsl(var(--wine-warning)/0.05)]';
  return 'bg-destructive/5';
}

export default function SessionReview() {
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const sessions = useMemo(() => {
    return mockSessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !s.sessionName.toLowerCase().includes(search.toLowerCase()) && !s.createdByName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, search]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleApprove = (sessionId: string) => {
    toast.success(`Session ${sessionId} approved`);
  };

  const handleFlag = (sessionId: string) => {
    toast.warning(`Session ${sessionId} flagged for review`);
  };

  const formatDuration = (seconds?: number) => {
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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search session or user..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
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
      </div>

      <div className="space-y-3">
        {sessions.map(session => {
          const items = mockInventoryItems.filter(i => i.sessionId === session.id);
          const varianceItems = items.filter(i => i.hasVariance);
          const isExpanded = expandedSession === session.id;

          return (
            <div key={session.id} className="wine-glass-effect rounded-xl overflow-hidden">
              {/* Session Header */}
              <button
                className="w-full p-4 text-left flex items-center gap-4"
                onClick={() => setExpandedSession(isExpanded ? null : session.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-heading font-semibold">{session.sessionName}</p>
                    <StatusBadge status={session.status} />
                    <span className="wine-badge bg-secondary text-secondary-foreground capitalize">{session.sessionType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>By: {session.createdByName}</span>
                    <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                    <span>Duration: {formatDuration(session.duration)}</span>
                    <span>{session.totalWinesCounted}/{session.totalWinesExpected} wines</span>
                    {varianceItems.length > 0 && (
                      <span className="text-destructive font-medium">{varianceItems.length} variance{varianceItems.length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>

              {/* Expanded items */}
              {isExpanded && (
                <div className="border-t border-border">
                  {items.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">No items recorded yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border/50">
                            <th className="text-left p-3 font-medium">Wine</th>
                            <th className="text-center p-3 font-medium">Expected</th>
                            <th className="text-center p-3 font-medium">Counted</th>
                            <th className="text-center p-3 font-medium">Variance</th>
                            <th className="text-left p-3 font-medium">Method</th>
                            <th className="text-left p-3 font-medium">By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map(item => (
                            <tr key={item.id} className={`border-b border-border/30 ${VarianceRowBg(item.totalVariance)}`}>
                              <td className="p-3 font-medium">{item.wineName}</td>
                              <td className="p-3 text-center text-muted-foreground">{item.expectedUnopened + item.expectedOpened}</td>
                              <td className="p-3 text-center font-semibold">{item.countedUnopened + item.countedOpened}</td>
                              <td className="p-3 text-center"><VarianceCell variance={item.totalVariance} /></td>
                              <td className="p-3 capitalize text-muted-foreground">{item.countingMethod.replace('_', ' ')}</td>
                              <td className="p-3 text-muted-foreground">{item.countedByName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Approve/Flag actions for completed sessions */}
                  {session.status === 'completed' && (
                    <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50">
                      <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => handleFlag(session.id)}>
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
          );
        })}

        {sessions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sessions match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
