import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMeasurementUnitsMap, resolveUnitName } from '@/hooks/useProducts';
import { useColumnStore } from '@/stores/columnStore';
import { Search, Package, Ban, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import DataTable, { DataTableColumn } from '@/components/DataTable';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import PageHeader from '@/components/PageHeader';

interface StockRow {
  product_id: string;
  name: string;
  sku: string | null;
  code: string | null;
  category_id: string | null;
  category_name: string | null;
  main_unit_id: string | null;
  unit_capacity: number | null;
  purchase_price: number | null;
  sale_price: number | null;
  syrve_data: any;
  synced_at: string | null;
  total_stock: number;
  total_value: number;
}

function useStockSummary(search?: string) {
  return useQuery({
    queryKey: ['v_stock_summary', search],
    queryFn: async () => {
      let query = supabase
        .from('v_stock_summary' as any)
        .select('*')
        .order('name');

      if (search) {
        const q = `%${search}%`;
        query = query.or(`name.ilike.${q},sku.ilike.${q},code.ilike.${q}`);
      }

      const { data, error } = await query.limit(2000);
      if (error) throw error;
      return (data || []) as unknown as StockRow[];
    },
  });
}

function StockStatusBadge({ stock }: { stock: number }) {
  if (stock < 5) return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-600 border border-amber-500/30">⚠ Low</span>;
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">✓ OK</span>;
}

export default function StockPage() {
  const navigate = useNavigate();
  const { columnWidths, setColumnWidth } = useColumnStore();
  const [search, setSearch] = useState('');
  const [quickFilter, setQuickFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);

  const { data: allRows = [], isLoading } = useStockSummary(search || undefined);
  const { data: unitsMap } = useMeasurementUnitsMap();

  const filtered = useMemo(() => {
    let result = allRows;
    if (categoryFilter.length) {
      result = result.filter(r => categoryFilter.includes(r.category_name || ''));
    }
    if (quickFilter === 'lowStock') result = result.filter(r => r.total_stock > 0 && r.total_stock < 5);
    if (quickFilter === 'inStock') result = result.filter(r => r.total_stock >= 5);
    return result;
  }, [allRows, categoryFilter, quickFilter]);

  const quickCounts = useMemo(() => ({
    lowStock: allRows.filter(r => r.total_stock > 0 && r.total_stock < 5).length,
    inStock: allRows.filter(r => r.total_stock >= 5).length,
  }), [allRows]);

  const categoryOptions = useMemo(() => {
    return [...new Set(allRows.map(r => r.category_name).filter(Boolean) as string[])].sort();
  }, [allRows]);

  const totalStock = useMemo(() => filtered.reduce((s, r) => s + r.total_stock, 0), [filtered]);
  const totalValue = useMemo(() => filtered.reduce((s, r) => s + r.total_value, 0), [filtered]);

  const columns: DataTableColumn<StockRow>[] = useMemo(() => [
    {
      key: 'status',
      label: '',
      minWidth: 60,
      render: (r) => <StockStatusBadge stock={r.total_stock} />,
    },
    {
      key: 'name',
      label: 'Product Name',
      minWidth: 220,
      render: (r) => (
        <div className="min-w-0">
          <span className="font-medium text-foreground block truncate">{r.name}</span>
          <span className="text-[11px] text-muted-foreground">{r.category_name || '—'}</span>
        </div>
      ),
      sortFn: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'total_stock',
      label: 'Total Stock',
      align: 'right' as const,
      minWidth: 130,
      render: (r) => {
        const unitName = resolveUnitName(r.main_unit_id, unitsMap);
        return (
          <div className="text-right">
            <span className="font-semibold tabular-nums text-foreground">{r.total_stock.toFixed(2)}</span>
            {unitName && <span className="text-[11px] text-muted-foreground ml-1">{unitName}</span>}
          </div>
        );
      },
      sortFn: (a, b) => a.total_stock - b.total_stock,
    },
    {
      key: 'total_qty',
      label: 'Total Qty',
      align: 'right' as const,
      minWidth: 130,
      render: (r) => {
        const capacity = Number(r.unit_capacity) || 0;
        if (capacity <= 0) return <span className="text-muted-foreground">—</span>;
        const qty = r.total_stock / capacity;
        const containerName = (r.syrve_data as any)?.containerName
          || (r.syrve_data as any)?.container_name
          || (r.syrve_data as any)?.containers?.[0]?.name
          || 'pcs';
        return (
          <div className="text-right">
            <span className="font-semibold tabular-nums text-foreground">{qty.toFixed(1)}</span>
            <span className="text-[11px] text-muted-foreground ml-1">{containerName}</span>
          </div>
        );
      },
      sortFn: (a, b) => {
        const qA = (a.unit_capacity && a.unit_capacity > 0) ? a.total_stock / a.unit_capacity : 0;
        const qB = (b.unit_capacity && b.unit_capacity > 0) ? b.total_stock / b.unit_capacity : 0;
        return qA - qB;
      },
    },
    {
      key: 'cost',
      label: 'Unit Cost',
      align: 'right' as const,
      minWidth: 100,
      render: (r) => (
        <span className="tabular-nums text-muted-foreground">
          {r.purchase_price ? Number(r.purchase_price).toFixed(2) : '—'}
        </span>
      ),
      sortFn: (a, b) => (a.purchase_price || 0) - (b.purchase_price || 0),
    },
    {
      key: 'total_value',
      label: 'Total Value',
      align: 'right' as const,
      minWidth: 110,
      render: (r) => r.total_value > 0
        ? <span className="font-medium tabular-nums text-foreground">{r.total_value.toFixed(2)}</span>
        : <span className="text-muted-foreground">—</span>,
      sortFn: (a, b) => a.total_value - b.total_value,
    },
  ], [unitsMap]);

  const visibleColumns = ['status', 'name', 'total_stock', 'total_qty', 'cost', 'total_value'];

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Stock Levels"
        subtitle={`${filtered.length} products with stock • Total value: ${totalValue.toFixed(2)}`}
        icon={Package}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{allRows.length}</p>
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
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{quickCounts.lowStock}</p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Low Stock</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="quick-filter-bar">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mr-1">Quick:</span>
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
            data={filtered}
            columns={columns}
            visibleColumns={visibleColumns}
            columnWidths={columnWidths}
            onColumnResize={setColumnWidth}
            keyExtractor={r => r.product_id}
            onRowClick={r => navigate(`/products/${r.product_id}`)}
            emptyMessage="No products with available stock"
            compact
          />
        </div>
      )}
    </div>
  );
}
