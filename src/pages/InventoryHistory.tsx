import { useState, useMemo } from 'react';
import { mockMovements } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Search, Camera, Scan, Clock, CalendarDays, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';

const HISTORY_COLUMNS: ColumnDef[] = [
  { key: 'timestamp', label: 'Timestamp' },
  { key: 'user', label: 'User' },
  { key: 'wine', label: 'Wine' },
  { key: 'method', label: 'Method' },
  { key: 'session', label: 'Session' },
  { key: 'closed', label: 'Closed' },
  { key: 'open', label: 'Open' },
  { key: 'total', label: 'Total' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'notes', label: 'Notes' },
  { key: 'location', label: 'Location' },
];

const HISTORY_FILTER_DEFS: FilterDef[] = [
  { key: 'method', label: 'Method' },
  { key: 'dateRange', label: 'Date Range' },
  { key: 'user', label: 'User' },
  { key: 'session', label: 'Session' },
];

function MethodIcon({ method }: { method: string }) {
  if (method === 'barcode') return <Scan className="w-4 h-4" />;
  if (method === 'image_ai') return <Camera className="w-4 h-4" />;
  return <Search className="w-4 h-4" />;
}

function MethodLabel({ method }: { method: string }) {
  const labels: Record<string, string> = { manual: 'Search', barcode: 'Barcode', image_ai: 'Image AI' };
  return <>{labels[method] || method}</>;
}

const DATE_PRESETS = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'Last 30 Days', value: '30days' },
];

export default function InventoryHistory() {
  const { user } = useAuthStore();
  const { historyColumns, setHistoryColumns, historyFilters, setHistoryFilters } = useColumnStore();
  const isAdmin = user?.roleId === 'role_admin';
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const uniqueUsers = useMemo(() => [...new Set(mockMovements.map(m => m.userName))], []);
  const uniqueSessions = useMemo(() => [...new Set(mockMovements.map(m => m.sessionId))], []);

  const activeFilterCount = [methodFilter, datePreset, userFilter, sessionFilter].filter(f => f !== 'all').length;
  const fv = (key: string) => historyFilters.includes(key);

  const movements = useMemo(() => {
    let data = isAdmin ? mockMovements : mockMovements.filter(m => m.userId === user?.id);
    return data.filter(m => {
      if (methodFilter !== 'all' && m.method !== methodFilter) return false;
      if (search && !m.wineName.toLowerCase().includes(search.toLowerCase())) return false;
      if (isAdmin && userFilter !== 'all' && m.userName !== userFilter) return false;
      if (sessionFilter !== 'all' && m.sessionId !== sessionFilter) return false;
      if (datePreset !== 'all') {
        const ts = new Date(m.timestamp).getTime();
        const now = Date.now();
        if (datePreset === 'today' && now - ts > 86400000) return false;
        if (datePreset === 'week' && now - ts > 604800000) return false;
        if (datePreset === '30days' && now - ts > 2592000000) return false;
      }
      return true;
    });
  }, [isAdmin, user, methodFilter, search, datePreset, userFilter, sessionFilter]);

  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const v = (key: string) => historyColumns.includes(key);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">{isAdmin ? 'History & Audit' : 'My History'}</h1>
        <p className="text-muted-foreground mt-1">{movements.length} entries</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search wine..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          {fv('method') && (
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="manual">Manual Search</SelectItem>
                <SelectItem value="barcode">Barcode</SelectItem>
                <SelectItem value="image_ai">Image AI</SelectItem>
              </SelectContent>
            </Select>
          )}
          {fv('dateRange') && (
            <Select value={datePreset} onValueChange={setDatePreset}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
                <CalendarDays className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              className={`h-11 border-border gap-2 ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          {isAdmin && <FilterManager filters={HISTORY_FILTER_DEFS} visibleFilters={historyFilters} onChange={setHistoryFilters} />}
          {isAdmin && <ColumnManager columns={HISTORY_COLUMNS} visibleColumns={historyColumns} onChange={setHistoryColumns} />}
        </div>

        {isAdmin && showFilters && (
          <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setUserFilter('all'); setSessionFilter('all'); setMethodFilter('all'); setDatePreset('all'); }}>
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {fv('user') && (
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="User" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {uniqueUsers.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('session') && (
                <Select value={sessionFilter} onValueChange={setSessionFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="Session" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {uniqueSessions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {movements.map(m => (
          <div key={m.id} className="wine-glass-effect rounded-xl p-4">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-sm truncate flex-1">{m.wineName}</p>
              <span className="wine-badge bg-secondary text-secondary-foreground ml-2">
                <MethodIcon method={m.method} />
                <span className="ml-1"><MethodLabel method={m.method} /></span>
              </span>
            </div>
            {isAdmin && <p className="text-xs text-accent">{m.userName}</p>}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-3 text-xs">
                <span><span className="text-muted-foreground">C:</span> {m.unopened}</span>
                <span><span className="text-muted-foreground">O:</span> {m.opened}</span>
                <span className="font-semibold">Total: {m.unopened + m.opened}</span>
              </div>
              {m.confidence && <span className="text-xs text-accent">{m.confidence}%</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatDate(m.timestamp)} · {m.sessionId}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {v('timestamp') && <th className="text-left p-4 font-medium">Timestamp</th>}
                {isAdmin && v('user') && <th className="text-left p-4 font-medium">User</th>}
                {v('wine') && <th className="text-left p-4 font-medium">Wine</th>}
                {v('method') && <th className="text-left p-4 font-medium">Method</th>}
                {v('session') && <th className="text-left p-4 font-medium">Session</th>}
                {v('closed') && <th className="text-center p-4 font-medium">Closed</th>}
                {v('open') && <th className="text-center p-4 font-medium">Open</th>}
                {v('total') && <th className="text-center p-4 font-medium">Total</th>}
                {isAdmin && v('confidence') && <th className="text-center p-4 font-medium">Confidence</th>}
                {v('notes') && <th className="text-left p-4 font-medium">Notes</th>}
                {v('location') && <th className="text-left p-4 font-medium">Location</th>}
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors">
                  {v('timestamp') && <td className="p-4 text-muted-foreground whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1" />{formatDate(m.timestamp)}</td>}
                  {isAdmin && v('user') && <td className="p-4 font-medium">{m.userName}</td>}
                  {v('wine') && <td className="p-4">{m.wineName}</td>}
                  {v('method') && <td className="p-4"><span className="wine-badge bg-secondary text-secondary-foreground"><MethodIcon method={m.method} /><span className="ml-1"><MethodLabel method={m.method} /></span></span></td>}
                  {v('session') && <td className="p-4 text-muted-foreground font-mono text-xs">{m.sessionId}</td>}
                  {v('closed') && <td className="p-4 text-center">{m.unopened}</td>}
                  {v('open') && <td className="p-4 text-center text-muted-foreground">{m.opened}</td>}
                  {v('total') && <td className="p-4 text-center font-semibold">{m.unopened + m.opened}</td>}
                  {isAdmin && v('confidence') && <td className="p-4 text-center">{m.confidence ? `${m.confidence}%` : '—'}</td>}
                  {v('notes') && <td className="p-4 text-xs text-muted-foreground">{m.notes || '—'}</td>}
                  {v('location') && <td className="p-4 text-xs text-muted-foreground">—</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {movements.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No entries match your filters</p>
        </div>
      )}
    </div>
  );
}
