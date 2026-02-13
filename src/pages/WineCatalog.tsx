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
  { key: 'sub_region', label: 'Sub-Region' },
  { key: 'appellation', label: 'Appellation' },
  { key: 'grapes', label: 'Grapes' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'purchase_price', label: 'Cost' },
  { key: 'glass_price', label: 'Glass Price' },
  { key: 'abv', label: 'ABV' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'sku', label: 'SKU' },
  { key: 'body', label: 'Body' },
  { key: 'sweetness', label: 'Sweetness' },
  { key: 'acidity', label: 'Acidity' },
  { key: 'tannins', label: 'Tannins' },
  { key: 'by_glass', label: 'By Glass' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'source', label: 'Source' },
  { key: 'vineyard', label: 'Vineyard' },
  { key: 'closure', label: 'Closure' },
  { key: 'location', label: 'Location' },
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
    { key: 'sub_region', label: 'Sub-Region', render: w => <span className="text-muted-foreground">{w.sub_region || '—'}</span>, sortFn: (a, b) => (a.sub_region || '').localeCompare(b.sub_region || '') },
    { key: 'appellation', label: 'Appellation', render: w => <span className="text-muted-foreground">{w.appellation || '—'}</span>, sortFn: (a, b) => (a.appellation || '').localeCompare(b.appellation || '') },
    { key: 'grapes', label: 'Grapes', render: w => {
      const grapes = Array.isArray(w.grape_varieties) ? (w.grape_varieties as string[]) : [];
      return grapes.length > 0 ? <span className="text-xs text-muted-foreground">{grapes.join(', ')}</span> : <span className="text-muted-foreground">—</span>;
    }},
    { key: 'abv', label: 'ABV', align: 'center', render: w => <span className="text-muted-foreground">{w.alcohol_content ? `${w.alcohol_content}%` : '—'}</span> },
    ...(!hideStock ? [
      { key: 'stock', label: 'Stock', render: (w: Wine) => `${w.current_stock_unopened}U + ${w.current_stock_opened}O`, sortFn: (a: Wine, b: Wine) => (a.current_stock_unopened + a.current_stock_opened) - (b.current_stock_unopened + b.current_stock_opened) },
      { key: 'status', label: 'Status', render: (w: Wine) => <StockBadge wine={w} /> },
    ] : []),
    ...(isAdmin ? [
      { key: 'price', label: 'Price', align: 'right' as const, render: (w: Wine) => <span className="text-accent">{w.currency || 'AED'} {w.sale_price ?? '—'}</span>, sortFn: (a: Wine, b: Wine) => (a.sale_price || 0) - (b.sale_price || 0) },
      { key: 'purchase_price', label: 'Cost', align: 'right' as const, render: (w: Wine) => <span className="text-muted-foreground">{w.purchase_price != null ? `${w.currency || 'AED'} ${w.purchase_price}` : '—'}</span> },
      { key: 'glass_price', label: 'Glass Price', align: 'right' as const, render: (w: Wine) => <span className="text-muted-foreground">{w.glass_price != null ? `${w.currency || 'AED'} ${w.glass_price}` : '—'}</span> },
    ] : []),
    { key: 'barcode', label: 'Barcode', render: w => <span className="text-xs text-muted-foreground font-mono">{w.primary_barcode || '—'}</span> },
    { key: 'sku', label: 'SKU', render: w => <span className="text-xs text-muted-foreground font-mono">{w.sku || '—'}</span> },
    { key: 'body', label: 'Body', render: w => <span className="text-xs text-muted-foreground capitalize">{w.body || '—'}</span> },
    { key: 'sweetness', label: 'Sweetness', render: w => <span className="text-xs text-muted-foreground capitalize">{w.sweetness || '—'}</span> },
    { key: 'acidity', label: 'Acidity', render: w => <span className="text-xs text-muted-foreground capitalize">{w.acidity || '—'}</span> },
    { key: 'tannins', label: 'Tannins', render: w => <span className="text-xs text-muted-foreground capitalize">{w.tannins || '—'}</span> },
    { key: 'by_glass', label: 'By Glass', render: w => w.available_by_glass ? <span className="wine-badge bg-accent/15 text-accent">Yes</span> : <span className="text-muted-foreground">No</span> },
    { key: 'supplier', label: 'Supplier', render: w => <span className="text-muted-foreground">{w.supplier_name || '—'}</span> },
    { key: 'source', label: 'Source', render: w => <EnrichmentBadge source={w.enrichment_source} /> },
    { key: 'vineyard', label: 'Vineyard', render: w => <span className="text-muted-foreground">{w.vineyard || '—'}</span> },
    { key: 'closure', label: 'Closure', render: w => <span className="text-muted-foreground capitalize">{w.closure_type || '—'}</span> },
    { key: 'location', label: 'Location', render: w => <span className="text-muted-foreground">{w.bin_location || '—'}</span> },
  ];
}

// Build filter defs dynamically from visible columns
function buildFilterDefs(visibleColumns: string[]): FilterDef[] {
  const filterMap: Record<string, FilterDef> = {
    type: { key: 'type', label: 'Type' },
    country: { key: 'country', label: 'Country' },
    region: { key: 'region', label: 'Region' },
    sub_region: { key: 'sub_region', label: 'Sub-Region' },
    appellation: { key: 'appellation', label: 'Appellation' },
    producer: { key: 'producer', label: 'Producer' },
    grapes: { key: 'grapes', label: 'Grapes' },
    stock: { key: 'stock', label: 'Stock Status' },
    status: { key: 'stock', label: 'Stock Status' },
    body: { key: 'body', label: 'Body' },
    sweetness: { key: 'sweetness', label: 'Sweetness' },
    acidity: { key: 'acidity', label: 'Acidity' },
    tannins: { key: 'tannins', label: 'Tannins' },
    by_glass: { key: 'by_glass', label: 'By Glass' },
    source: { key: 'source', label: 'Source' },
    supplier: { key: 'supplier', label: 'Supplier' },
    closure: { key: 'closure', label: 'Closure' },
    vineyard: { key: 'vineyard', label: 'Vineyard' },
    vintage: { key: 'vintage', label: 'Year' },
    volume: { key: 'volume', label: 'Volume' },
    location: { key: 'location', label: 'Location' },
  };

  // Always include core filters, then add from visible columns
  const seen = new Set<string>();
  const result: FilterDef[] = [];
  const coreFilters = ['type', 'country', 'region', 'stock'];
  for (const k of [...coreFilters, ...visibleColumns]) {
    const fd = filterMap[k];
    if (fd && !seen.has(fd.key)) {
      seen.add(fd.key);
      result.push(fd);
    }
  }
  return result;
}

export default function WineCatalog() {
  const { user } = useAuthStore();
  const { catalogColumns, setCatalogColumns, catalogFilters, setCatalogFilters, columnWidths, setColumnWidth } = useColumnStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string[]>>({});
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const { data: wines = [], isLoading } = useWines({
    search: search || undefined,
    type: filterValues.type?.length ? filterValues.type : undefined,
    country: filterValues.country?.length ? filterValues.country : undefined,
    region: filterValues.region?.length ? filterValues.region : undefined,
    stockStatus: filterValues.stock?.length ? filterValues.stock : undefined,
    producer: filterValues.producer?.length ? filterValues.producer : undefined,
    appellation: filterValues.appellation?.length ? filterValues.appellation : undefined,
    subRegion: filterValues.sub_region?.length ? filterValues.sub_region : undefined,
    body: filterValues.body?.length ? filterValues.body : undefined,
    sweetness: filterValues.sweetness?.length ? filterValues.sweetness : undefined,
    byGlass: filterValues.by_glass?.length ? filterValues.by_glass[0] : undefined,
    source: filterValues.source?.length ? filterValues.source : undefined,
  });

  // Build options dynamically from data
  const optionsMap = useMemo(() => {
    const extract = (fn: (w: Wine) => string | null | undefined) =>
      [...new Set(wines.map(fn).filter(Boolean) as string[])].sort();
    return {
      type: ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'],
      country: extract(w => w.country),
      region: extract(w => w.region),
      sub_region: extract(w => w.sub_region),
      appellation: extract(w => w.appellation),
      producer: extract(w => w.producer),
      grapes: extract(w => {
        const g = w.grape_varieties;
        return Array.isArray(g) ? (g as string[]).join(', ') : null;
      }),
      stock: ['In Stock', 'Low Stock', 'Out of Stock'],
      body: extract(w => w.body),
      sweetness: extract(w => w.sweetness),
      acidity: extract(w => w.acidity),
      tannins: extract(w => w.tannins),
      by_glass: ['Yes', 'No'],
      source: extract(w => w.enrichment_source),
      supplier: extract(w => w.supplier_name),
      closure: extract(w => w.closure_type),
      vineyard: extract(w => w.vineyard),
      vintage: extract(w => w.vintage?.toString()),
      volume: extract(w => w.volume_ml?.toString()),
      location: extract(w => w.bin_location),
    };
  }, [wines]);

  const availableFilterDefs = useMemo(() => buildFilterDefs(catalogColumns), [catalogColumns]);
  const activeFilterCount = Object.values(filterValues).filter(f => f.length > 0).length;
  const fv = (key: string) => catalogFilters.includes(key);

  const clearFilters = () => setFilterValues({});
  const setFilter = (key: string, values: string[]) => setFilterValues(prev => ({ ...prev, [key]: values }));

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
          {view === 'table' && <ColumnManager columns={CATALOG_COLUMN_DEFS} visibleColumns={catalogColumns} onChange={setCatalogColumns} />}
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
                <FilterManager filters={availableFilterDefs} visibleFilters={catalogFilters} onChange={setCatalogFilters} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableFilterDefs.map(fd => 
                fv(fd.key) && optionsMap[fd.key as keyof typeof optionsMap] ? (
                  <MultiSelectFilter
                    key={fd.key}
                    label={fd.label}
                    options={optionsMap[fd.key as keyof typeof optionsMap] || []}
                    selected={filterValues[fd.key] || []}
                    onChange={v => setFilter(fd.key, v)}
                  />
                ) : null
              )}
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