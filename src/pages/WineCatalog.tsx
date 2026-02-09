import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Search, Plus, SlidersHorizontal, LayoutGrid, Table2, Wine as WineIcon, ImageOff, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';

const CATALOG_COLUMNS: ColumnDef[] = [
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
  { key: 'sort', label: 'Sort By' },
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

type SortOption = 'name-asc' | 'name-desc' | 'producer' | 'vintage' | 'stock' | 'updated';

export default function WineCatalog() {
  const { user } = useAuthStore();
  const { catalogColumns, setCatalogColumns, catalogFilters, setCatalogFilters } = useColumnStore();
  const navigate = useNavigate();
  const isAdmin = user?.roleId === 'role_admin';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.country))].sort(), []);
  const regions = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.region))].sort(), []);

  const activeFilterCount = [typeFilter, countryFilter, regionFilter, stockFilter].filter(f => f !== 'all').length;
  const fv = (key: string) => catalogFilters.includes(key);

  const filtered = useMemo(() => {
    let wines = mockWines.filter(w => {
      if (!w.isActive) return false;
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (countryFilter !== 'all' && w.country !== countryFilter) return false;
      if (regionFilter !== 'all' && w.region !== regionFilter) return false;
      if (stockFilter !== 'all') {
        const total = w.stockUnopened + w.stockOpened;
        if (stockFilter === 'in-stock' && (total === 0 || total < w.minStockLevel)) return false;
        if (stockFilter === 'low' && (total >= w.minStockLevel || total === 0)) return false;
        if (stockFilter === 'out' && total > 0) return false;
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

    wines.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'producer': return a.producer.localeCompare(b.producer);
        case 'vintage': return (b.vintage || 0) - (a.vintage || 0);
        case 'stock': return (b.stockUnopened + b.stockOpened) - (a.stockUnopened + a.stockOpened);
        case 'updated': return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        default: return 0;
      }
    });

    return wines;
  }, [search, typeFilter, countryFilter, regionFilter, stockFilter, sortBy]);

  const hideStock = !isAdmin;
  const v = (key: string) => catalogColumns.includes(key);

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

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wine, producer, region, grape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-border"
            />
          </div>
          {fv('type') && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px] h-11 bg-card border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Red">Red</SelectItem>
                <SelectItem value="White">White</SelectItem>
                <SelectItem value="Rosé">Rosé</SelectItem>
                <SelectItem value="Sparkling">Sparkling</SelectItem>
              </SelectContent>
            </Select>
          )}
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
          <FilterManager filters={CATALOG_FILTER_DEFS} visibleFilters={catalogFilters} onChange={setCatalogFilters} />
          {isAdmin && view === 'table' && <ColumnManager columns={CATALOG_COLUMNS} visibleColumns={catalogColumns} onChange={setCatalogColumns} />}
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
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => { setCountryFilter('all'); setRegionFilter('all'); setStockFilter('all'); setTypeFilter('all'); }}>
                  <X className="w-3 h-3 mr-1" /> Clear all
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {fv('country') && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('region') && (
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="Region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {!hideStock && fv('stock') && (
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="Stock" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {fv('sort') && (
                <Select value={sortBy} onValueChange={vl => setSortBy(vl as SortOption)}>
                  <SelectTrigger className="w-[160px] h-9 bg-card border-border text-sm"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name-asc">Name A-Z</SelectItem>
                    <SelectItem value="name-desc">Name Z-A</SelectItem>
                    <SelectItem value="producer">Producer</SelectItem>
                    <SelectItem value="vintage">Vintage (newest)</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(wine => (
            <WineCard key={wine.id} wine={wine} hideStock={hideStock} onClick={() => navigate(`/catalog/${wine.id}`)} />
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  {v('wine') && <th className="text-left p-4 font-medium">Wine</th>}
                  {v('producer') && <th className="text-left p-4 font-medium">Producer</th>}
                  {v('vintage') && <th className="text-left p-4 font-medium">Vintage</th>}
                  {v('type') && <th className="text-left p-4 font-medium">Type</th>}
                  {v('volume') && <th className="text-left p-4 font-medium">Volume</th>}
                  {v('country') && <th className="text-left p-4 font-medium">Country</th>}
                  {v('region') && <th className="text-left p-4 font-medium">Region</th>}
                  {v('abv') && <th className="text-center p-4 font-medium">ABV</th>}
                  {!hideStock && v('stock') && <th className="text-left p-4 font-medium">Stock</th>}
                  {!hideStock && v('status') && <th className="text-left p-4 font-medium">Status</th>}
                  {isAdmin && v('price') && <th className="text-left p-4 font-medium">Price</th>}
                  {v('barcode') && <th className="text-left p-4 font-medium">Barcode</th>}
                  {v('grapeVarieties') && <th className="text-left p-4 font-medium">Grapes</th>}
                  {v('body') && <th className="text-left p-4 font-medium">Body</th>}
                  {v('location') && <th className="text-left p-4 font-medium">Location</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(wine => (
                  <tr key={wine.id} onClick={() => navigate(`/catalog/${wine.id}`)} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors cursor-pointer">
                    {v('wine') && <td className="p-4 font-medium">{wine.name}</td>}
                    {v('producer') && <td className="p-4 text-muted-foreground">{wine.producer}</td>}
                    {v('vintage') && <td className="p-4">{wine.vintage || 'NV'}</td>}
                    {v('type') && <td className="p-4"><TypeBadge type={wine.type} /></td>}
                    {v('volume') && <td className="p-4 text-muted-foreground">{wine.volume}ml</td>}
                    {v('country') && <td className="p-4 text-muted-foreground">{wine.country}</td>}
                    {v('region') && <td className="p-4 text-muted-foreground">{wine.region}</td>}
                    {v('abv') && <td className="p-4 text-center text-muted-foreground">{wine.abv}%</td>}
                    {!hideStock && v('stock') && <td className="p-4">{wine.stockUnopened}U + {wine.stockOpened}O</td>}
                    {!hideStock && v('status') && <td className="p-4"><StockBadge wine={wine} /></td>}
                    {isAdmin && v('price') && <td className="p-4 text-accent">${wine.price}</td>}
                    {v('barcode') && <td className="p-4 text-xs text-muted-foreground font-mono">{wine.barcode || '—'}</td>}
                    {v('grapeVarieties') && <td className="p-4 text-xs text-muted-foreground">{wine.grapeVarieties.join(', ')}</td>}
                    {v('body') && <td className="p-4 text-xs text-muted-foreground capitalize">{wine.body || '—'}</td>}
                    {v('location') && <td className="p-4 text-xs text-muted-foreground">{wine.location}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
