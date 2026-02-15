import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, Product } from '@/hooks/useProducts';
import { useSyrveCategories } from '@/hooks/useSyrve';
import { useStores } from '@/hooks/useStores';
import { Search, SlidersHorizontal, LayoutGrid, Table2, Package, X, MoreHorizontal, Eye, Copy, History, Trash2, CheckSquare, Download, Tag, Power, FolderTree, Store, Layers, Warehouse, AlertTriangle, Ban, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import ProductGroupedView from '@/components/ProductGroupedView';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'all' | 'category' | 'store' | 'type';

const VIEW_MODES: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Layers },
  { value: 'category', label: 'By Category', icon: FolderTree },
  { value: 'store', label: 'By Store', icon: Store },
  { value: 'type', label: 'By Type', icon: Tag },
];

const PRODUCT_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'unit_capacity', label: 'Volume (L)' },
  { key: 'containers', label: 'Containers' },
  { key: 'synced_at', label: 'Synced At' },
];

const PRODUCT_FILTER_DEFS: FilterDef[] = [
  { key: 'type', label: 'Product Type' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock Status' },
  { key: 'volume', label: 'Volume (L)' },
  { key: 'has_price', label: 'Has Price' },
];

function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = {
    GOODS: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    DISH: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    MODIFIER: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    OUTER: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    PREPARED: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[type || ''] || 'bg-secondary text-secondary-foreground border border-border'}`}>{type || '—'}</span>;
}

function StockIndicator({ stock }: { stock: number | null }) {
  if (stock === null || stock === undefined) return <span className="text-muted-foreground">—</span>;
  if (stock <= 0) return <span className="inline-flex items-center gap-1 text-destructive font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-destructive" />{stock}</span>;
  if (stock < 5) return <span className="inline-flex items-center gap-1 text-amber-500 font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{stock}</span>;
  return <span className="inline-flex items-center gap-1 font-semibold" style={{ color: 'hsl(var(--wine-success))' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--wine-success))' }} />{stock}</span>;
}

function ContainerInfo({ syrveData }: { syrveData: any }) {
  const containers = syrveData?.containers;
  if (!Array.isArray(containers) || containers.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {containers.slice(0, 3).map((c: any, i: number) => (
        <span key={i} className="text-xs text-muted-foreground">
          {c.name || 'unit'}{c.count != null ? ` (${c.count}L)` : ''}
        </span>
      ))}
      {containers.length > 3 && <span className="text-xs text-muted-foreground/60">+{containers.length - 3} more</span>}
    </div>
  );
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const containers = product.syrve_data?.containers;
  return (
    <div className="rounded-xl overflow-hidden group transition-all duration-300 border border-border hover:border-primary/30 hover:shadow-lg cursor-pointer bg-card" onClick={onClick}>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-sm line-clamp-2">{product.name}</h3>
          <TypeBadge type={product.product_type} />
        </div>
        <p className="text-xs text-muted-foreground truncate">{product.categories?.name || 'Uncategorized'}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {product.sku && <span>SKU: {product.sku}</span>}
          {product.code && <><span className="text-border">•</span><span>{product.code}</span></>}
        </div>
        {(product.unit_capacity || (Array.isArray(containers) && containers.length > 0)) && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {product.unit_capacity != null && <span>{product.unit_capacity}L</span>}
            {Array.isArray(containers) && containers.length > 0 && (
              <span className="text-border">
                {containers.map((c: any) => c.name).filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="text-xs">
            <span className="text-muted-foreground">Stock: </span>
            <StockIndicator stock={product.current_stock} />
          </div>
          <div className="flex items-center gap-2">
            {product.purchase_price != null && (
              <span className="text-[11px] text-muted-foreground">{product.purchase_price.toFixed(2)}</span>
            )}
            {product.sale_price != null && (
              <span className="text-xs text-accent font-medium">{product.sale_price.toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowActionsMenu({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.id}`); }}><Eye className="w-3.5 h-3.5 mr-2" />View Details</DropdownMenuItem>
        <DropdownMenuItem onClick={e => e.stopPropagation()}><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={e => e.stopPropagation()}><History className="w-3.5 h-3.5 mr-2" />View History</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={e => e.stopPropagation()}><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { productColumns, setProductColumns, productFilters, setProductFilters, columnWidths, setColumnWidth } = useColumnStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [stockStatusFilter, setStockStatusFilter] = useState<string[]>([]);
  const [volumeFilter, setVolumeFilter] = useState<string[]>([]);
  const [hasPriceFilter, setHasPriceFilter] = useState(false);
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Quick filters
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const categoryFromUrl = searchParams.get('category') || undefined;

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: typeFilter.length ? typeFilter : undefined,
    categoryId: categoryFromUrl,
  });

  const { data: categories = [] } = useSyrveCategories();
  const { data: stores = [] } = useStores();

  const productTypes = useMemo(() => [...new Set(products.map(p => p.product_type).filter(Boolean) as string[])].sort(), [products]);
  const categoryOptions = useMemo(() => [...new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])].sort(), [products]);
  const volumeOptions = useMemo(() => [...new Set(products.map(p => p.unit_capacity != null ? String(p.unit_capacity) : null).filter(Boolean) as string[])].sort((a, b) => Number(a) - Number(b)), [products]);
  const stockStatusOptions = useMemo(() => {
    const opts: string[] = [];
    if (products.some(p => (p.current_stock ?? 0) <= 0)) opts.push('Out of Stock');
    if (products.some(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5)) opts.push('Low Stock');
    if (products.some(p => (p.current_stock ?? 0) >= 5)) opts.push('In Stock');
    return opts;
  }, [products]);

  // Quick filter counts
  const quickFilterCounts = useMemo(() => ({
    lowStock: products.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5).length,
    outOfStock: products.filter(p => (p.current_stock ?? 0) <= 0).length,
    noPrice: products.filter(p => p.sale_price == null || p.sale_price === 0).length,
    inactive: products.filter(p => !p.is_active).length,
  }), [products]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter.length > 0) result = result.filter(p => categoryFilter.includes(p.categories?.name || ''));
    if (stockStatusFilter.length > 0) {
      result = result.filter(p => {
        const s = p.current_stock ?? 0;
        if (s <= 0) return stockStatusFilter.includes('Out of Stock');
        if (s < 5) return stockStatusFilter.includes('Low Stock');
        return stockStatusFilter.includes('In Stock');
      });
    }
    if (volumeFilter.length > 0) result = result.filter(p => p.unit_capacity != null && volumeFilter.includes(String(p.unit_capacity)));
    if (hasPriceFilter) result = result.filter(p => p.sale_price != null && p.sale_price > 0);

    // Apply quick filter
    if (quickFilter === 'lowStock') result = result.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5);
    if (quickFilter === 'outOfStock') result = result.filter(p => (p.current_stock ?? 0) <= 0);
    if (quickFilter === 'noPrice') result = result.filter(p => p.sale_price == null || p.sale_price === 0);
    if (quickFilter === 'inactive') result = result.filter(p => !p.is_active);

    return result;
  }, [products, categoryFilter, stockStatusFilter, volumeFilter, hasPriceFilter, quickFilter]);

  const activeFilterCount = [typeFilter, categoryFilter, stockStatusFilter, volumeFilter].filter(f => f.length > 0).length + (categoryFromUrl ? 1 : 0) + (hasPriceFilter ? 1 : 0);
  const fv = (key: string) => productFilters.includes(key);

  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    typeFilter.forEach(t => pills.push({ key: `type-${t}`, label: `Type: ${t}`, onRemove: () => setTypeFilter(prev => prev.filter(x => x !== t)) }));
    categoryFilter.forEach(c => pills.push({ key: `cat-${c}`, label: `Category: ${c}`, onRemove: () => setCategoryFilter(prev => prev.filter(x => x !== c)) }));
    stockStatusFilter.forEach(s => pills.push({ key: `stock-${s}`, label: s, onRemove: () => setStockStatusFilter(prev => prev.filter(x => x !== s)) }));
    volumeFilter.forEach(v => pills.push({ key: `vol-${v}`, label: `${v}L`, onRemove: () => setVolumeFilter(prev => prev.filter(x => x !== v)) }));
    if (hasPriceFilter) pills.push({ key: 'price', label: 'Has Price', onRemove: () => setHasPriceFilter(false) });
    if (categoryFromUrl) {
      const catName = categories.find(c => c.id === categoryFromUrl)?.name || categoryFromUrl;
      pills.push({ key: 'url-cat', label: `Category: ${catName}`, onRemove: () => navigate('/products') });
    }
    return pills;
  }, [typeFilter, categoryFilter, stockStatusFilter, volumeFilter, hasPriceFilter, categoryFromUrl, categories, navigate]);

  const clearFilters = () => {
    setTypeFilter([]); setCategoryFilter([]); setStockStatusFilter([]); setVolumeFilter([]); setHasPriceFilter(false); setQuickFilter(null);
    if (categoryFromUrl) navigate('/products');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredProducts.map(p => p.id)));
  };

  const tableColumns = useMemo((): DataTableColumn<Product>[] => [
    { key: 'select', label: '', minWidth: 40, render: p => (
      <div onClick={e => e.stopPropagation()}>
        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
      </div>
    ) },
    { key: 'name', label: 'Name', minWidth: 180, render: p => <span className="font-medium">{p.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{p.categories?.name || '—'}</span> },
    { key: 'type', label: 'Type', render: p => <TypeBadge type={p.product_type} />, sortFn: (a, b) => (a.product_type || '').localeCompare(b.product_type || '') },
    { key: 'sale_price', label: 'Sale Price', align: 'right', render: p => <span className="text-accent font-medium">{p.sale_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.sale_price || 0) - (b.sale_price || 0) },
    { key: 'purchase_price', label: 'Purchase Price', align: 'right', render: p => <span className="text-muted-foreground">{p.purchase_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0) },
    { key: 'stock', label: 'Stock', align: 'right', render: p => <StockIndicator stock={p.current_stock} />, sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0) },
    { key: 'unit_capacity', label: 'Volume (L)', align: 'right', render: p => <span className="text-muted-foreground">{p.unit_capacity ?? '—'}</span>, sortFn: (a, b) => (a.unit_capacity || 0) - (b.unit_capacity || 0) },
    { key: 'containers', label: 'Containers', render: p => <ContainerInfo syrveData={p.syrve_data} /> },
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', minWidth: 40, render: p => <RowActionsMenu product={p} /> },
  ], [selectedIds]);

  const visibleCols = useMemo(() => ['select', ...productColumns, 'actions'], [productColumns]);

  const toggleQuickFilter = (key: string) => {
    setQuickFilter(prev => prev === key ? null : key);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">{filteredProducts.length} products from Syrve</p>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit border border-border bg-card">
        {VIEW_MODES.map(m => (
          <button
            key={m.value}
            onClick={() => setViewMode(m.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${viewMode === m.value ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
          >
            <m.icon className="w-3.5 h-3.5" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Quick Filters - Always Visible */}
      <div className="quick-filter-bar">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick:</span>
        <button onClick={() => toggleQuickFilter('lowStock')} className={`quick-filter-pill ${quickFilter === 'lowStock' ? 'active' : ''}`}>
          <AlertTriangle className="w-3 h-3" /> Low Stock <span className="text-[10px] opacity-70">({quickFilterCounts.lowStock})</span>
        </button>
        <button onClick={() => toggleQuickFilter('outOfStock')} className={`quick-filter-pill ${quickFilter === 'outOfStock' ? 'active' : ''}`}>
          <Ban className="w-3 h-3" /> Out of Stock <span className="text-[10px] opacity-70">({quickFilterCounts.outOfStock})</span>
        </button>
        <button onClick={() => toggleQuickFilter('noPrice')} className={`quick-filter-pill ${quickFilter === 'noPrice' ? 'active' : ''}`}>
          <DollarSign className="w-3 h-3" /> No Price <span className="text-[10px] opacity-70">({quickFilterCounts.noPrice})</span>
        </button>
        <button onClick={() => toggleQuickFilter('inactive')} className={`quick-filter-pill ${quickFilter === 'inactive' ? 'active' : ''}`}>
          <Power className="w-3 h-3" /> Inactive <span className="text-[10px] opacity-70">({quickFilterCounts.inactive})</span>
        </button>
        {quickFilter && (
          <button onClick={() => setQuickFilter(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          <div className="flex items-center gap-2">
            <MultiSelectFilter label="Type" options={productTypes} selected={typeFilter} onChange={setTypeFilter} />
            <MultiSelectFilter label="Category" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />
            <MultiSelectFilter label="Stock" options={stockStatusOptions} selected={stockStatusFilter} onChange={setStockStatusFilter} />
            {stores.length > 0 && (
              <MultiSelectFilter label="Store" options={stores.map(s => s.name)} selected={[]} onChange={() => {}} />
            )}
          </div>
          {viewMode === 'all' && view === 'table' && (
            <ColumnManager columns={PRODUCT_COLUMN_DEFS} visibleColumns={productColumns} onChange={setProductColumns} />
          )}
          {viewMode === 'all' && (
            <div className="flex border border-border rounded-lg overflow-hidden bg-card">
              <button onClick={() => setView('cards')} className={`p-2.5 transition-all duration-200 ${view === 'cards' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}><LayoutGrid className="w-5 h-5" /></button>
              <button onClick={() => setView('table')} className={`p-2.5 transition-all duration-200 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'}`}><Table2 className="w-5 h-5" /></button>
            </div>
          )}
        </div>

        {/* Active Filter Pills */}
        {activeFilterPills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {activeFilterPills.map(pill => (
              <Badge key={pill.key} variant="secondary" className="gap-1 cursor-pointer text-xs hover:bg-destructive/10 hover:text-destructive transition-colors border border-border" onClick={pill.onRemove}>
                {pill.label}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            {activeFilterPills.length > 1 && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2" onClick={clearFilters}>Clear all</Button>
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : viewMode !== 'all' ? (
        <ProductGroupedView products={filteredProducts} mode={viewMode} />
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(p => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${p.id}`)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <DataTable
            data={filteredProducts}
            columns={tableColumns}
            visibleColumns={visibleCols}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={p => p.id}
            onRowClick={p => navigate(`/products/${p.id}`)}
            emptyMessage="No products match your filters"
          />
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && viewMode === 'all' && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No products found. Run a Syrve sync first.</p>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary/30 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
          </div>
          <div className="h-5 w-px bg-border" />
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Download className="w-3.5 h-3.5" />Export</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Tag className="w-3.5 h-3.5" />Change Category</Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Power className="w-3.5 h-3.5" />Deactivate</Button>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>Cancel</Button>
        </div>
      )}
    </div>
  );
}