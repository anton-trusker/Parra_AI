import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, Product, useMeasurementUnitsMap, resolveUnitName } from '@/hooks/useProducts';
import { useSyrveCategories } from '@/hooks/useSyrve';
import { useStores } from '@/hooks/useStores';
import { Search, Package, X, MoreHorizontal, Eye, Copy, History, Trash2, CheckSquare, Download, Tag, Power, AlertTriangle, Ban, DollarSign, ChevronRight, ChevronDown, UtensilsCrossed, BoxIcon, TrendingDown, Hash } from 'lucide-react';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/* ═══════════════════════════════════════════════════
   Shared UI Components
   ═══════════════════════════════════════════════════ */

function TypeBadge({ type }: { type: string | null }) {
  const styles: Record<string, string> = {
    GOODS: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/25',
    DISH: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25',
    MODIFIER: 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border-sky-500/25',
    OUTER: 'bg-purple-500/15 text-purple-500 dark:text-purple-400 border-purple-500/25',
    PREPARED: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/25',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${styles[type || ''] || 'bg-secondary text-secondary-foreground border-border'}`}>
      {type || '—'}
    </span>
  );
}

/** Get the primary container's volume (litres per unit) from syrve_data */
function getContainerVolume(syrveData: any): number | null {
  const containers = syrveData?.containers;
  if (!Array.isArray(containers) || containers.length === 0) return null;
  const primary = containers.find((c: any) => !c.deleted) || containers[0];
  return primary?.count != null ? Number(primary.count) : null;
}

/** Format stock with volume: "3 btl · 2.25L" */
function formatStockWithVolume(stock: number | null, syrveData: any): { label: string; volume: string | null } {
  if (stock === null || stock === undefined) return { label: '—', volume: null };
  const containerVol = getContainerVolume(syrveData);
  const containers = syrveData?.containers;
  const unitName = Array.isArray(containers) && containers.length > 0
    ? (containers.find((c: any) => !c.deleted) || containers[0])?.name || ''
    : '';
  const volumeStr = containerVol ? `${(stock * containerVol).toFixed(2)}L` : null;
  return { label: `${stock}${unitName ? ` ${unitName}` : ''}`, volume: volumeStr };
}

function StockIndicator({ stock, syrveData }: { stock: number | null; syrveData?: any }) {
  if (stock === null || stock === undefined) return <span className="text-muted-foreground">—</span>;
  const { label, volume } = formatStockWithVolume(stock, syrveData);
  const indicator = (colorVar: string, pulse = false) => (
    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: `hsl(var(${colorVar}))` }}>
      <span className={`w-2 h-2 rounded-full ${pulse ? 'animate-pulse' : ''}`} style={{ background: `hsl(var(${colorVar}))` }} />
      <span className="tabular-nums">{label}</span>
      {volume && <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{volume}</span>}
    </span>
  );
  if (stock <= 0) return indicator('--destructive', true);
  if (stock < 5) return indicator('--wine-warning');
  return indicator('--wine-success');
}

function ContainerInfo({ syrveData }: { syrveData: any }) {
  const containers = syrveData?.containers;
  if (!Array.isArray(containers) || containers.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-col gap-0.5">
      {containers.slice(0, 2).map((c: any, i: number) => (
        <span key={i} className="text-xs text-muted-foreground">
          {c.name || 'unit'}{c.count != null ? ` (${c.count}L)` : ''}
        </span>
      ))}
      {containers.length > 2 && <span className="text-[10px] text-muted-foreground/50">+{containers.length - 2} more</span>}
    </div>
  );
}

function RowActionsMenu({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
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

/* ═══════════════════════════════════════════════════
   Summary Stat Card
   ═══════════════════════════════════════════════════ */

function StatCard({ icon: Icon, label, value, subValue, accent }: {
  icon: React.ElementType; label: string; value: string | number; subValue?: string; accent?: string;
}) {
  return (
    <div className="stat-card flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: accent ? `${accent}15` : 'hsl(var(--muted))' }}>
        <Icon className="w-5 h-5" style={{ color: accent || 'hsl(var(--muted-foreground))' }} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-heading font-bold tabular-nums leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {subValue && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Column Definitions
   ═══════════════════════════════════════════════════ */

const GOODS_COL_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'store', label: 'Store' },
  { key: 'unit', label: 'Unit' },
  { key: 'unit_capacity', label: 'Volume/Weight' },
  { key: 'containers', label: 'Containers' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'dishes_count', label: 'Dishes' },
  { key: 'synced_at', label: 'Synced At' },
];

const DISHES_COL_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'store', label: 'Store' },
  { key: 'parent', label: 'Linked Goods' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'unit', label: 'Unit' },
  { key: 'unit_capacity', label: 'Volume' },
  { key: 'synced_at', label: 'Synced At' },
];

/* ═══════════════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════════════ */

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
  const [activeTab, setActiveTab] = useState('goods');

  const categoryFromUrl = searchParams.get('category') || undefined;

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: typeFilter.length ? typeFilter : undefined,
    categoryId: categoryFromUrl,
  });

  const { data: categories = [] } = useSyrveCategories();
  const { data: stores = [] } = useStores();
  const { data: unitsMap } = useMeasurementUnitsMap();

  // Split by type
  const goodsProducts = useMemo(() => products.filter(p => p.product_type === 'GOODS'), [products]);
  const dishProducts = useMemo(() => products.filter(p => p.product_type === 'DISH' || p.product_type === 'PREPARED'), [products]);

  // Goods→dishes hierarchy map
  const goodsToDishesMap = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const d of dishProducts) {
      const parentId = (Array.isArray(d.parent_product) ? d.parent_product[0]?.id : d.parent_product?.id) || '__orphan__';
      if (!map.has(parentId)) map.set(parentId, []);
      map.get(parentId)!.push(d);
    }
    return map;
  }, [dishProducts]);

  

  // Filter options
  const categoryOptions = useMemo(() => [...new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])].sort(), [products]);
  const stockStatusOptions = useMemo(() => {
    const opts: string[] = [];
    if (products.some(p => (p.current_stock ?? 0) <= 0)) opts.push('Out of Stock');
    if (products.some(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5)) opts.push('Low Stock');
    if (products.some(p => (p.current_stock ?? 0) >= 5)) opts.push('In Stock');
    return opts;
  }, [products]);

  // Filtering
  const applyFilters = useCallback((list: Product[]) => {
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
  }, [categoryFilter, stockStatusFilter, quickFilter]);

  const filteredGoods = useMemo(() => applyFilters(goodsProducts), [goodsProducts, applyFilters]);
  const filteredDishes = useMemo(() => applyFilters(dishProducts), [dishProducts, applyFilters]);

  // Tab-aware stats
  const currentList = activeTab === 'goods' ? filteredGoods : filteredDishes;
  const stats = useMemo(() => {
    const lowStock = currentList.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5).length;
    const outOfStock = currentList.filter(p => (p.current_stock ?? 0) <= 0).length;
    const noPrice = currentList.filter(p => p.sale_price == null || p.sale_price === 0).length;
    const inactive = currentList.filter(p => !p.is_active).length;
    const linkedDishes = dishProducts.filter(d => {
      const pid = (Array.isArray(d.parent_product) ? d.parent_product[0]?.id : d.parent_product?.id);
      return !!pid;
    }).length;
    return { lowStock, outOfStock, noPrice, inactive, linkedDishes };
  }, [currentList, dishProducts]);

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

  /* ─── Table column builders ─── */
  const goodsColumns = useMemo((): DataTableColumn<Product>[] => [
    { key: 'select', label: '', minWidth: 40, render: p => (
      <div onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></div>
    ) },
    { key: 'name', label: 'Name', minWidth: 220, render: p => {
      const dishCount = goodsToDishesMap.get(p.id)?.length || 0;
      return (
        <div className="flex items-center gap-2">
          <BoxIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="font-medium truncate">{p.name}</span>
          {dishCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-0.5 shrink-0 border-amber-500/25" style={{ color: 'hsl(38 45% 60%)' }}>
                  <UtensilsCrossed className="w-3 h-3" />{dishCount}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>{dishCount} dish{dishCount !== 1 ? 'es' : ''} linked</TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    }, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => (
      <Badge variant="secondary" className="text-[11px] font-normal">{p.categories?.name || 'Uncategorized'}</Badge>
    )},
    { key: 'store', label: 'Store', render: p => {
      const names = p.store_names || [];
      if (names.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
      if (names.length === 1) return <Badge variant="outline" className="text-[10px] font-normal">{names[0]}</Badge>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground">{names.length} stores</span>
          </TooltipTrigger>
          <TooltipContent><div className="text-xs space-y-0.5">{names.map(n => <div key={n}>{n}</div>)}</div></TooltipContent>
        </Tooltip>
      );
    }},
    { key: 'unit', label: 'Unit', render: p => <span className="text-muted-foreground text-xs">{resolveUnitName(p.main_unit_id, unitsMap) || p.syrve_data?.mainUnit || '—'}</span> },
    { key: 'unit_capacity', label: 'Volume', align: 'right', render: p => <span className="text-muted-foreground tabular-nums">{p.unit_capacity ?? '—'}</span>, sortFn: (a, b) => (a.unit_capacity || 0) - (b.unit_capacity || 0) },
    { key: 'containers', label: 'Containers', render: p => <ContainerInfo syrveData={p.syrve_data} /> },
    { key: 'purchase_price', label: 'Cost', align: 'right', render: p => <span className="text-muted-foreground tabular-nums">{p.purchase_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0) },
    { key: 'stock', label: 'Stock', align: 'right', render: p => <StockIndicator stock={p.current_stock} syrveData={p.syrve_data} />, sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0) },
    { key: 'dishes_count', label: 'Dishes', align: 'center', render: p => {
      const count = goodsToDishesMap.get(p.id)?.length || 0;
      return count > 0 ? <span className="font-medium tabular-nums" style={{ color: 'hsl(38 45% 60%)' }}>{count}</span> : <span className="text-muted-foreground/40">—</span>;
    }},
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', minWidth: 40, render: p => <RowActionsMenu product={p} /> },
  ], [selectedIds, goodsToDishesMap, unitsMap]);

  const dishesColumns = useMemo((): DataTableColumn<Product>[] => [
    { key: 'select', label: '', minWidth: 40, render: p => (
      <div onClick={e => e.stopPropagation()}><Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} /></div>
    ) },
    { key: 'name', label: 'Name', minWidth: 220, render: p => (
      <div className="flex items-center gap-2">
        <UtensilsCrossed className="w-4 h-4 shrink-0" style={{ color: 'hsl(38 45% 60%)' }} />
        <span className="font-medium truncate">{p.name}</span>
      </div>
    ), sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => (
      <Badge variant="secondary" className="text-[11px] font-normal">{p.categories?.name || 'Uncategorized'}</Badge>
    )},
    { key: 'store', label: 'Store', render: p => {
      const names = p.store_names || [];
      if (names.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
      if (names.length === 1) return <Badge variant="outline" className="text-[10px] font-normal">{names[0]}</Badge>;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground">{names.length} stores</span>
          </TooltipTrigger>
          <TooltipContent><div className="text-xs space-y-0.5">{names.map(n => <div key={n}>{n}</div>)}</div></TooltipContent>
        </Tooltip>
      );
    }},
    { key: 'parent', label: 'Linked Goods', minWidth: 180, render: p => {
      const parent = Array.isArray(p.parent_product) ? p.parent_product[0] : p.parent_product;
      if (!parent) return <span className="text-destructive/60 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Not linked</span>;
      return (
        <span
          className="text-xs font-medium hover:underline cursor-pointer flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400"
          onClick={e => { e.stopPropagation(); navigate(`/products/${parent.id}`); }}
        >
          <BoxIcon className="w-3 h-3" />{parent.name}
        </span>
      );
    }},
    { key: 'sale_price', label: 'Sale Price', align: 'right', render: p => (
      <span className="text-accent font-semibold tabular-nums">{p.sale_price?.toFixed(2) ?? '—'}</span>
    ), sortFn: (a, b) => (a.sale_price || 0) - (b.sale_price || 0) },
    { key: 'unit', label: 'Unit', render: p => <span className="text-muted-foreground text-xs">{resolveUnitName(p.main_unit_id, unitsMap) || p.syrve_data?.mainUnit || '—'}</span> },
    { key: 'unit_capacity', label: 'Volume', align: 'right', render: p => <span className="text-muted-foreground tabular-nums">{p.unit_capacity ?? '—'}</span> },
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
    { key: 'actions', label: '', minWidth: 40, render: p => <RowActionsMenu product={p} /> },
  ], [selectedIds, navigate, unitsMap]);

  const goodsVisibleCols = useMemo(() => ['select', 'name', 'sku', 'category', 'store', 'unit', 'unit_capacity', 'stock', 'dishes_count', 'actions'], []);
  const dishesVisibleCols = useMemo(() => ['select', 'name', 'code', 'category', 'store', 'parent', 'sale_price', 'unit', 'actions'], []);

  const hasFilters = categoryFilter.length > 0 || stockStatusFilter.length > 0 || !!quickFilter;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ─── Header ─── */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Product Catalog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your inventory goods and restaurant dishes
        </p>
      </div>

      {/* ─── Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={BoxIcon} label="Goods" value={goodsProducts.length} accent="hsl(152 55% 42%)" subValue={`${filteredGoods.length} showing`} />
        <StatCard icon={UtensilsCrossed} label="Dishes" value={dishProducts.length} accent="hsl(38 45% 60%)" subValue={`${stats.linkedDishes} linked`} />
        <StatCard icon={TrendingDown} label="Low / Out of Stock" value={stats.lowStock + stats.outOfStock} accent="hsl(0 72% 51%)" subValue={`${stats.lowStock} low · ${stats.outOfStock} out`} />
        <StatCard icon={Hash} label="Categories" value={categoryOptions.length} subValue={`across ${stores.length} store${stores.length !== 1 ? 's' : ''}`} />
      </div>

      {/* ─── Main Tabs ─── */}
      <Tabs value={activeTab} onValueChange={v => { setActiveTab(v); setSelectedIds(new Set()); }} className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList className="bg-muted/50 h-11 p-1">
            <TabsTrigger value="goods" className="gap-2 px-4 data-[state=active]:shadow-sm">
              <BoxIcon className="w-4 h-4" />Goods
              <Badge variant="outline" className="ml-0.5 text-[10px] px-1.5 h-5 border-emerald-500/25 text-emerald-500 dark:text-emerald-400">{goodsProducts.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="dishes" className="gap-2 px-4 data-[state=active]:shadow-sm">
              <UtensilsCrossed className="w-4 h-4" />Dishes
              <Badge variant="outline" className="ml-0.5 text-[10px] px-1.5 h-5 border-amber-500/25" style={{ color: 'hsl(38 45% 60%)' }}>{dishProducts.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {activeTab === 'goods' && <ColumnManager columns={GOODS_COL_DEFS} visibleColumns={goodsVisibleCols} onChange={() => {}} />}
            {activeTab === 'dishes' && <ColumnManager columns={DISHES_COL_DEFS} visibleColumns={dishesVisibleCols} onChange={() => {}} />}
          </div>
        </div>

        {/* ─── Quick Filters ─── */}
        <div className="quick-filter-bar">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick:</span>
          {[
            { key: 'lowStock', icon: AlertTriangle, label: 'Low Stock', count: stats.lowStock },
            { key: 'outOfStock', icon: Ban, label: 'Out of Stock', count: stats.outOfStock },
            { key: 'noPrice', icon: DollarSign, label: 'No Price', count: stats.noPrice },
            { key: 'inactive', icon: Power, label: 'Inactive', count: stats.inactive },
          ].map(qf => (
            <button key={qf.key} onClick={() => toggleQuickFilter(qf.key)} className={`quick-filter-pill ${quickFilter === qf.key ? 'active' : ''}`}>
              <qf.icon className="w-3 h-3" /> {qf.label} <span className="text-[10px] opacity-70">({qf.count})</span>
            </button>
          ))}
          {quickFilter && (
            <button onClick={() => setQuickFilter(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* ─── Search & Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
          </div>
          <div className="flex items-center gap-2">
            <MultiSelectFilter label="Category" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />
            <MultiSelectFilter label="Stock" options={stockStatusOptions} selected={stockStatusFilter} onChange={setStockStatusFilter} />
            {stores.length > 0 && <MultiSelectFilter label="Store" options={stores.map(s => s.name)} selected={[]} onChange={() => {}} />}
          </div>
        </div>

        {/* ─── Active filter pills ─── */}
        {hasFilters && (
          <div className="flex flex-wrap gap-1.5 items-center">
            {categoryFilter.map(c => (
              <Badge key={c} variant="secondary" className="gap-1 cursor-pointer text-xs hover:bg-destructive/10 hover:text-destructive transition-colors border border-border" onClick={() => setCategoryFilter(prev => prev.filter(x => x !== c))}>
                {c} <X className="w-3 h-3" />
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

        {/* ═══════ GOODS TAB ═══════ */}
        <TabsContent value="goods" className="mt-0">
          {isLoading ? <LoadingSkeleton /> : filteredGoods.length === 0 ? (
            <EmptyTab icon={BoxIcon} label="No goods match your filters" />
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

        {/* ═══════ DISHES TAB ═══════ */}
        <TabsContent value="dishes" className="mt-0">
          {isLoading ? <LoadingSkeleton /> : filteredDishes.length === 0 ? (
            <EmptyTab icon={UtensilsCrossed} label="No dishes match your filters" />
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

      {/* ─── Bulk Actions ─── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border-2 border-primary/30 rounded-xl shadow-2xl px-5 py-3 flex items-center gap-4 animate-fade-in backdrop-blur-sm">
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

/* ═══════════════════════════════════════════════════
   Shared sub-components
   ═══════════════════════════════════════════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-lg" style={{ opacity: 1 - i * 0.1 }} />
      ))}
    </div>
  );
}

function EmptyTab({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
        <Icon className="w-8 h-8 opacity-40" />
      </div>
      <p className="text-sm">{label}</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or filters</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   ALL Tab — Hierarchical Goods → Dishes
   ═══════════════════════════════════════════════════ */

