import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, useToggleProductFlag, useBulkToggleProductFlag, Product } from '@/hooks/useProducts';
import { useSyrveCategories } from '@/hooks/useSyrve';
import { Search, SlidersHorizontal, LayoutGrid, Table2, Package, X, Wine, Star, CheckSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

const PRODUCT_COLUMN_DEFS: ColumnDef[] = [
  { key: 'select', label: 'Select' },
  { key: 'marked', label: 'Marked' },
  { key: 'by_glass', label: 'By Glass' },
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
  { key: 'marked', label: 'Marked' },
  { key: 'by_glass', label: 'By Glass' },
];

function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = {
    GOODS: 'bg-emerald-500/20 text-emerald-400',
    DISH: 'bg-amber-500/20 text-amber-400',
    MODIFIER: 'bg-sky-500/20 text-sky-400',
    OUTER: 'bg-purple-500/20 text-purple-400',
    PREPARED: 'bg-orange-500/20 text-orange-400',
  };
  return <span className={`wine-badge ${colors[type || ''] || 'bg-secondary text-secondary-foreground'}`}>{type || '—'}</span>;
}

function StockIndicator({ stock }: { stock: number | null }) {
  if (stock === null || stock === undefined) return <span className="text-muted-foreground">—</span>;
  if (stock <= 0) return <span className="text-destructive font-medium">{stock}</span>;
  if (stock < 5) return <span className="text-amber-400 font-medium">{stock}</span>;
  return <span className="text-emerald-400 font-medium">{stock}</span>;
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

function ProductCard({ product, onClick, selected, onSelect }: { product: Product; onClick: () => void; selected: boolean; onSelect: (id: string) => void }) {
  const containers = product.syrve_data?.containers;
  return (
    <div className="wine-glass-effect rounded-xl overflow-hidden group transition-all duration-300 hover:border-accent/30 hover:shadow-lg cursor-pointer relative">
      <div className="absolute top-3 left-3 z-10" onClick={e => { e.stopPropagation(); onSelect(product.id); }}>
        <Checkbox checked={selected} className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
      </div>
      <div onClick={onClick} className="p-4 pl-10 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {product.is_marked && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
            {product.is_by_glass && <Wine className="w-3.5 h-3.5 text-primary shrink-0" />}
            <h3 className="font-heading font-semibold text-sm line-clamp-2">{product.name}</h3>
          </div>
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
  const [markedFilter, setMarkedFilter] = useState<'all' | 'marked' | 'not_marked'>('all');
  const [byGlassFilter, setByGlassFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const categoryFromUrl = searchParams.get('category') || undefined;

  const toggleFlag = useToggleProductFlag();
  const bulkToggle = useBulkToggleProductFlag();

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: typeFilter.length ? typeFilter : undefined,
    categoryId: categoryFromUrl,
  });

  const { data: categories = [] } = useSyrveCategories();

  const productTypes = useMemo(() => [...new Set(products.map(p => p.product_type).filter(Boolean) as string[])].sort(), [products]);
  const categoryOptions = useMemo(() => [...new Set(products.map(p => p.categories?.name).filter(Boolean) as string[])].sort(), [products]);
  const volumeOptions = useMemo(() => [...new Set(products.map(p => p.unit_capacity != null ? String(p.unit_capacity) : null).filter(Boolean) as string[])].sort((a, b) => Number(a) - Number(b)), [products]);
  const stockStatusOptions = useMemo(() => {
    const opts: string[] = [];
    const hasZero = products.some(p => (p.current_stock ?? 0) <= 0);
    const hasLow = products.some(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5);
    const hasOk = products.some(p => (p.current_stock ?? 0) >= 5);
    if (hasZero) opts.push('Out of Stock');
    if (hasLow) opts.push('Low Stock');
    if (hasOk) opts.push('In Stock');
    return opts;
  }, [products]);

  // Client-side filtering for category, stock status, volume, has_price
  const filteredProducts = useMemo(() => {
    let result = products;
    if (categoryFilter.length > 0) {
      result = result.filter(p => categoryFilter.includes(p.categories?.name || ''));
    }
    if (stockStatusFilter.length > 0) {
      result = result.filter(p => {
        const s = p.current_stock ?? 0;
        if (s <= 0) return stockStatusFilter.includes('Out of Stock');
        if (s < 5) return stockStatusFilter.includes('Low Stock');
        return stockStatusFilter.includes('In Stock');
      });
    }
    if (volumeFilter.length > 0) {
      result = result.filter(p => p.unit_capacity != null && volumeFilter.includes(String(p.unit_capacity)));
    }
    if (hasPriceFilter) {
      result = result.filter(p => p.sale_price != null && p.sale_price > 0);
    }
    if (markedFilter === 'marked') {
      result = result.filter(p => p.is_marked);
    } else if (markedFilter === 'not_marked') {
      result = result.filter(p => !p.is_marked);
    }
    if (byGlassFilter === 'yes') {
      result = result.filter(p => p.is_by_glass);
    } else if (byGlassFilter === 'no') {
      result = result.filter(p => !p.is_by_glass);
    }
    return result;
  }, [products, categoryFilter, stockStatusFilter, volumeFilter, hasPriceFilter, markedFilter, byGlassFilter]);

  const activeFilterCount = [typeFilter, categoryFilter, stockStatusFilter, volumeFilter].filter(f => f.length > 0).length + (categoryFromUrl ? 1 : 0) + (markedFilter !== 'all' ? 1 : 0) + (byGlassFilter !== 'all' ? 1 : 0) + (hasPriceFilter ? 1 : 0);
  const fv = (key: string) => productFilters.includes(key);

  const clearFilters = () => {
    setTypeFilter([]);
    setCategoryFilter([]);
    setStockStatusFilter([]);
    setVolumeFilter([]);
    setHasPriceFilter(false);
    setMarkedFilter('all');
    setByGlassFilter('all');
    if (categoryFromUrl) navigate('/products');
  };

  const handleCheckboxClick = (e: React.MouseEvent, productId: string, field: 'is_marked' | 'is_by_glass', current: boolean) => {
    e.stopPropagation();
    toggleFlag.mutate({ id: productId, field, value: !current });
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // IDs of filtered products for quick lookup
  const filteredIds = useMemo(() => new Set(filteredProducts.map(p => p.id)), [filteredProducts]);

  // Only count selected items that are currently visible
  const visibleSelectedIds = useMemo(() => {
    const vis = new Set<string>();
    selectedIds.forEach(id => { if (filteredIds.has(id)) vis.add(id); });
    return vis;
  }, [selectedIds, filteredIds]);

  const toggleSelectAll = useCallback(() => {
    if (visibleSelectedIds.size === filteredProducts.length && filteredProducts.length > 0) {
      // Deselect only visible ones, keep any hidden selections
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      // Select all visible ones, keep existing hidden selections
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  }, [filteredProducts.length, visibleSelectedIds.size, filteredIds]);

  const handleBulkAction = useCallback((field: 'is_marked' | 'is_by_glass', value: boolean) => {
    const ids = Array.from(visibleSelectedIds);
    if (ids.length === 0) return;
    bulkToggle.mutate({ ids, field, value }, {
      onSuccess: () => {
        // Don't clear selection immediately — let user see the result
      },
    });
  }, [visibleSelectedIds, bulkToggle]);

  const allSelected = filteredProducts.length > 0 && visibleSelectedIds.size === filteredProducts.length;
  const someSelected = visibleSelectedIds.size > 0 && visibleSelectedIds.size < filteredProducts.length;

  const tableColumns = useMemo((): DataTableColumn<Product>[] => [
    {
      key: 'select',
      label: '',
      align: 'center',
      headerRender: () => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={allSelected ? true : someSelected ? 'indeterminate' : false}
            onCheckedChange={() => toggleSelectAll()}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      ),
      render: p => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={selectedIds.has(p.id)}
            onCheckedChange={() => toggleSelect(p.id)}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      ),
    },
    {
      key: 'marked',
      label: '★',
      align: 'center',
      render: p => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={p.is_marked}
            onCheckedChange={() => toggleFlag.mutate({ id: p.id, field: 'is_marked', value: !p.is_marked })}
            className="border-border data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
          />
        </div>
      ),
    },
    {
      key: 'by_glass',
      label: 'By Glass',
      align: 'center',
      render: p => (
        <div onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={p.is_by_glass}
            onCheckedChange={() => toggleFlag.mutate({ id: p.id, field: 'is_by_glass', value: !p.is_by_glass })}
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
        </div>
      ),
    },
    { key: 'name', label: 'Name', minWidth: 180, render: p => <span className="font-medium">{p.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{p.categories?.name || '—'}</span> },
    { key: 'type', label: 'Type', render: p => <TypeBadge type={p.product_type} />, sortFn: (a, b) => (a.product_type || '').localeCompare(b.product_type || '') },
    { key: 'sale_price', label: 'Sale Price', align: 'right', render: p => <span className="text-accent">{p.sale_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.sale_price || 0) - (b.sale_price || 0) },
    { key: 'purchase_price', label: 'Purchase Price', align: 'right', render: p => <span className="text-muted-foreground">{p.purchase_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0) },
    { key: 'stock', label: 'Stock', align: 'right', render: p => <StockIndicator stock={p.current_stock} />, sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0) },
    { key: 'unit_capacity', label: 'Volume (L)', align: 'right', render: p => <span className="text-muted-foreground">{p.unit_capacity ?? '—'}</span>, sortFn: (a, b) => (a.unit_capacity || 0) - (b.unit_capacity || 0) },
    { key: 'containers', label: 'Containers', render: p => <ContainerInfo syrveData={p.syrve_data} /> },
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
  ], [selectedIds, toggleSelect, allSelected, someSelected, toggleSelectAll, toggleFlag]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">{filteredProducts.length} products from Syrve</p>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {visibleSelectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{visibleSelectedIds.size} selected</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulkAction('is_marked', true)}>
            <Star className="w-3.5 h-3.5" /> Mark
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulkAction('is_marked', false)}>
            <Star className="w-3.5 h-3.5" /> Unmark
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulkAction('is_by_glass', true)}>
            <Wine className="w-3.5 h-3.5" /> Set By Glass
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => handleBulkAction('is_by_glass', false)}>
            <Wine className="w-3.5 h-3.5" /> Unset By Glass
          </Button>
          <div className="ml-auto">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => setSelectedIds(new Set())}>
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name, SKU, code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          <Button variant="outline" className={`h-11 border-border gap-2 ${showFilters ? 'bg-primary/10 text-primary border-primary/30' : ''}`} onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
          {view === 'table' && (
            <>
              <Button variant="outline" size="icon" className="h-11 w-11 border-border" title={allSelected ? 'Deselect all' : 'Select all'} onClick={toggleSelectAll}>
                <CheckSquare className={`w-4 h-4 ${allSelected || someSelected ? 'text-primary' : ''}`} />
              </Button>
              <ColumnManager columns={PRODUCT_COLUMN_DEFS} visibleColumns={productColumns} onChange={setProductColumns} />
            </>
          )}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView('cards')} className={`p-2.5 transition-colors ${view === 'cards' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><LayoutGrid className="w-5 h-5" /></button>
            <button onClick={() => setView('table')} className={`p-2.5 transition-colors ${view === 'table' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Table2 className="w-5 h-5" /></button>
          </div>
        </div>

        {showFilters && (
          <div className="wine-glass-effect rounded-xl p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filters</p>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}><X className="w-3 h-3 mr-1" /> Clear</Button>}
                <FilterManager filters={PRODUCT_FILTER_DEFS} visibleFilters={productFilters} onChange={setProductFilters} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {fv('type') && <MultiSelectFilter label="Type" options={productTypes} selected={typeFilter} onChange={setTypeFilter} />}
              {fv('category') && <MultiSelectFilter label="Category" options={categoryOptions} selected={categoryFilter} onChange={setCategoryFilter} />}
              {fv('stock') && <MultiSelectFilter label="Stock" options={stockStatusOptions} selected={stockStatusFilter} onChange={setStockStatusFilter} />}
              {fv('volume') && <MultiSelectFilter label="Volume (L)" options={volumeOptions} selected={volumeFilter} onChange={setVolumeFilter} />}
              {fv('has_price') && (
                <Button
                  variant={hasPriceFilter ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setHasPriceFilter(!hasPriceFilter)}
                >
                  Has Price
                </Button>
              )}
              {fv('marked') && (
                <MultiSelectFilter
                  label="Marked"
                  options={['Marked', 'Not Marked']}
                  selected={markedFilter === 'all' ? [] : markedFilter === 'marked' ? ['Marked'] : ['Not Marked']}
                  onChange={sel => {
                    if (sel.length === 0 || sel.length === 2) setMarkedFilter('all');
                    else if (sel.includes('Marked')) setMarkedFilter('marked');
                    else setMarkedFilter('not_marked');
                  }}
                />
              )}
              {fv('by_glass') && (
                <MultiSelectFilter
                  label="By Glass"
                  options={['Yes', 'No']}
                  selected={byGlassFilter === 'all' ? [] : byGlassFilter === 'yes' ? ['Yes'] : ['No']}
                  onChange={sel => {
                    if (sel.length === 0 || sel.length === 2) setByGlassFilter('all');
                    else if (sel.includes('Yes')) setByGlassFilter('yes');
                    else setByGlassFilter('no');
                  }}
                />
              )}
              {categoryFromUrl && (
                <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => navigate('/products')}>
                  Category: {categories.find(c => c.id === categoryFromUrl)?.name || categoryFromUrl}
                  <X className="w-3 h-3" />
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              selected={selectedIds.has(p.id)}
              onSelect={toggleSelect}
              onClick={() => navigate(`/products/${p.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <DataTable
            data={filteredProducts}
            columns={tableColumns}
            visibleColumns={productColumns}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={p => p.id}
            onRowClick={p => navigate(`/products/${p.id}`)}
            emptyMessage="No products match your filters"
          />
        </div>
      )}

      {!isLoading && filteredProducts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No products found. Run a Syrve sync first.</p>
        </div>
      )}
    </div>
  );
}
