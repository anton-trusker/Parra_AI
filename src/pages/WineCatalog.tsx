import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { useWines, Wine } from '@/hooks/useWines';
import { Search, Plus, SlidersHorizontal, LayoutGrid, Table2, Wine as WineIcon, ImageOff, X, FileUp, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

const CATALOG_COLUMN_DEFS: ColumnDef[] = [
  { key: 'wine', label: 'Wine' },
  { key: 'producer', label: 'Producer' },
  { key: 'vintage', label: 'Year' },
  { key: 'type', label: 'Type' },
  { key: 'volume', label: 'Volume' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'abv', label: 'ABV' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'body', label: 'Body' },
  { key: 'source', label: 'Source' },
];

const CATALOG_FILTER_DEFS: FilterDef[] = [
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'stock', label: 'Stock Status' },
];

const TYPE_DISPLAY: Record<string, string> = {
  red: 'Red', white: 'White', rose: 'Rosé', sparkling: 'Sparkling', fortified: 'Fortified', dessert: 'Dessert',
};

function EnrichmentBadge({ source }: { source: string | null | undefined }) {
  if (!source || source === 'manual') return null;
  const colors: Record<string, string> = {
    syrve_auto: 'bg-sky-500/20 text-sky-400',
    ai: 'bg-purple-500/20 text-purple-400',
    csv: 'bg-emerald-500/20 text-emerald-400',
  };
  const labels: Record<string, string> = {
    syrve_auto: 'Auto', ai: 'AI', csv: 'CSV',
  };
  return <span className={`wine-badge ${colors[source] || 'bg-secondary text-secondary-foreground'}`}>{labels[source] || source}</span>;
}

function StockBadge({ wine }: { wine: Wine }) {
  if (wine.stock_status === 'out_of_stock') return <span className="wine-badge stock-out">Out of Stock</span>;
  if (wine.stock_status === 'low_stock') return <span className="wine-badge stock-low">Low Stock</span>;
  return <span className="wine-badge stock-healthy">In Stock</span>;
}

function TypeBadge({ type }: { type: string | null }) {
  const display = type ? TYPE_DISPLAY[type] || type : '—';
  const colors: Record<string, string> = {
    red: 'bg-primary/20 text-primary',
    white: 'bg-accent/20 text-accent',
    rose: 'bg-pink-500/20 text-pink-400',
    sparkling: 'bg-sky-500/20 text-sky-400',
    fortified: 'bg-amber-600/20 text-amber-500',
    dessert: 'bg-orange-500/20 text-orange-400',
  };
  return <span className={`wine-badge ${colors[type || ''] || 'bg-secondary text-secondary-foreground'}`}>{display}</span>;
}

function WineCard({ wine, onClick, hideStock }: { wine: Wine; onClick: () => void; hideStock?: boolean }) {
  const total = wine.current_stock_unopened + wine.current_stock_opened;
  return (
    <div onClick={onClick} className="wine-glass-effect rounded-xl overflow-hidden group transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
      <div className="h-36 bg-gradient-to-b from-secondary to-card flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center text-muted-foreground">
          <WineIcon className="w-10 h-10 text-accent/30 group-hover:text-accent/50 transition-colors" />
        </div>
        <div className="absolute top-2 right-2 flex gap-1">
          <EnrichmentBadge source={wine.enrichment_source} />
          <TypeBadge type={wine.wine_type} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm truncate">{wine.name}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{wine.producer || '—'}</p>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
          <span>{wine.vintage || 'NV'}</span>
          <span className="text-border">•</span>
          <span>{wine.volume_ml || 750}ml</span>
          <span className="text-border">•</span>
          <span>{wine.region || '—'}</span>
        </div>
        {!hideStock && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">{wine.current_stock_unopened}U + {wine.current_stock_opened}O</span>
            <StockBadge wine={wine} />
          </div>
        )}
      </div>
    </div>
  );
}

function buildCatalogColumns(isAdmin: boolean, hideStock: boolean): DataTableColumn<Wine>[] {
  return [
    { key: 'wine', label: 'Wine', minWidth: 140, render: w => <span className="font-medium">{w.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'producer', label: 'Producer', render: w => <span className="text-muted-foreground">{w.producer || '—'}</span>, sortFn: (a, b) => (a.producer || '').localeCompare(b.producer || '') },
    { key: 'vintage', label: 'Year', render: w => w.vintage || 'NV', sortFn: (a, b) => (b.vintage || 0) - (a.vintage || 0) },
    { key: 'type', label: 'Type', render: w => <TypeBadge type={w.wine_type} />, sortFn: (a, b) => (a.wine_type || '').localeCompare(b.wine_type || '') },
    { key: 'volume', label: 'Volume', render: w => <span className="text-muted-foreground">{w.volume_ml || 750}ml</span> },
    { key: 'country', label: 'Country', render: w => <span className="text-muted-foreground">{w.country || '—'}</span>, sortFn: (a, b) => (a.country || '').localeCompare(b.country || '') },
    { key: 'region', label: 'Region', render: w => <span className="text-muted-foreground">{w.region || '—'}</span>, sortFn: (a, b) => (a.region || '').localeCompare(b.region || '') },
    { key: 'abv', label: 'ABV', align: 'center', render: w => <span className="text-muted-foreground">{w.alcohol_content || '—'}%</span> },
    ...(!hideStock ? [
      { key: 'stock', label: 'Stock', render: (w: Wine) => `${w.current_stock_unopened}U + ${w.current_stock_opened}O`, sortFn: (a: Wine, b: Wine) => (a.current_stock_unopened + a.current_stock_opened) - (b.current_stock_unopened + b.current_stock_opened) },
      { key: 'status', label: 'Status', render: (w: Wine) => <StockBadge wine={w} /> },
    ] : []),
    ...(isAdmin ? [{ key: 'price', label: 'Price', align: 'right' as const, render: (w: Wine) => <span className="text-accent">{w.currency || 'AED'} {w.sale_price ?? '—'}</span>, sortFn: (a: Wine, b: Wine) => (a.sale_price || 0) - (b.sale_price || 0) }] : []),
    { key: 'barcode', label: 'Barcode', render: w => <span className="text-xs text-muted-foreground font-mono">{w.primary_barcode || '—'}</span> },
    { key: 'body', label: 'Body', render: w => <span className="text-xs text-muted-foreground capitalize">{w.body || '—'}</span> },
    { key: 'source', label: 'Source', render: w => <EnrichmentBadge source={w.enrichment_source} /> },
  ];
}

export default function WineCatalog() {
  const { user } = useAuthStore();
  const { catalogColumns, setCatalogColumns, catalogFilters, setCatalogFilters, columnWidths, setColumnWidth } = useColumnStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string[]>([]);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const { data: wines = [], isLoading } = useWines({
    search: search || undefined,
    type: typeFilter.length ? typeFilter : undefined,
    country: countryFilter.length ? countryFilter : undefined,
    region: regionFilter.length ? regionFilter : undefined,
    stockStatus: stockFilter.length ? stockFilter : undefined,
  });

  const countries = useMemo(() => [...new Set(wines.map(w => w.country).filter(Boolean) as string[])].sort(), [wines]);
  const regions = useMemo(() => [...new Set(wines.map(w => w.region).filter(Boolean) as string[])].sort(), [wines]);
  const types = ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'];
  const stockStatuses = ['In Stock', 'Low Stock', 'Out of Stock'];

  const activeFilterCount = [typeFilter, countryFilter, regionFilter, stockFilter].filter(f => f.length > 0).length;
  const fv = (key: string) => catalogFilters.includes(key);

  const clearFilters = () => {
    setTypeFilter([]);
    setCountryFilter([]);
    setRegionFilter([]);
    setStockFilter([]);
  };

  const hideStock = !isAdmin;
  const tableColumns = useMemo(() => buildCatalogColumns(isAdmin, hideStock), [isAdmin, hideStock]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Wine Catalog</h1>
          <p className="text-muted-foreground mt-1">{wines.length} wines</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/catalog/import')}>
              <FileUp className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button className="wine-gradient text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20" onClick={() => navigate('/catalog/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Wine
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wine, producer, region..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-border"
            />
          </div>
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
          {isAdmin && view === 'table' && <ColumnManager columns={CATALOG_COLUMN_DEFS} visibleColumns={catalogColumns} onChange={setCatalogColumns} />}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView('cards')} className={`p-2.5 transition-colors ${view === 'cards' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setView('table')} className={`p-2.5 transition-colors ${view === 'table' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Table2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                    <X className="w-3 h-3 mr-1" /> Clear all
                  </Button>
                )}
                <FilterManager filters={CATALOG_FILTER_DEFS} visibleFilters={catalogFilters} onChange={setCatalogFilters} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {fv('type') && <MultiSelectFilter label="Type" options={types} selected={typeFilter} onChange={setTypeFilter} />}
              {fv('country') && <MultiSelectFilter label="Country" options={countries} selected={countryFilter} onChange={setCountryFilter} />}
              {fv('region') && <MultiSelectFilter label="Region" options={regions} selected={regionFilter} onChange={setRegionFilter} />}
              {!hideStock && fv('stock') && <MultiSelectFilter label="Stock" options={stockStatuses} selected={stockFilter} onChange={setStockFilter} />}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {wines.map(wine => (
            <WineCard key={wine.id} wine={wine} hideStock={hideStock} onClick={() => navigate(`/catalog/${wine.id}`)} />
          ))}
        </div>
      ) : (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <DataTable
            data={wines}
            columns={tableColumns}
            visibleColumns={catalogColumns}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={w => w.id}
            onRowClick={w => navigate(`/catalog/${w.id}`)}
            emptyMessage="No wines match your filters"
          />
        </div>
      )}

      {!isLoading && wines.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <WineIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No wines match your filters</p>
        </div>
      )}
    </div>
  );
}
