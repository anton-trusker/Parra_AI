import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Search, Plus, SlidersHorizontal, LayoutGrid, Table2, Wine as WineIcon, ImageOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';

const CATALOG_COLUMN_DEFS: ColumnDef[] = [
  { key: 'wine', label: 'Wine' },
  { key: 'producer', label: 'Producer' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'type', label: 'Type' },
  { key: 'volume', label: 'Volume' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'stock', label: 'Stock' },
  { key: 'status', label: 'Status' },
  { key: 'price', label: 'Price' },
  { key: 'abv', label: 'ABV' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'grapeVarieties', label: 'Grapes' },
  { key: 'body', label: 'Body' },
  { key: 'location', label: 'Location' },
];

const CATALOG_FILTER_DEFS: FilterDef[] = [
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'stock', label: 'Stock Status' },
];

function StockBadge({ wine }: { wine: Wine }) {
  const total = wine.stockUnopened + wine.stockOpened;
  if (total === 0) return <span className="wine-badge stock-out">Out of Stock</span>;
  if (total < wine.minStockLevel) return <span className="wine-badge stock-low">Low Stock</span>;
  return <span className="wine-badge stock-healthy">In Stock</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Red: 'bg-primary/20 text-primary',
    White: 'bg-accent/20 text-accent',
    Rosé: 'bg-pink-500/20 text-pink-400',
    Sparkling: 'bg-sky-500/20 text-sky-400',
    Fortified: 'bg-amber-600/20 text-amber-500',
    Dessert: 'bg-orange-500/20 text-orange-400',
  };
  return <span className={`wine-badge ${colors[type] || 'bg-secondary text-secondary-foreground'}`}>{type}</span>;
}

function WineCard({ wine, onClick, hideStock }: { wine: Wine; onClick: () => void; hideStock?: boolean }) {
  return (
    <div onClick={onClick} className="wine-glass-effect rounded-xl overflow-hidden group transition-all duration-300 hover:border-accent/30 hover:shadow-lg hover:shadow-primary/5 cursor-pointer">
      <div className="h-36 bg-gradient-to-b from-secondary to-card flex items-center justify-center relative overflow-hidden">
        {wine.hasImage ? (
          <div className="w-full h-full bg-gradient-to-b from-wine-burgundy/30 to-card flex items-center justify-center">
            <WineIcon className="w-10 h-10 text-accent/30 group-hover:text-accent/50 transition-colors" />
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImageOff className="w-7 h-7 mb-1" />
            <span className="text-[10px]">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <TypeBadge type={wine.type} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-sm truncate">{wine.name}</h3>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{wine.producer}</p>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
          <span>{wine.vintage || 'NV'}</span>
          <span className="text-border">•</span>
          <span>{wine.volume}ml</span>
          <span className="text-border">•</span>
          <span>{wine.region}</span>
        </div>
        {!hideStock && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
            <span className="text-xs text-muted-foreground">{wine.stockUnopened}U + {wine.stockOpened}O</span>
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
    { key: 'producer', label: 'Producer', render: w => <span className="text-muted-foreground">{w.producer}</span>, sortFn: (a, b) => a.producer.localeCompare(b.producer) },
    { key: 'vintage', label: 'Vintage', render: w => w.vintage || 'NV', sortFn: (a, b) => (b.vintage || 0) - (a.vintage || 0) },
    { key: 'type', label: 'Type', render: w => <TypeBadge type={w.type} />, sortFn: (a, b) => a.type.localeCompare(b.type) },
    { key: 'volume', label: 'Volume', render: w => <span className="text-muted-foreground">{w.volume}ml</span> },
    { key: 'country', label: 'Country', render: w => <span className="text-muted-foreground">{w.country}</span>, sortFn: (a, b) => a.country.localeCompare(b.country) },
    { key: 'region', label: 'Region', render: w => <span className="text-muted-foreground">{w.region}</span>, sortFn: (a, b) => a.region.localeCompare(b.region) },
    { key: 'abv', label: 'ABV', align: 'center', render: w => <span className="text-muted-foreground">{w.abv}%</span>, sortFn: (a, b) => a.abv - b.abv },
    ...(!hideStock ? [
      { key: 'stock', label: 'Stock', render: (w: Wine) => `${w.stockUnopened}U + ${w.stockOpened}O`, sortFn: (a: Wine, b: Wine) => (a.stockUnopened + a.stockOpened) - (b.stockUnopened + b.stockOpened) },
      { key: 'status', label: 'Status', render: (w: Wine) => <StockBadge wine={w} /> },
    ] : []),
    ...(isAdmin ? [{ key: 'price', label: 'Price', align: 'right' as const, render: (w: Wine) => <span className="text-accent">${w.price}</span>, sortFn: (a: Wine, b: Wine) => a.price - b.price }] : []),
    { key: 'barcode', label: 'Barcode', render: w => <span className="text-xs text-muted-foreground font-mono">{w.barcode || '—'}</span> },
    { key: 'grapeVarieties', label: 'Grapes', render: w => <span className="text-xs text-muted-foreground">{w.grapeVarieties.join(', ')}</span> },
    { key: 'body', label: 'Body', render: w => <span className="text-xs text-muted-foreground capitalize">{w.body || '—'}</span> },
    { key: 'location', label: 'Location', render: w => <span className="text-xs text-muted-foreground">{w.location}</span> },
  ];
}

export default function WineCatalog() {
  const { user } = useAuthStore();
  const { catalogColumns, setCatalogColumns, catalogFilters, setCatalogFilters, columnWidths, setColumnWidth } = useColumnStore();
  const navigate = useNavigate();
  const isAdmin = user?.roleId === 'role_admin';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [stockFilter, setStockFilter] = useState<string[]>([]);
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.country))].sort(), []);
  const regions = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.region))].sort(), []);
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

  const filtered = useMemo(() => {
    return mockWines.filter(w => {
      if (!w.isActive) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(w.type)) return false;
      if (countryFilter.length > 0 && !countryFilter.includes(w.country)) return false;
      if (regionFilter.length > 0 && !regionFilter.includes(w.region)) return false;
      if (stockFilter.length > 0) {
        const total = w.stockUnopened + w.stockOpened;
        const wStatus = total === 0 ? 'Out of Stock' : total < w.minStockLevel ? 'Low Stock' : 'In Stock';
        if (!stockFilter.includes(wStatus)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) ||
          w.producer.toLowerCase().includes(q) ||
          w.region.toLowerCase().includes(q) ||
          w.grapeVarieties.some(g => g.toLowerCase().includes(q));
      }
      return true;
    });
  }, [search, typeFilter, countryFilter, regionFilter, stockFilter]);

  const hideStock = !isAdmin;
  const tableColumns = useMemo(() => buildCatalogColumns(isAdmin, hideStock), [isAdmin, hideStock]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Wine Catalog</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} wines</p>
        </div>
        {isAdmin && (
          <Button className="wine-gradient text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20" onClick={() => navigate('/catalog/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Wine
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wine, producer, region, grape..."
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

      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(wine => (
            <WineCard key={wine.id} wine={wine} hideStock={hideStock} onClick={() => navigate(`/catalog/${wine.id}`)} />
          ))}
        </div>
      )}

      {view === 'table' && (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <DataTable
            data={filtered}
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

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <WineIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No wines match your filters</p>
        </div>
      )}
    </div>
  );
}
