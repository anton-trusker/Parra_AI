import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useColumnStore } from '@/stores/columnStore';
import { useProducts, Product } from '@/hooks/useProducts';
import { useSyrveCategories } from '@/hooks/useSyrve';
import { Search, SlidersHorizontal, LayoutGrid, Table2, Package, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ColumnManager, { ColumnDef } from '@/components/ColumnManager';
import FilterManager, { FilterDef } from '@/components/FilterManager';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import { Skeleton } from '@/components/ui/skeleton';

const PRODUCT_COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'code', label: 'Code' },
  { key: 'category', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'sale_price', label: 'Sale Price' },
  { key: 'purchase_price', label: 'Purchase Price' },
  { key: 'stock', label: 'Stock' },
  { key: 'unit_capacity', label: 'Unit Capacity' },
  { key: 'synced_at', label: 'Synced At' },
];

const PRODUCT_FILTER_DEFS: FilterDef[] = [
  { key: 'type', label: 'Product Type' },
  { key: 'category', label: 'Category' },
  { key: 'stock', label: 'Stock Status' },
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

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <div onClick={onClick} className="wine-glass-effect rounded-xl overflow-hidden group transition-all duration-300 hover:border-accent/30 hover:shadow-lg cursor-pointer">
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
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          <div className="text-xs">
            <span className="text-muted-foreground">Stock: </span>
            <StockIndicator stock={product.current_stock} />
          </div>
          {product.sale_price != null && (
            <span className="text-xs text-accent font-medium">{product.sale_price.toFixed(2)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function buildProductColumns(): DataTableColumn<Product>[] {
  return [
    { key: 'name', label: 'Name', minWidth: 180, render: p => <span className="font-medium">{p.name}</span>, sortFn: (a, b) => a.name.localeCompare(b.name) },
    { key: 'sku', label: 'SKU', render: p => <span className="text-muted-foreground font-mono text-xs">{p.sku || '—'}</span> },
    { key: 'code', label: 'Code', render: p => <span className="text-muted-foreground text-xs">{p.code || '—'}</span> },
    { key: 'category', label: 'Category', render: p => <span className="text-muted-foreground">{p.categories?.name || '—'}</span> },
    { key: 'type', label: 'Type', render: p => <TypeBadge type={p.product_type} />, sortFn: (a, b) => (a.product_type || '').localeCompare(b.product_type || '') },
    { key: 'sale_price', label: 'Sale Price', align: 'right', render: p => <span className="text-accent">{p.sale_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.sale_price || 0) - (b.sale_price || 0) },
    { key: 'purchase_price', label: 'Purchase Price', align: 'right', render: p => <span className="text-muted-foreground">{p.purchase_price?.toFixed(2) ?? '—'}</span>, sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0) },
    { key: 'stock', label: 'Stock', align: 'right', render: p => <StockIndicator stock={p.current_stock} />, sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0) },
    { key: 'unit_capacity', label: 'Unit Cap.', align: 'right', render: p => <span className="text-muted-foreground">{p.unit_capacity ?? '—'}</span> },
    { key: 'synced_at', label: 'Synced', render: p => <span className="text-xs text-muted-foreground">{p.synced_at ? new Date(p.synced_at).toLocaleDateString() : '—'}</span> },
  ];
}

export default function ProductCatalog() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { productColumns, setProductColumns, productFilters, setProductFilters, columnWidths, setColumnWidth } = useColumnStore();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [showFilters, setShowFilters] = useState(false);

  const categoryFromUrl = searchParams.get('category') || undefined;

  const { data: products = [], isLoading } = useProducts({
    search: search || undefined,
    productType: typeFilter.length ? typeFilter : undefined,
    categoryId: categoryFromUrl,
  });

  const { data: categories = [] } = useSyrveCategories();

  const productTypes = useMemo(() => [...new Set(products.map(p => p.product_type).filter(Boolean) as string[])].sort(), [products]);

  const activeFilterCount = [typeFilter].filter(f => f.length > 0).length + (categoryFromUrl ? 1 : 0);
  const fv = (key: string) => productFilters.includes(key);

  const clearFilters = () => {
    setTypeFilter([]);
    if (categoryFromUrl) navigate('/products');
  };

  const tableColumns = useMemo(() => buildProductColumns(), []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">{products.length} products from Syrve</p>
        </div>
      </div>

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
          {view === 'table' && <ColumnManager columns={PRODUCT_COLUMN_DEFS} visibleColumns={productColumns} onChange={setProductColumns} />}
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
          {products.map(p => <ProductCard key={p.id} product={p} onClick={() => navigate(`/products/${p.id}`)} />)}
        </div>
      ) : (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <DataTable
            data={products}
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

      {!isLoading && products.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No products found. Run a Syrve sync first.</p>
        </div>
      )}
    </div>
  );
}
