import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { Navigate } from 'react-router-dom';
import { Search, Download, SlidersHorizontal, X, ClipboardCheck, Plus, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { useIsMobile } from '@/hooks/use-mobile';

const STOCK_COLUMN_DEFS: ColumnDef[] = [
  { key: 'wine', label: 'Wine' },
  { key: 'vintage', label: 'Vintage' },
  { key: 'type', label: 'Type' },
  { key: 'size', label: 'Size' },
  { key: 'region', label: 'Region' },
  { key: 'country', label: 'Country' },
  { key: 'closed', label: 'Closed' },
  { key: 'open', label: 'Open' },
  { key: 'total', label: 'Total' },
  { key: 'totalLitres', label: 'Total (L)' },
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
];

function StatusBadge({ total, min }: { total: number; min: number }) {
  if (total === 0) return <span className="wine-badge stock-out">✗ Out</span>;
  if (total < min) return <span className="wine-badge stock-low">⚠ Low</span>;
  return <span className="wine-badge stock-healthy">✓ In Stock</span>;
}

// Build DataTable column definitions for wine
function buildColumns(): DataTableColumn<Wine>[] {
  return [
    { key: 'wine', label: 'Wine', minWidth: 140, render: w => <span className="font-medium">{w.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'producer', label: 'Producer', render: w => <span className="text-muted-foreground">{w.producer}</span>, sortFn: (a, b) => a.producer.localeCompare(b.producer) },
    { key: 'vintage', label: 'Vintage', align: 'center', render: w => w.vintage || 'NV', sortFn: (a, b) => (b.vintage || 0) - (a.vintage || 0) },
    { key: 'type', label: 'Type', render: w => <span className="wine-badge bg-secondary text-secondary-foreground">{w.type}</span>, sortFn: (a, b) => a.type.localeCompare(b.type) },
    { key: 'size', label: 'Size', render: w => <span className="text-muted-foreground">{w.volume}ml</span> },
    { key: 'region', label: 'Region', render: w => <span className="text-muted-foreground">{w.region}</span>, sortFn: (a, b) => a.region.localeCompare(b.region) },
    { key: 'country', label: 'Country', render: w => <span className="text-muted-foreground">{w.country}</span>, sortFn: (a, b) => a.country.localeCompare(b.country) },
    { key: 'subRegion', label: 'Sub-Region', render: w => <span className="text-muted-foreground">{w.subRegion || '—'}</span> },
    { key: 'appellation', label: 'Appellation', render: w => <span className="text-xs text-muted-foreground">{w.appellation || '—'}</span> },
    { key: 'abv', label: 'ABV', align: 'center', render: w => <span className="text-muted-foreground">{w.abv}%</span>, sortFn: (a, b) => a.abv - b.abv },
    { key: 'closed', label: 'Closed', align: 'center', render: w => <span className="font-medium">{w.stockUnopened}</span>, sortFn: (a, b) => a.stockUnopened - b.stockUnopened },
    { key: 'open', label: 'Open', align: 'center', render: w => <span className="text-muted-foreground">{w.stockOpened}</span> },
    { key: 'total', label: 'Total', align: 'center', render: w => <span className="font-semibold">{w.stockUnopened + w.stockOpened}</span>, sortFn: (a, b) => (a.stockUnopened + a.stockOpened) - (b.stockUnopened + b.stockOpened) },
    { key: 'totalLitres', label: 'Total (L)', align: 'right', render: w => {
      const volL = (w.volume || 750) / 1000;
      const litres = (w.stockUnopened * volL) + (w.stockOpened * volL);
      return <span className="font-medium text-accent">{litres.toFixed(2)}L</span>;
    }, sortFn: (a, b) => {
      const aL = (a.stockUnopened * (a.volume || 750) / 1000) + (a.stockOpened * (a.volume || 750) / 1000);
      const bL = (b.stockUnopened * (b.volume || 750) / 1000) + (b.stockOpened * (b.volume || 750) / 1000);
      return aL - bL;
    }},
    { key: 'par', label: 'Par', align: 'center', render: w => <span className="text-muted-foreground">{w.minStockLevel}</span> },
    { key: 'status', label: 'Status', render: w => <StatusBadge total={w.stockUnopened + w.stockOpened} min={w.minStockLevel} /> },
    { key: 'value', label: 'Value', align: 'right', render: w => <span className="text-accent">${((w.stockUnopened + w.stockOpened) * w.price).toLocaleString()}</span>, sortFn: (a, b) => ((a.stockUnopened + a.stockOpened) * a.price) - ((b.stockUnopened + b.stockOpened) * b.price) },
    { key: 'purchasePrice', label: 'Purchase', align: 'right', render: w => <span className="text-muted-foreground">{w.purchasePrice ? `$${w.purchasePrice}` : '—'}</span>, sortFn: (a, b) => (a.purchasePrice || 0) - (b.purchasePrice || 0) },
    { key: 'salePrice', label: 'Sale', align: 'right', render: w => <span className="text-muted-foreground">{w.salePrice ? `$${w.salePrice}` : '—'}</span> },
    { key: 'glassPrice', label: 'Glass', align: 'right', render: w => <span className="text-muted-foreground">{w.glassPrice ? `$${w.glassPrice}` : '—'}</span> },
    { key: 'location', label: 'Location', render: w => <span className="text-xs text-muted-foreground">{w.location}</span>, sortFn: (a, b) => a.location.localeCompare(b.location) },
    { key: 'supplier', label: 'Supplier', render: w => <span className="text-xs text-muted-foreground">{w.supplierName || '—'}</span> },
    { key: 'barcode', label: 'Barcode', render: w => <span className="text-xs text-muted-foreground font-mono">{w.barcode || '—'}</span> },
    { key: 'sku', label: 'SKU', render: w => <span className="text-xs text-muted-foreground font-mono">{w.sku || '—'}</span> },
    { key: 'grapeVarieties', label: 'Grapes', render: w => <span className="text-xs text-muted-foreground">{w.grapeVarieties.join(', ')}</span> },
    { key: 'body', label: 'Body', render: w => <span className="text-xs text-muted-foreground capitalize">{w.body || '—'}</span> },
    { key: 'sweetness', label: 'Sweetness', render: w => <span className="text-xs text-muted-foreground capitalize">{w.sweetness || '—'}</span> },
    { key: 'closureType', label: 'Closure', render: w => <span className="text-xs text-muted-foreground capitalize">{w.closureType || '—'}</span> },
  ];
}

export default function CurrentStock() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { stockColumns, setStockColumns, stockFilters, setStockFilters, columnWidths, setColumnWidth } = useColumnStore();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [regionFilter, setRegionFilter] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [stockRange, setStockRange] = useState<[number, number]>([0, 100]);

  const totalValue = mockWines.reduce((s, w) => s + (w.stockUnopened + w.stockOpened) * w.price, 0);
  const totalBottles = mockWines.reduce((s, w) => s + w.stockUnopened + w.stockOpened, 0);

  const locations = useMemo(() => [...new Set(mockWines.filter(w => w.isActive && w.cellarSection).map(w => w.cellarSection!))].sort(), []);
  const regions = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.region))].sort(), []);
  const countries = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.country))].sort(), []);
  const types = ['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'];
  const statuses = ['In Stock', 'Low Stock', 'Out of Stock'];

  const activeFilterCount = [statusFilter, typeFilter, locationFilter, regionFilter, countryFilter].filter(f => f.length > 0).length + (stockRange[0] > 0 || stockRange[1] < 100 ? 1 : 0);

  const fv = (key: string) => stockFilters.includes(key);

  const clearFilters = () => {
    setStatusFilter([]);
    setTypeFilter([]);
    setLocationFilter([]);
    setRegionFilter([]);
    setCountryFilter([]);
    setStockRange([0, 100]);
  };

  const filtered = useMemo(() => {
    return mockWines.filter(w => {
      if (!w.isActive) return false;
      const total = w.stockUnopened + w.stockOpened;
      if (statusFilter.length > 0) {
        const wStatus = total === 0 ? 'Out of Stock' : total < w.minStockLevel ? 'Low Stock' : 'In Stock';
        if (!statusFilter.includes(wStatus)) return false;
      }
      if (typeFilter.length > 0 && !typeFilter.includes(w.type)) return false;
      if (locationFilter.length > 0 && !locationFilter.includes(w.cellarSection || '')) return false;
      if (regionFilter.length > 0 && !regionFilter.includes(w.region)) return false;
      if (countryFilter.length > 0 && !countryFilter.includes(w.country)) return false;
      if (total < stockRange[0] || total > stockRange[1]) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.producer.toLowerCase().includes(q);
      }
      return true;
    });
  }, [search, statusFilter, typeFilter, locationFilter, regionFilter, countryFilter, stockRange]);

  const tableColumns = useMemo(() => buildColumns(), []);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const getRowBg = (w: Wine) => {
    const total = w.stockUnopened + w.stockOpened;
    if (total === 0) return 'bg-destructive/5 border-l-2 border-l-destructive/40';
    if (total < w.minStockLevel) return 'bg-[hsl(var(--wine-warning)/0.04)] border-l-2 border-l-wine-warning/40';
    return 'border-l-2 border-l-transparent';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory</h1>
          <div className="flex items-center gap-2 sm:gap-4 mt-1 text-xs sm:text-sm">
            <span className="text-muted-foreground">{filtered.length} wines</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground hidden sm:inline">{totalBottles} bottles</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-accent font-semibold">${totalValue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant="outline" size="sm" className="border-border h-8 px-2 sm:px-3 text-xs" onClick={() => navigate('/catalog/new')}>
            <Plus className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Add New</span>
          </Button>
          <Button size="sm" className="wine-gradient text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 h-8 px-2 sm:px-3 text-xs" onClick={() => navigate('/count')}>
            <ClipboardCheck className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Start Count</span>
          </Button>
          <Button variant="outline" size="sm" className="border-border h-8 px-2 sm:px-3 text-xs" onClick={() => toast.info('Export coming soon')}>
            <Download className="w-3.5 h-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      {/* Search & filter bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search wine or producer..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        <Button
          variant="outline"
          size="icon"
          className={`h-10 w-10 shrink-0 border-border relative ${(isMobile ? mobileFiltersOpen : showFilters) ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
          onClick={() => isMobile ? setMobileFiltersOpen(true) : setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <ColumnManager columns={STOCK_COLUMN_DEFS} visibleColumns={stockColumns} onChange={setStockColumns} />
      </div>

      {/* Desktop inline filters */}
      {!isMobile && showFilters && (
        <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Advanced Filters</p>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all
                </Button>
              )}
              <FilterManager filters={STOCK_FILTERS} visibleFilters={stockFilters} onChange={setStockFilters} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {fv('status') && <MultiSelectFilter label="Status" options={statuses} selected={statusFilter} onChange={setStatusFilter} />}
            {fv('type') && <MultiSelectFilter label="Type" options={types} selected={typeFilter} onChange={setTypeFilter} />}
            {fv('country') && <MultiSelectFilter label="Country" options={countries} selected={countryFilter} onChange={setCountryFilter} />}
            {fv('region') && <MultiSelectFilter label="Region" options={regions} selected={regionFilter} onChange={setRegionFilter} />}
            {fv('location') && <MultiSelectFilter label="Location" options={locations} selected={locationFilter} onChange={setLocationFilter} />}
          </div>
          {fv('stockRange') && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Stock range: {stockRange[0]} – {stockRange[1]}+</p>
              <Slider value={stockRange} onValueChange={v => setStockRange(v as [number, number])} max={100} min={0} step={1} className="w-full max-w-xs" />
            </div>
          )}
        </div>
      )}

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom" className="bg-card border-border rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="text-foreground font-heading">Filters</SheetTitle>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                  <X className="w-3 h-3 mr-1" /> Clear all
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Filters</p>
              <FilterManager filters={STOCK_FILTERS} visibleFilters={stockFilters} onChange={setStockFilters} />
            </div>

            <div className="space-y-3">
              {fv('status') && (
                <div>
                  <p className="text-sm font-medium mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(s => (
                      <button
                        key={s}
                        onClick={() => statusFilter.includes(s) ? setStatusFilter(statusFilter.filter(x => x !== s)) : setStatusFilter([...statusFilter, s])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter.includes(s) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fv('type') && (
                <div>
                  <p className="text-sm font-medium mb-2">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {types.map(t => (
                      <button
                        key={t}
                        onClick={() => typeFilter.includes(t) ? setTypeFilter(typeFilter.filter(x => x !== t)) : setTypeFilter([...typeFilter, t])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${typeFilter.includes(t) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fv('country') && (
                <div>
                  <p className="text-sm font-medium mb-2">Country</p>
                  <div className="flex flex-wrap gap-2">
                    {countries.map(c => (
                      <button
                        key={c}
                        onClick={() => countryFilter.includes(c) ? setCountryFilter(countryFilter.filter(x => x !== c)) : setCountryFilter([...countryFilter, c])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${countryFilter.includes(c) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fv('region') && (
                <div>
                  <p className="text-sm font-medium mb-2">Region</p>
                  <div className="flex flex-wrap gap-2">
                    {regions.map(r => (
                      <button
                        key={r}
                        onClick={() => regionFilter.includes(r) ? setRegionFilter(regionFilter.filter(x => x !== r)) : setRegionFilter([...regionFilter, r])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${regionFilter.includes(r) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fv('location') && (
                <div>
                  <p className="text-sm font-medium mb-2">Location</p>
                  <div className="flex flex-wrap gap-2">
                    {locations.map(l => (
                      <button
                        key={l}
                        onClick={() => locationFilter.includes(l) ? setLocationFilter(locationFilter.filter(x => x !== l)) : setLocationFilter([...locationFilter, l])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${locationFilter.includes(l) ? 'bg-primary/15 border-primary/40 text-primary' : 'border-border text-muted-foreground hover:border-foreground/20'}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {fv('stockRange') && (
                <div>
                  <p className="text-sm font-medium mb-2">Stock range: {stockRange[0]} – {stockRange[1]}+</p>
                  <Slider value={stockRange} onValueChange={v => setStockRange(v as [number, number])} max={100} min={0} step={1} className="w-full" />
                </div>
              )}
            </div>
          </div>

          <Button className="w-full wine-gradient text-primary-foreground h-11 mt-2" onClick={() => setMobileFiltersOpen(false)}>
            Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Button>
        </SheetContent>
      </Sheet>


      {/* Table for all viewports */}
      <div className="wine-glass-effect rounded-xl overflow-hidden">
        <DataTable
          data={filtered}
          columns={tableColumns}
          visibleColumns={stockColumns}
          columnWidths={columnWidths}
          onColumnResize={setColumnWidth}
          keyExtractor={w => w.id}
          rowClassName={getRowBg}
          onRowClick={w => navigate(`/catalog/${w.id}`)}
          emptyMessage="No wines match your filters"
          compact
        />
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
