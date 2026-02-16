import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, Product } from '@/hooks/useProducts';
import { useSyrveCategories } from '@/hooks/useSyrve';
import { useStores } from '@/hooks/useStores';
import { Search, SlidersHorizontal, LayoutGrid, Table2, Package, X, MoreHorizontal, Eye, Copy, History, Trash2, CheckSquare, Download, Tag, Power, FolderTree, Store, Layers, Warehouse, AlertTriangle, Ban, DollarSign, ChevronRight, ChevronDown, UtensilsCrossed, BoxIcon, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

/* ─── Shared components ─── */

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

/* ─── Column definitions per tab ─── */

const GOODS_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit' },
  { key: 'unit_capacity', label: 'Volume/Weight' },
  { key: 'containers', label: 'Containers' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'dishes_count', label: 'Dishes' },
  { key: 'synced_at', label: 'Synced At' },
];

const DISHES_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'parent', label: 'Linked Goods' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'unit', label: 'Unit' },
  { key: 'unit_capacity', label: 'Volume' },
  { key: 'synced_at', label: 'Synced At' },
];

/* ─── Main component ─── */

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { productColumns, setProductColumns, columnWidths, setColumnWidth } = useColumnStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [stockStatusFilter, setStockStatusFilter] = useState<string[]>([]);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('all');

  const categoryFromUrl = searchParams.get('category') || undefined;

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: typeFilter.length ? typeFilter : undefined,
    categoryId: categoryFromUrl,
  });

  const { data: categories = [] } = useSyrveCategories();
  const { data: stores = [] } = useStores();

  // Split products by type
  const goodsProducts = useMemo(() => products.filter(p => p.product_type === 'GOODS'), [products]);
  const dishProducts = useMemo(() => products.filter(p => p.product_type === 'DISH' || p.product_type === 'PREPARED'), [products]);

  // Build goods→dishes map for "All" tab hierarchy
  const goodsToDishesMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const d of dishProducts) {
      const parentId = (Array.isArray(d.parent_product) ? d.parent_product[0]?.id : d.parent_product?.id) || '__orphan__';
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(d);
    }
    return map;
  }, [dishProducts]);

  const orphanDishes = useMemo(() => goodsToDishesMap.get('__orphan__') || [], [goodsToDishesMap]);

  // Filter options
  const categoryOptions = useMemo(() => [...new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])].sort(), [products]);
  const stockStatusOptions = useMemo(() => {
    const opts: string[] = [];
    if (products.some(p => (p.current_stock ?? 0) <= 0)) opts.push('Out of Stock');
    if (products.some(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5)) opts.push('Low Stock');
    if (products.some(p => (p.current_stock ?? 0) >= 5)) opts.push('In Stock');
    return opts;
  }, [products]);

  // Apply local filters
  const applyFilters = (list: Product[]) => {
    let result = list;
    if (categoryFilter.length > 0) result = result.filter(p => categoryFilter.includes(p.categories?.name || ''));
    if (stockStatusFilter.length > 0) {
      result = result.filter(p => {
        const s = p.current_stock ?? 0;
        if (s <= 0) return stockStatusFilter.includes('Out of Stock');
        if (s < 5) return stockStatusFilter.includes('Low Stock');
        return stockStatusFilter.includes('In Stock');
      });
    }
    if (quickFilter === 'lowStock') result = result.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5);
    if (quickFilter === 'outOfStock') result = result.filter(p => (p.current_stock ?? 0) <= 0);
    if (quickFilter === 'noPrice') result = result.filter(p => p.sale_price == null || p.sale_price === 0);
    if (quickFilter === 'inactive') result = result.filter(p => !p.is_active);
    return result;
  };

  const filteredGoods = useMemo(() => applyFilters(goodsProducts), [goodsProducts, categoryFilter, stockStatusFilter, quickFilter]);
  const filteredDishes = useMemo(() => applyFilters(dishProducts), [dishProducts, categoryFilter, stockStatusFilter, quickFilter]);
  const filteredAll = useMemo(() => applyFilters(products), [products, categoryFilter, stockStatusFilter, quickFilter]);

  // Quick filter counts (on all products)
  const quickFilterCounts = useMemo(() => ({
    lowStock: products.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5).length,
    outOfStock: products.filter(p => (p.current_stock ?? 0) <= 0).length,
    noPrice: products.filter(p => p.sale_price == null || p.sale_price === 0).length,
    inactive: products.filter(p => !p.is_active).length,
  }), [products]);

  const toggleQuickFilter = (key: string) => setQuickFilter(prev => prev === key ? null : key);

  const clearFilters = () => {
    setTypeFilter([]); setCategoryFilter([]); setStockStatusFilter([]); setQuickFilter(null);
    if (categoryFromUrl) navigate('/products');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ─── Goods table columns ─── */
  const goodsColumns = useMemo((): DataTableColumn<Product>[] => [
    { key: 'select', label: '', minWidth: 40, render: p => (
      <div onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></div>
    ) },
    { key: 'name', label: 'Name', minWidth: 200, render: p => {
      const dishCount = goodsToDishesMap.get(p.id)?.length || 0;
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{p.name}</span>
          {dishCount > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 text-amber-400 border-amber-500/30"><UtensilsCrossed className="w-3 h-3" />{dishCount}</Badge>}
        </div>
      );
    }, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{p.categories?.name || '—'}</span> },
    { key: 'unit', label: 'Unit', render: p => <span className="text-muted-foreground text-xs">{p.syrve_data?.mainUnit || '—'}</span> },
    { key: 'unit_capacity', label: 'Volume/Weight', align: 'right', render: p => <span className="text-muted-foreground">{p.unit_capacity ?? '—'}</span>, sortFn: (a, b) => (a.unit_capacity || 0) - (b.unit_capacity || 0) },
    { key: 'containers', label: 'Containers', render: p => <ContainerInfo syrveData={p.syrve_data} /> },
    { key: 'purchase_price', label: 'Purchase Price', align: 'right', render: p => <span className="text-muted-foreground">{p.purchase_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0) },
    { key: 'stock', label: 'Stock', align: 'right', render: p => <StockIndicator stock={p.current_stock} />, sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0) },
    { key: 'dishes_count', label: 'Dishes', align: 'center', render: p => {
      const count = goodsToDishesMap.get(p.id)?.length || 0;
      return count > 0 ? <span className="text-amber-400 font-medium">{count}</span> : <span className="text-muted-foreground">—</span>;
    }},
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', minWidth: 40, render: p => <RowActionsMenu product={p} /> },
  ], [selectedIds, goodsToDishesMap]);

  /* ─── Dishes table columns ─── */
  const dishesColumns = useMemo((): DataTableColumn<Product>[] => [
    { key: 'select', label: '', minWidth: 40, render: p => (
      <div onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></div>
    ) },
    { key: 'name', label: 'Name', minWidth: 200, render: p => <span className="font-medium">{p.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{p.categories?.name || '—'}</span> },
    { key: 'parent', label: 'Linked Goods', minWidth: 160, render: p => {
      const parent = Array.isArray(p.parent_product) ? p.parent_product[0] : p.parent_product;
      if (!parent) return <span className="text-muted-foreground/50 text-xs">Not linked</span>;
      return (
        <span className="text-xs text-emerald-400 hover:underline cursor-pointer" onClick={e => { e.stopPropagation(); navigate(`/products/${parent.id}`); }}>
          {parent.name}
        </span>
      );
    }},
    { key: 'sale_price', label: 'Sale Price', align: 'right', render: p => <span className="text-accent font-medium">{p.sale_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.sale_price || 0) - (b.sale_price || 0) },
    { key: 'unit', label: 'Unit', render: p => <span className="text-muted-foreground text-xs">{p.syrve_data?.mainUnit || '—'}</span> },
    { key: 'unit_capacity', label: 'Volume', align: 'right', render: p => <span className="text-muted-foreground">{p.unit_capacity ?? '—'}</span> },
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', minWidth: 40, render: p => <RowActionsMenu product={p} /> },
  ], [selectedIds, navigate]);

  const goodsVisibleCols = useMemo(() => ['select', 'name', 'sku', 'code', 'category', 'unit', 'unit_capacity', 'stock', 'dishes_count', 'actions'], []);
  const dishesVisibleCols = useMemo(() => ['select', 'name', 'code', 'category', 'parent', 'sale_price', 'unit', 'unit_capacity', 'actions'], []);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">
            <span className="text-foreground font-medium">{goodsProducts.length}</span> goods · <span className="text-foreground font-medium">{dishProducts.length}</span> dishes
          </p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-muted/50 h-11">
            <TabsTrigger value="all" className="gap-2 px-4"><Layers className="w-4 h-4" />All <Badge variant="outline" className="ml-1 text-[10px] px-1.5 h-5">{products.length}</Badge></TabsTrigger>
            <TabsTrigger value="goods" className="gap-2 px-4"><BoxIcon className="w-4 h-4" />Goods <Badge variant="outline" className="ml-1 text-[10px] px-1.5 h-5 text-emerald-400 border-emerald-500/30">{goodsProducts.length}</Badge></TabsTrigger>
            <TabsTrigger value="dishes" className="gap-2 px-4"><UtensilsCrossed className="w-4 h-4" />Dishes <Badge variant="outline" className="ml-1 text-[10px] px-1.5 h-5 text-amber-400 border-amber-500/30">{dishProducts.length}</Badge></TabsTrigger>
          </TabsList>
        </div>

        {/* Quick Filters */}
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

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          <div className="flex items-center gap-2">
            <MultiSelectFilter label="Category" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />
            <MultiSelectFilter label="Stock" options={stockStatusOptions} selected={stockStatusFilter} onChange={setStockStatusFilter} />
            {stores.length > 0 && <MultiSelectFilter label="Store" options={stores.map(s => s.name)} selected={[]} onChange={() => {}} />}
          </div>
        </div>

        {/* Active filter pills */}
        {(categoryFilter.length > 0 || stockStatusFilter.length > 0 || quickFilter) && (
          <div className="flex flex-wrap gap-1.5">
            {categoryFilter.map(c => (
              <Badge key={c} variant="secondary" className="gap-1 cursor-pointer text-xs hover:bg-destructive/10 hover:text-destructive transition-colors border border-border" onClick={() => setCategoryFilter(prev => prev.filter(x => x !== c))}>
                Category: {c} <X className="w-3 h-3" />
              </Badge>
            ))}
            {stockStatusFilter.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 cursor-pointer text-xs hover:bg-destructive/10 hover:text-destructive transition-colors border border-border" onClick={() => setStockStatusFilter(prev => prev.filter(x => x !== s))}>
                {s} <X className="w-3 h-3" />
              </Badge>
            ))}
            <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground px-2" onClick={clearFilters}>Clear all</Button>
          </div>
        )}

        {/* ─── ALL TAB ─── */}
        <TabsContent value="all" className="space-y-0">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <AllProductsHierarchy
              goods={filteredGoods}
              dishes={filteredDishes}
              goodsToDishesMap={goodsToDishesMap}
              orphanDishes={orphanDishes}
              navigate={navigate}
            />
          )}
        </TabsContent>

        {/* ─── GOODS TAB ─── */}
        <TabsContent value="goods" className="space-y-0">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <DataTable
                data={filteredGoods}
                columns={goodsColumns}
                visibleColumns={goodsVisibleCols}
                columnWidths={columnWidths}
                onColumnResize={setColumnWidth}
                keyExtractor={p => p.id}
                onRowClick={p => navigate(`/products/${p.id}`)}
                emptyMessage="No goods products found"
              />
            </div>
          )}
        </TabsContent>

        {/* ─── DISHES TAB ─── */}
        <TabsContent value="dishes" className="space-y-0">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <DataTable
                data={filteredDishes}
                columns={dishesColumns}
                visibleColumns={dishesVisibleCols}
                columnWidths={columnWidths}
                onColumnResize={setColumnWidth}
                keyExtractor={p => p.id}
                onRowClick={p => navigate(`/products/${p.id}`)}
                emptyMessage="No dish products found"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

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

/* ─── ALL Tab: Hierarchical Goods → Dishes view ─── */

function AllProductsHierarchy({
  goods,
  dishes,
  goodsToDishesMap,
  orphanDishes,
  navigate,
}: {
  goods: Product[];
  dishes: Product[];
  goodsToDishesMap: Map<string, Product[]>;
  orphanDishes: Product[];
  navigate: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = goods.filter(g => (goodsToDishesMap.get(g.id)?.length || 0) > 0).map(g => g.id);
    setExpanded(new Set(ids));
  };
  const collapseAll = () => setExpanded(new Set());

  const hasExpandable = goods.some(g => (goodsToDishesMap.get(g.id)?.length || 0) > 0);

  if (goods.length === 0 && dishes.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No products found. Run a Syrve sync first.</p>
      </div>
    );
  }

  return (
    <div>
      {hasExpandable && (
        <div className="flex items-center justify-end gap-2 mb-2">
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={expandAll}>Expand All</Button>
          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={collapseAll}>Collapse All</Button>
        </div>
      )}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_80px_80px_80px_40px] gap-2 px-4 py-2.5 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div />
          <div>Product</div>
          <div>Category</div>
          <div className="text-right">Stock</div>
          <div className="text-right">Price</div>
          <div className="text-center">Type</div>
          <div />
        </div>

        {/* Goods rows with expandable dishes */}
        {goods.map(g => {
          const linkedDishes = goodsToDishesMap.get(g.id) || [];
          const isExpanded = expanded.has(g.id);
          const hasDishes = linkedDishes.length > 0;

          return (
            <div key={g.id}>
              {/* Goods Row */}
              <div
                className="grid grid-cols-[40px_1fr_100px_80px_80px_80px_40px] gap-2 items-center px-4 py-2.5 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
                onClick={() => navigate(`/products/${g.id}`)}
              >
                <div onClick={e => { e.stopPropagation(); if (hasDishes) toggleExpand(g.id); }} className="flex items-center justify-center">
                  {hasDishes ? (
                    isExpanded
                      ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  ) : <div className="w-4" />}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-sm truncate">{g.name}</span>
                  {hasDishes && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 shrink-0 text-amber-400 border-amber-500/30">
                      <UtensilsCrossed className="w-3 h-3" />{linkedDishes.length}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">{g.categories?.name || '—'}</span>
                <div className="text-right"><StockIndicator stock={g.current_stock} /></div>
                <span className="text-right text-sm text-muted-foreground tabular-nums">{g.purchase_price?.toFixed(2) ?? '—'}</span>
                <div className="flex justify-center"><TypeBadge type="GOODS" /></div>
                <RowActionsMenu product={g} />
              </div>

              {/* Expanded Dishes */}
              {isExpanded && linkedDishes.map(d => (
                <div
                  key={d.id}
                  className="grid grid-cols-[40px_1fr_100px_80px_80px_80px_40px] gap-2 items-center px-4 py-2 border-b border-border/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06] transition-colors cursor-pointer"
                  onClick={() => navigate(`/products/${d.id}`)}
                >
                  <div className="flex items-center justify-center">
                    <div className="w-3 h-3 border-l-2 border-b-2 border-amber-500/30 rounded-bl ml-1" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm truncate">{d.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{d.categories?.name || '—'}</span>
                  <div className="text-right"><span className="text-muted-foreground/50 text-xs">—</span></div>
                  <span className="text-right text-sm text-accent tabular-nums font-medium">{d.sale_price?.toFixed(2) ?? '—'}</span>
                  <div className="flex justify-center"><TypeBadge type="DISH" /></div>
                  <RowActionsMenu product={d} />
                </div>
              ))}
            </div>
          );
        })}

        {/* Orphan dishes (not linked to any goods) */}
        {orphanDishes.length > 0 && (
          <>
            <div className="px-4 py-2 bg-muted/30 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Unlinked Dishes ({orphanDishes.length})
            </div>
            {orphanDishes.map(d => (
              <div
                key={d.id}
                className="grid grid-cols-[40px_1fr_100px_80px_80px_80px_40px] gap-2 items-center px-4 py-2.5 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/products/${d.id}`)}
              >
                <div />
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-sm font-medium truncate">{d.name}</span>
                </div>
                <span className="text-xs text-muted-foreground truncate">{d.categories?.name || '—'}</span>
                <div className="text-right"><span className="text-muted-foreground/50 text-xs">—</span></div>
                <span className="text-right text-sm text-accent tabular-nums font-medium">{d.sale_price?.toFixed(2) ?? '—'}</span>
                <div className="flex justify-center"><TypeBadge type="DISH" /></div>
                <RowActionsMenu product={d} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
