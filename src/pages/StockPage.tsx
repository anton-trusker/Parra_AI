import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, Product, useMeasurementUnitsMap, resolveUnitName } from '@/hooks/useProducts';
import { useColumnStore } from '@/stores/columnStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { Search, Package, Ban, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import PageHeader from '@/components/PageHeader';

function StockStatusBadge({ stock }: { stock: number | null }) {
  const s = stock ?? 0;
  if (s <= 0) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-destructive/15 text-destructive border border-destructive/30">✗ Out</span>;
  if (s < 5) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">⚠ Low</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">✓ OK</span>;
}

export default function StockPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { columnWidths, setColumnWidth } = useColumnStore();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const { data: allProducts = [], isLoading } = useProducts({
    search: search || undefined,
    productType: ['GOODS'],
  });

  const { data: unitsMap } = useMeasurementUnitsMap();

  // Only GOODS with stock > 0 by default, unless filtered
  const products = useMemo(() => {
    let result = allProducts;
    if (categoryFilter.length) {
      result = result.filter(p => categoryFilter.includes((p as any).categories?.name || ''));
    }
    if (quickFilter === 'outOfStock') result = result.filter(p => (p.current_stock ?? 0) <= 0);
    if (quickFilter === 'lowStock') result = result.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5);
    if (quickFilter === 'inStock') result = result.filter(p => (p.current_stock ?? 0) >= 5);
    return result;
  }, [allProducts, categoryFilter, quickFilter]);

  const quickCounts = useMemo(() => ({
    outOfStock: allProducts.filter(p => (p.current_stock ?? 0) <= 0).length,
    lowStock: allProducts.filter(p => (p.current_stock ?? 0) > 0 && (p.current_stock ?? 0) < 5).length,
    inStock: allProducts.filter(p => (p.current_stock ?? 0) >= 5).length,
  }), [allProducts]);

  const categoryOptions = useMemo(() => {
    return [...new Set(allProducts.map(p => (p as any).categories?.name).filter(Boolean) as string[])].sort();
  }, [allProducts]);

  const totalStock = useMemo(() => products.reduce((s, p) => s + (Number(p.current_stock) || 0), 0), [products]);
  const totalCost = useMemo(() => products.reduce((s, p) => s + ((Number(p.current_stock) || 0) * (Number(p.purchase_price) || 0)), 0), [products]);

  const columns: DataTableColumn<Product>[] = useMemo(() => [
    {
      key: 'status',
      label: '',
      minWidth: 60,
      render: (p) => <StockStatusBadge stock={p.current_stock} />,
    },
    {
      key: 'name',
      label: 'Product Name',
      minWidth: 220,
      render: (p) => (
        <div className="min-w-0">
          <span className="font-medium text-foreground block truncate">{p.name}</span>
          <span className="text-[11px] text-muted-foreground">{(p as any).categories?.name || '—'}</span>
        </div>
      ),
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'total_stock',
      label: 'Total Stock',
      align: 'right' as const,
      minWidth: 130,
      render: (p) => {
        const unitName = resolveUnitName(p.main_unit_id, unitsMap);
        const stock = Number(p.current_stock) || 0;
        return (
          <div className="text-right">
            <span className="font-semibold tabular-nums text-foreground">{stock.toFixed(2)}</span>
            {unitName && <span className="text-[11px] text-muted-foreground ml-1">{unitName}</span>}
          </div>
        );
      },
      sortFn: (a, b) => (a.current_stock || 0) - (b.current_stock || 0),
    },
    {
      key: 'total_qty',
      label: 'Total Qty',
      align: 'right' as const,
      minWidth: 130,
      render: (p) => {
        const stock = Number(p.current_stock) || 0;
        const capacity = Number(p.unit_capacity) || 0;
        if (capacity <= 0) return <span className="text-muted-foreground">—</span>;
        const qty = stock / capacity;
        // Try to get container name from syrve_data
        const containerName = (p.syrve_data as any)?.containerName
          || (p.syrve_data as any)?.container_name
          || (p.syrve_data as any)?.containers?.[0]?.name
          || 'pcs';
        return (
          <div className="text-right">
            <span className="font-semibold tabular-nums text-foreground">{qty.toFixed(1)}</span>
            <span className="text-[11px] text-muted-foreground ml-1">{containerName}</span>
          </div>
        );
      },
      sortFn: (a, b) => {
        const qtyA = (a.unit_capacity && a.unit_capacity > 0) ? (a.current_stock || 0) / a.unit_capacity : 0;
        const qtyB = (b.unit_capacity && b.unit_capacity > 0) ? (b.current_stock || 0) / b.unit_capacity : 0;
        return qtyA - qtyB;
      },
    },
    {
      key: 'cost',
      label: 'Unit Cost',
      align: 'right' as const,
      minWidth: 100,
      render: (p) => (
        <span className="tabular-nums text-muted-foreground">
          {p.purchase_price ? `${Number(p.purchase_price).toFixed(2)}` : '—'}
        </span>
      ),
      sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0),
    },
    {
      key: 'total_value',
      label: 'Total Value',
      align: 'right' as const,
      minWidth: 110,
      render: (p) => {
        const val = (Number(p.current_stock) || 0) * (Number(p.purchase_price) || 0);
        return val > 0
          ? <span className="font-medium tabular-nums text-foreground">{val.toFixed(2)}</span>
          : <span className="text-muted-foreground">—</span>;
      },
      sortFn: (a, b) => {
        const va = (a.current_stock || 0) * (a.purchase_price || 0);
        const vb = (b.current_stock || 0) * (b.purchase_price || 0);
        return va - vb;
      },
    },
  ], [unitsMap]);

  const visibleColumns = ['status', 'name', 'total_stock', 'total_qty', 'cost', 'total_value'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Stock Levels"
        subtitle={`${products.length} products • Total value: ${totalCost.toFixed(2)}`}
        icon={Package}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allProducts.length}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Products</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalStock.toFixed(1)}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Stock</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{quickCounts.inStock}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">In Stock</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{quickCounts.outOfStock}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Out of Stock</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filter-bar">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick:</span>
        <button onClick={() => setQuickFilter(quickFilter === 'outOfStock' ? null : 'outOfStock')} className={`quick-filter-pill ${quickFilter === 'outOfStock' ? 'active' : ''}`}>
          <Ban className="w-3 h-3" /> Out of Stock <span className="text-[10px] opacity-70">({quickCounts.outOfStock})</span>
        </button>
        <button onClick={() => setQuickFilter(quickFilter === 'lowStock' ? null : 'lowStock')} className={`quick-filter-pill ${quickFilter === 'lowStock' ? 'active' : ''}`}>
          <AlertTriangle className="w-3 h-3" /> Low Stock <span className="text-[10px] opacity-70">({quickCounts.lowStock})</span>
        </button>
        <button onClick={() => setQuickFilter(quickFilter === 'inStock' ? null : 'inStock')} className={`quick-filter-pill ${quickFilter === 'inStock' ? 'active' : ''}`}>
          <CheckCircle2 className="w-3 h-3" /> In Stock <span className="text-[10px] opacity-70">({quickCounts.inStock})</span>
        </button>
        {quickFilter && (
          <button onClick={() => setQuickFilter(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 ml-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card border-border"
          />
        </div>
        <MultiSelectFilter
          label="Category"
          options={categoryOptions}
          selected={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <DataTable
            data={products}
            columns={columns}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={p => p.id}
            onRowClick={p => navigate(`/products/${p.id}`)}
            emptyMessage="No GOODS products found"
            compact
          />
        </div>
      )}
    </div>
  );
}
