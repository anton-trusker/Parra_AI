import { useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSessionStore, AuditEntry } from '@/stores/sessionStore';
import { useColumnStore } from '@/stores/columnStore';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import { Navigate } from 'react-router-dom';
import { Search, Filter, CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown, ChevronUp, ThumbsUp, Flag, CalendarDays, History } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import type { SessionStatus } from '@/data/mockWines';

const SESSION_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Session Name' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'date', label: 'Date' },
  { key: 'duration', label: 'Duration' },
  { key: 'progress', label: 'Progress' },
  { key: 'variances', label: 'Variances' },
];

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
  const { sessions, items, auditLog, approveSession, flagSession } = useSessionStore();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const { sessionColumns, setSessionColumns } = useColumnStore();
  const [flagDialogSession, setFlagDialogSession] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [createdByFilter, setCreatedByFilter] = useState('all');

  const uniqueUsers = useMemo(() => [...new Set(sessions.map(s => s.createdByName))], [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.sessionType !== typeFilter) return false;
      if (createdByFilter !== 'all' && s.createdByName !== createdByFilter) return false;
      if (search && !s.sessionName.toLowerCase().includes(search.toLowerCase()) && !s.createdByName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [sessions, statusFilter, typeFilter, createdByFilter, search]);

  if (user?.roleId !== 'role_admin') return <Navigate to="/dashboard" replace />;

  // Summary stats
  const totalSessions = sessions.length;
  const pendingCount = sessions.filter(s => s.status === 'completed').length;
  const approvedCount = sessions.filter(s => s.status === 'approved').length;
  const flaggedCount = sessions.filter(s => s.status === 'flagged').length;

  const handleApprove = (sessionId: string) => {
    approveSession(sessionId, approveNotes, user!.id, user!.name);
    setApproveNotes('');
    toast.success('Session approved and recorded in audit trail');
  };

  const handleFlag = (sessionId: string) => {
    if (!flagReason.trim()) { toast.error('Please enter a reason'); return; }
    flagSession(sessionId, flagReason, user!.id, user!.name);
    setFlagDialogSession(null);
    setFlagReason('');
    toast.warning('Session flagged for review');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const sessionAudit = (sessionId: string) => auditLog.filter(a => a.sessionId === sessionId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory Sessions</h1>
        <p className="text-muted-foreground mt-1">Review, approve, and flag completed inventory sessions</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="wine-glass-effect rounded-xl p-4 text-center">
          <p className="text-2xl font-bold">{totalSessions}</p>
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
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="full">Full Count</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="spot_check">Spot Check</SelectItem>
          </SelectContent>
        </Select>
        <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
            <SelectValue placeholder="Created By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <ColumnManager columns={SESSION_COLUMNS} visibleColumns={sessionColumns} onChange={setSessionColumns} />
      </div>

      {/* Sessions table */}
      <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {sessionColumns.includes('name') && <th className="text-left p-4 font-medium">Session</th>}
                {sessionColumns.includes('type') && <th className="text-left p-4 font-medium">Type</th>}
                {sessionColumns.includes('status') && <th className="text-left p-4 font-medium">Status</th>}
                {sessionColumns.includes('createdBy') && <th className="text-left p-4 font-medium">Created By</th>}
                {sessionColumns.includes('date') && <th className="text-left p-4 font-medium">Date</th>}
                {sessionColumns.includes('duration') && <th className="text-left p-4 font-medium">Duration</th>}
                {sessionColumns.includes('progress') && <th className="text-center p-4 font-medium">Progress</th>}
                {sessionColumns.includes('variances') && <th className="text-center p-4 font-medium">Variances</th>}
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map(session => {
                const sessionItems = items.filter(i => i.sessionId === session.id);
                const varianceItems = sessionItems.filter(i => i.hasVariance);
                return (
                  <tr key={session.id} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors cursor-pointer" onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                    {sessionColumns.includes('name') && <td className="p-4 font-medium">{session.sessionName}</td>}
                    {sessionColumns.includes('type') && <td className="p-4"><span className="wine-badge bg-secondary text-secondary-foreground capitalize">{session.sessionType.replace('_', ' ')}</span></td>}
                    {sessionColumns.includes('status') && <td className="p-4"><StatusBadge status={session.status} /></td>}
                    {sessionColumns.includes('createdBy') && <td className="p-4 text-muted-foreground">{session.createdByName}</td>}
                    {sessionColumns.includes('date') && <td className="p-4 text-muted-foreground whitespace-nowrap">{new Date(session.startedAt).toLocaleDateString()}</td>}
                    {sessionColumns.includes('duration') && <td className="p-4 text-muted-foreground">{formatDuration(session.duration)}</td>}
                    {sessionColumns.includes('progress') && <td className="p-4 text-center">{session.totalWinesCounted}/{session.totalWinesExpected}</td>}
                    {sessionColumns.includes('variances') && <td className="p-4 text-center">{varianceItems.length > 0 ? <span className="text-destructive font-medium">{varianceItems.length}</span> : <span className="text-[hsl(var(--wine-success))]">0</span>}</td>}
                    <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                      {session.status === 'completed' && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-8" onClick={() => setFlagDialogSession(session.id)}>
                            <Flag className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" className="wine-gradient text-primary-foreground h-8" onClick={() => handleApprove(session.id)}>
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {filteredSessions.map(session => {
          const sessionItems = items.filter(i => i.sessionId === session.id);
          const varianceItems = sessionItems.filter(i => i.hasVariance);
          const isExpanded = expandedSession === session.id;
          return (
            <div key={session.id} className="wine-glass-effect rounded-xl overflow-hidden">
              <button className="w-full p-4 text-left flex items-center gap-4" onClick={() => setExpandedSession(isExpanded ? null : session.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-heading font-semibold">{session.sessionName}</p>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>By: {session.createdByName}</span>
                    <span>{new Date(session.startedAt).toLocaleDateString()}</span>
                    <span>{session.totalWinesCounted}/{session.totalWinesExpected}</span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="border-t border-border">
                  {sessionItems.length === 0 ? (
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
                          {sessionItems.map(item => (
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

                  {/* Audit trail */}
                  {sessionAudit(session.id).length > 0 && (
                    <div className="border-t border-border/50 p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <History className="w-3 h-3" /> Audit Trail
                      </p>
                      <div className="space-y-2">
                        {sessionAudit(session.id).map(entry => (
                          <div key={entry.id} className="flex items-start gap-2 text-xs">
                            <span className={`font-medium ${entry.action === 'approved' ? 'text-[hsl(var(--wine-success))]' : 'text-destructive'}`}>
                              {entry.action === 'approved' ? '✓ Approved' : '⚑ Flagged'}
                            </span>
                            <span className="text-muted-foreground">by {entry.userName}</span>
                            <span className="text-muted-foreground">• {new Date(entry.timestamp).toLocaleString()}</span>
                            {entry.notes && <span className="text-foreground">— {entry.notes}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Approve/Flag actions */}
                  {session.status === 'completed' && (
                    <div className="p-4 border-t border-border/50 space-y-3">
                      {flagDialogSession === session.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={flagReason}
                            onChange={e => setFlagReason(e.target.value)}
                            placeholder="Reason for flagging..."
                            className="bg-secondary border-border text-sm"
                            rows={2}
                          />
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

      {filteredSessions.length === 0 && (
        <div className="hidden lg:block text-center py-12 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sessions match your filters</p>
        </div>
      )}
    </div>
  );
}
