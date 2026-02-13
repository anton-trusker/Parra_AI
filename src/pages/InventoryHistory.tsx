import { useState, useMemo } from 'react';
import { mockMovements, InventoryMovement } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Search, Camera, Scan, Clock, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';

const HISTORY_COLUMN_DEFS: ColumnDef[] = [
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

const methodLabels: Record<string, string> = { manual: 'Search', barcode: 'Barcode', image_ai: 'Image AI' };

const DATE_PRESETS = ['All Time', 'Today', 'This Week', 'Last 30 Days'];

function buildHistoryColumns(isAdmin: boolean): DataTableColumn<InventoryMovement>[] {
  const formatDate = (ts: string) => new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  return [
    { key: 'timestamp', label: 'Timestamp', render: m => <span className="text-muted-foreground whitespace-nowrap"><Clock className="w-3 h-3 inline mr-1" />{formatDate(m.timestamp)}</span>, sortFn: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() },
    ...(isAdmin ? [{ key: 'user', label: 'User', render: (m: InventoryMovement) => <span className="font-medium">{m.userName}</span>, sortFn: (a: InventoryMovement, b: InventoryMovement) => a.userName.localeCompare(b.userName) }] : []),
    { key: 'wine', label: 'Wine', minWidth: 140, render: m => m.wineName, sortFn: (a, b) => a.wineName.localeCompare(b.wineName) },
    { key: 'method', label: 'Method', render: m => <span className="wine-badge bg-secondary text-secondary-foreground"><MethodIcon method={m.method} /><span className="ml-1">{methodLabels[m.method] || m.method}</span></span> },
    { key: 'session', label: 'Session', render: m => <span className="text-muted-foreground font-mono text-xs">{m.sessionId}</span> },
    { key: 'closed', label: 'Closed', align: 'center' as const, render: m => m.unopened, sortFn: (a, b) => a.unopened - b.unopened },
    { key: 'open', label: 'Open', align: 'center' as const, render: m => <span className="text-muted-foreground">{m.opened}</span> },
    { key: 'total', label: 'Total', align: 'center' as const, render: m => <span className="font-semibold">{m.unopened + m.opened}</span>, sortFn: (a, b) => (a.unopened + a.opened) - (b.unopened + b.opened) },
    ...(isAdmin ? [{ key: 'confidence', label: 'Confidence', align: 'center' as const, render: (m: InventoryMovement) => m.confidence ? `${m.confidence}%` : '—' }] : []),
    { key: 'notes', label: 'Notes', render: m => <span className="text-xs text-muted-foreground">{m.notes || '—'}</span> },
    { key: 'location', label: 'Location', render: m => <span className="text-xs text-muted-foreground">—</span> },
  ];
}

export default function InventoryHistory() {
  const { user } = useAuthStore();
  const { historyColumns, setHistoryColumns, historyFilters, setHistoryFilters, columnWidths, setColumnWidth } = useColumnStore();
  const isAdmin = user?.role === 'admin';
  const [methodFilter, setMethodFilter] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [datePreset, setDatePreset] = useState<string[]>([]);
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [sessionFilter, setSessionFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const uniqueUsers = useMemo(() => [...new Set(mockMovements.map(m => m.userName))], []);
  const uniqueSessions = useMemo(() => [...new Set(mockMovements.map(m => m.sessionId))], []);
  const methods = ['Search', 'Barcode', 'Image AI'];

  const activeFilterCount = [methodFilter, datePreset, userFilter, sessionFilter].filter(f => f.length > 0).length;
  const fv = (key: string) => historyFilters.includes(key);

  const clearFilters = () => {
    setMethodFilter([]);
    setDatePreset([]);
    setUserFilter([]);
    setSessionFilter([]);
  };

  const movements = useMemo(() => {
    let data = isAdmin ? mockMovements : mockMovements.filter(m => m.userId === user?.id);
    return data.filter(m => {
      if (methodFilter.length > 0) {
        const label = methodLabels[m.method] || m.method;
        if (!methodFilter.includes(label)) return false;
      }
      if (search && !m.wineName.toLowerCase().includes(search.toLowerCase())) return false;
      if (isAdmin && userFilter.length > 0 && !userFilter.includes(m.userName)) return false;
      if (sessionFilter.length > 0 && !sessionFilter.includes(m.sessionId)) return false;
      if (datePreset.length > 0 && !datePreset.includes('All Time')) {
        const ts = new Date(m.timestamp).getTime();
        const now = Date.now();
        const pass = datePreset.some(p => {
          if (p === 'Today') return now - ts <= 86400000;
          if (p === 'This Week') return now - ts <= 604800000;
          if (p === 'Last 30 Days') return now - ts <= 2592000000;
          return true;
        });
        if (!pass) return false;
      }
      return true;
    });
  }, [isAdmin, user, methodFilter, search, datePreset, userFilter, sessionFilter]);

  const tableColumns = useMemo(() => buildHistoryColumns(isAdmin), [isAdmin]);

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
          {isAdmin && (
            <Button
              variant="outline"
              className={`h-11 border-border gap-2 ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          )}
          {isAdmin && <ColumnManager columns={HISTORY_COLUMN_DEFS} visibleColumns={historyColumns} onChange={setHistoryColumns} />}
        </div>

        {isAdmin && showFilters && (
          <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" /> Clear
                  </Button>
                )}
                <FilterManager filters={HISTORY_FILTER_DEFS} visibleFilters={historyFilters} onChange={setHistoryFilters} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {fv('method') && <MultiSelectFilter label="Method" options={methods} selected={methodFilter} onChange={setMethodFilter} />}
              {fv('dateRange') && <MultiSelectFilter label="Date Range" options={DATE_PRESETS} selected={datePreset} onChange={setDatePreset} />}
              {fv('user') && <MultiSelectFilter label="User" options={uniqueUsers} selected={userFilter} onChange={setUserFilter} />}
              {fv('session') && <MultiSelectFilter label="Session" options={uniqueSessions} selected={sessionFilter} onChange={setSessionFilter} />}
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
                <span className="ml-1">{methodLabels[m.method] || m.method}</span>
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
              <Clock className="w-3 h-3" /> {new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · {m.sessionId}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
        <DataTable
          data={movements}
          columns={tableColumns}
          visibleColumns={historyColumns}
          columnWidths={columnWidths}
          onColumnResize={setColumnWidth}
          keyExtractor={m => m.id}
          emptyMessage="No entries match your filters"
        />
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
