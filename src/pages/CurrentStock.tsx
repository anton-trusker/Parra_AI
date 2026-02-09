import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Navigate } from 'react-router-dom';
import { Search, Download, SlidersHorizontal, X, Wine, ClipboardCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';

const STOCK_COLUMNS: ColumnDef[] = [
  { key: 'wine', label: 'Wine' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'type', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'region', label: 'Region' },
  { key: 'country', label: 'Country' },
  { key: 'closed', label: 'Closed' },
  { key: 'open', label: 'Open' },
  { key: 'total', label: 'Total' },
  { key: 'par', label: 'Par Level' },
  { key: 'status', label: 'Status' },
  { key: 'value', label: 'Value' },
  { key: 'location', label: 'Location' },
  { key: 'producer', label: 'Producer' },
  { key: 'appellation', label: 'Appellation' },
  { key: 'subRegion', label: 'Sub-Region' },
  { key: 'abv', label: 'ABV' },
  { key: 'grapeVarieties', label: 'Grapes' },
  { key: 'purchasePrice', label: 'Purchase Price' },
  { key: 'salePrice', label: 'Sale Price' },
  { key: 'glassPrice', label: 'Glass Price' },
  { key: 'supplier', label: 'Supplier' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'sku', label: 'SKU' },
  { key: 'body', label: 'Body' },
  { key: 'sweetness', label: 'Sweetness' },
  { key: 'closureType', label: 'Closure' },
];

const STOCK_FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'country', label: 'Country' },
  { key: 'region', label: 'Region' },
  { key: 'location', label: 'Location' },
  { key: 'stockRange', label: 'Stock Range' },
  { key: 'sort', label: 'Sort By' },
];

type SortOption = 'name' | 'stock' | 'value' | 'location' | 'vintage' | 'type';

export default function CurrentStock() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { stockColumns, setStockColumns, stockFilters, setStockFilters } = useColumnStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 100]);

  const totalValue = mockWines.reduce((s, w) => s + (w.stockUnopened + w.stockOpened) * w.price, 0);
  const totalBottles = mockWines.reduce((s, w) => s + w.stockUnopened + w.stockOpened, 0);

  const locations = useMemo(() => [...new Set(mockWines.filter(w => w.isActive && w.cellarSection).map(w => w.cellarSection!))].sort(), []);
  const regions = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.region))].sort(), []);
  const countries = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.country))].sort(), []);

  const activeFilterCount = [statusFilter, typeFilter, locationFilter, regionFilter, countryFilter].filter(f => f !== 'all').length + (stockRange[0] > 0 || stockRange[1] < 100 ? 1 : 0);

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setLocationFilter('all');
    setRegionFilter('all');
    setCountryFilter('all');
    setStockRange([0, 100]);
  };

  const filtered = useMemo(() => {
    let wines = mockWines.filter(w => {
      if (!w.isActive) return false;
      const total = w.stockUnopened + w.stockOpened;
      if (statusFilter === 'in-stock' && total < w.minStockLevel) return false;
      if (statusFilter === 'low' && (total >= w.minStockLevel || total === 0)) return false;
      if (statusFilter === 'out' && total > 0) return false;
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (locationFilter !== 'all' && w.cellarSection !== locationFilter) return false;
      if (regionFilter !== 'all' && w.region !== regionFilter) return false;
      if (countryFilter !== 'all' && w.country !== countryFilter) return false;
      if (total < stockRange[0] || total > stockRange[1]) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.producer.toLowerCase().includes(q);
      }
      return true;
    });

    wines.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'stock': return (b.stockUnopened + b.stockOpened) - (a.stockUnopened + a.stockOpened);
        case 'value': return ((b.stockUnopened + b.stockOpened) * b.price) - ((a.stockUnopened + a.stockOpened) * a.price);
        case 'location': return (a.location || '').localeCompare(b.location || '');
        case 'vintage': return (b.vintage || 0) - (a.vintage || 0);
        case 'type': return a.type.localeCompare(b.type);
        default: return 0;
      }
    });

    return wines;
  }, [search, statusFilter, typeFilter, locationFilter, regionFilter, countryFilter, sortBy, stockRange]);

  if (user?.roleId !== 'role_admin') return <Navigate to="/dashboard" replace />;

  const v = (key: string) => stockColumns.includes(key);
  const fv = (key: string) => stockFilters.includes(key);

  const getRowBg = (total: number, min: number) => {
    if (total === 0) return 'bg-destructive/5 border-l-2 border-l-destructive/40';
    if (total < min) return 'bg-[hsl(var(--wine-warning)/0.04)] border-l-2 border-l-wine-warning/40';
    return 'border-l-2 border-l-transparent';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with summary stats */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory</h1>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-muted-foreground">{filtered.length} wines</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{totalBottles} bottles</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-accent font-semibold">${totalValue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="wine-gradient text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
            onClick={() => navigate('/count')}
          >
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Start Count
          </Button>
          <Button variant="outline" size="sm" className="border-border" onClick={() => toast.info('Export coming soon')}>
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search wine or producer..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          {fv('status') && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-11 bg-card border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
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
          <FilterManager filters={STOCK_FILTERS} visibleFilters={stockFilters} onChange={setStockFilters} />
          <ColumnManager columns={STOCK_COLUMNS} visibleColumns={stockColumns} onChange={setStockColumns} />
        </div>

        {showFilters && (
          <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {fv('type') && (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 bg-card border-border text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {['Red', 'White', 'Rosé', 'Sparkling'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('country') && (
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="h-9 bg-card border-border text-sm"><SelectValue placeholder="Country" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('region') && (
                <Select value={regionFilter} onValueChange={setRegionFilter}>
                  <SelectTrigger className="h-9 bg-card border-border text-sm"><SelectValue placeholder="Region" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('location') && (
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-9 bg-card border-border text-sm"><SelectValue placeholder="Location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {fv('sort') && (
                <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
                  <SelectTrigger className="h-9 bg-card border-border text-sm"><SelectValue placeholder="Sort" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="stock">Stock Level</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {fv('stockRange') && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">Stock range: {stockRange[0]} – {stockRange[1]}+</p>
                <Slider
                  value={stockRange}
                  onValueChange={(v) => setStockRange(v as [number, number])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full max-w-xs"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filtered.map(w => {
          const total = w.stockUnopened + w.stockOpened;
          const value = total * w.price;
          let statusCls = 'stock-healthy';
          let statusLabel = '✓ In Stock';
          if (total === 0) { statusCls = 'stock-out'; statusLabel = '✗ Out'; }
          else if (total < w.minStockLevel) { statusCls = 'stock-low'; statusLabel = '⚠ Low'; }
          return (
            <div key={w.id} className={`wine-glass-effect rounded-xl p-4 ${getRowBg(total, w.minStockLevel)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.producer} • {w.vintage || 'NV'} • {w.volume}ml</p>
                  <p className="text-xs text-muted-foreground">{w.region}, {w.country}</p>
                </div>
                <span className={`wine-badge ${statusCls} ml-2 whitespace-nowrap`}>{statusLabel}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center"><p className="text-xs text-muted-foreground">Closed</p><p className="font-semibold">{w.stockUnopened}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Open</p><p className="font-semibold">{w.stockOpened}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-foreground">{total}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Value</p><p className="font-semibold text-accent">${value.toLocaleString()}</p></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Par: {w.minStockLevel}</span>
                <span>{w.location}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                {v('wine') && <th className="text-left p-4 font-medium">Wine</th>}
                {v('producer') && <th className="text-left p-4 font-medium">Producer</th>}
                {v('vintage') && <th className="text-left p-4 font-medium">Vintage</th>}
                {v('type') && <th className="text-left p-4 font-medium">Type</th>}
                {v('size') && <th className="text-left p-4 font-medium">Size</th>}
                {v('region') && <th className="text-left p-4 font-medium">Region</th>}
                {v('subRegion') && <th className="text-left p-4 font-medium">Sub-Region</th>}
                {v('country') && <th className="text-left p-4 font-medium">Country</th>}
                {v('appellation') && <th className="text-left p-4 font-medium">Appellation</th>}
                {v('abv') && <th className="text-center p-4 font-medium">ABV</th>}
                {v('closed') && <th className="text-center p-4 font-medium">Closed</th>}
                {v('open') && <th className="text-center p-4 font-medium">Open</th>}
                {v('total') && <th className="text-center p-4 font-medium">Total</th>}
                {v('par') && <th className="text-center p-4 font-medium">Par</th>}
                {v('status') && <th className="text-left p-4 font-medium">Status</th>}
                {v('value') && <th className="text-right p-4 font-medium">Value</th>}
                {v('purchasePrice') && <th className="text-right p-4 font-medium">Purchase</th>}
                {v('salePrice') && <th className="text-right p-4 font-medium">Sale</th>}
                {v('glassPrice') && <th className="text-right p-4 font-medium">Glass</th>}
                {v('location') && <th className="text-left p-4 font-medium">Location</th>}
                {v('supplier') && <th className="text-left p-4 font-medium">Supplier</th>}
                {v('barcode') && <th className="text-left p-4 font-medium">Barcode</th>}
                {v('sku') && <th className="text-left p-4 font-medium">SKU</th>}
                {v('grapeVarieties') && <th className="text-left p-4 font-medium">Grapes</th>}
                {v('body') && <th className="text-left p-4 font-medium">Body</th>}
                {v('sweetness') && <th className="text-left p-4 font-medium">Sweetness</th>}
                {v('closureType') && <th className="text-left p-4 font-medium">Closure</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const total = w.stockUnopened + w.stockOpened;
                const value = total * w.price;
                let statusCls = 'stock-healthy';
                let statusLabel = '✓ In Stock';
                if (total === 0) { statusCls = 'stock-out'; statusLabel = '✗ Out'; }
                else if (total < w.minStockLevel) { statusCls = 'stock-low'; statusLabel = '⚠ Low'; }
                return (
                  <tr key={w.id} className={`border-b border-border/50 hover:bg-wine-surface-hover transition-colors ${getRowBg(total, w.minStockLevel)}`}>
                    {v('wine') && <td className="p-4"><p className="font-medium">{w.name}</p></td>}
                    {v('producer') && <td className="p-4 text-muted-foreground">{w.producer}</td>}
                    {v('vintage') && <td className="p-4">{w.vintage || 'NV'}</td>}
                    {v('type') && <td className="p-4"><span className="wine-badge bg-secondary text-secondary-foreground">{w.type}</span></td>}
                    {v('size') && <td className="p-4 text-muted-foreground">{w.volume}ml</td>}
                    {v('region') && <td className="p-4 text-muted-foreground">{w.region}</td>}
                    {v('subRegion') && <td className="p-4 text-muted-foreground">{w.subRegion || '—'}</td>}
                    {v('country') && <td className="p-4 text-muted-foreground">{w.country}</td>}
                    {v('appellation') && <td className="p-4 text-muted-foreground text-xs">{w.appellation || '—'}</td>}
                    {v('abv') && <td className="p-4 text-center text-muted-foreground">{w.abv}%</td>}
                    {v('closed') && <td className="p-4 text-center font-medium">{w.stockUnopened}</td>}
                    {v('open') && <td className="p-4 text-center text-muted-foreground">{w.stockOpened}</td>}
                    {v('total') && <td className="p-4 text-center font-semibold">{total}</td>}
                    {v('par') && <td className="p-4 text-center text-muted-foreground">{w.minStockLevel}</td>}
                    {v('status') && <td className="p-4"><span className={`wine-badge ${statusCls}`}>{statusLabel}</span></td>}
                    {v('value') && <td className="p-4 text-right text-accent">${value.toLocaleString()}</td>}
                    {v('purchasePrice') && <td className="p-4 text-right text-muted-foreground">{w.purchasePrice ? `$${w.purchasePrice}` : '—'}</td>}
                    {v('salePrice') && <td className="p-4 text-right text-muted-foreground">{w.salePrice ? `$${w.salePrice}` : '—'}</td>}
                    {v('glassPrice') && <td className="p-4 text-right text-muted-foreground">{w.glassPrice ? `$${w.glassPrice}` : '—'}</td>}
                    {v('location') && <td className="p-4 text-xs text-muted-foreground">{w.location}</td>}
                    {v('supplier') && <td className="p-4 text-xs text-muted-foreground">{w.supplierName || '—'}</td>}
                    {v('barcode') && <td className="p-4 text-xs text-muted-foreground font-mono">{w.barcode || '—'}</td>}
                    {v('sku') && <td className="p-4 text-xs text-muted-foreground font-mono">{w.sku}</td>}
                    {v('grapeVarieties') && <td className="p-4 text-xs text-muted-foreground">{w.grapeVarieties.join(', ')}</td>}
                    {v('body') && <td className="p-4 text-xs text-muted-foreground capitalize">{w.body || '—'}</td>}
                    {v('sweetness') && <td className="p-4 text-xs text-muted-foreground capitalize">{w.sweetness || '—'}</td>}
                    {v('closureType') && <td className="p-4 text-xs text-muted-foreground capitalize">{w.closureType || '—'}</td>}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No wines match your filters</p>
          <Button variant="ghost" className="mt-2 text-accent" onClick={clearFilters}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
}
