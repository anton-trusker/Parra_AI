import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, Search, Warehouse, RefreshCw, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/EmptyState';
import { useStores } from '@/hooks/useStores';
import { useProducts } from '@/hooks/useProducts';
import { useStockLevelsByStore, useStockSummaryByStore } from '@/hooks/useStockLevels';

export default function ByStorePage() {
  const navigate = useNavigate();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const { data: stores = [], isLoading: storesLoading } = useStores();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: stockLevels = [], isLoading: stockLoading } = useStockLevelsByStore(selectedStoreId);
  const { data: stockSummary = {} } = useStockSummaryByStore();

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  // Build a map of product_id -> stock level for selected store
  const stockByProductId = useMemo(() => {
    const map = new Map<string, { quantity: number; unitName: string | null }>();
    for (const sl of stockLevels) {
      map.set(sl.product_id, {
        quantity: Number(sl.quantity) || 0,
        unitName: (sl.measurement_units as any)?.short_name || (sl.measurement_units as any)?.name || null,
      });
    }
    return map;
  }, [stockLevels]);

  // Products for the selected store: only those that have stock_levels entries
  const storeProducts = useMemo(() => {
    if (!selectedStoreId) return [];
    const productIds = new Set(stockLevels.map(sl => sl.product_id));
    let result = products.filter(p => p.is_active && productIds.has(p.id));
    if (productSearch) {
      const q = productSearch.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)));
    }
    return result;
  }, [products, stockLevels, selectedStoreId, productSearch]);

  const totalActiveProducts = products.filter(p => p.is_active).length;
  const totalStock = Object.values(stockSummary).reduce((s, v) => s + v.totalQuantity, 0);

  const columns = [
    { key: 'name', label: 'Product', sortable: true, render: (item: any) => (
      <button onClick={() => navigate(`/products/${item.id}`)} className="text-left font-medium text-foreground hover:text-primary transition-colors">{item.name}</button>
    )},
    { key: 'category', label: 'Category', sortable: true, render: (item: any) => (
      <Badge variant="outline" className="text-xs">{item.categories?.name || '—'}</Badge>
    )},
    { key: 'sku', label: 'SKU', sortable: true, render: (item: any) => (
      <span className="text-xs text-muted-foreground font-mono">{item.sku || '—'}</span>
    )},
    { key: 'stock', label: 'Stock', sortable: true, render: (item: any) => {
      const sl = stockByProductId.get(item.id);
      const stock = sl?.quantity ?? 0;
      const unit = sl?.unitName;
      const color = stock <= 0 ? 'text-destructive' : stock < 5 ? 'text-amber-500' : 'text-emerald-500';
      return <span className={`tabular-nums font-medium ${color}`}>{stock}{unit ? ` ${unit}` : ''}</span>;
    }},
    { key: 'sale_price', label: 'Price', sortable: true, render: (item: any) => (
      <span className="tabular-nums text-muted-foreground">{item.sale_price?.toFixed(2) ?? '—'}</span>
    )},
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Inventory by Store" subtitle="View and manage stock levels per warehouse location" icon={Warehouse} />

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stores.length}</p>
              <p className="text-xs text-muted-foreground">Warehouses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActiveProducts}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{totalStock.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Store Cards */}
      {storesLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : stores.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No warehouses found"
          description="Warehouses are synced from Syrve. Run a sync to populate."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => {
            const summary = stockSummary[store.id];
            return (
              <Card
                key={store.id}
                className={`cursor-pointer transition-all duration-200 rounded-xl hover:shadow-md ${
                  selectedStoreId === store.id
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'border-border/60 hover:border-primary/30'
                }`}
                onClick={() => setSelectedStoreId(store.id === selectedStoreId ? null : store.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{store.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {store.store_type && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{store.store_type}</Badge>
                        )}
                        {store.code && (
                          <span className="text-[10px] text-muted-foreground font-mono">#{store.code}</span>
                        )}
                      </div>
                      {summary && (
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">{summary.productCount} products</span>
                          <span className="text-xs font-medium text-foreground">{summary.totalQuantity.toLocaleString()} units</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${selectedStoreId === store.id ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  {store.synced_at && (
                    <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
                      <RefreshCw className="w-3 h-3" />
                      <span>Synced {new Date(store.synced_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product List for Selected Store */}
      {selectedStore && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-heading font-semibold text-foreground">{selectedStore.name} — Products ({storeProducts.length})</h2>
          </div>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-10 h-10 bg-card border-border"
            />
          </div>
          {productsLoading || stockLoading ? (
            <Skeleton className="h-40 rounded-xl" />
          ) : (
            <SimpleDataTable data={storeProducts} columns={columns} keyField="id" emptyMessage="No products with stock in this store" />
          )}
        </div>
      )}

      {!selectedStore && !storesLoading && stores.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Select a warehouse above to view its inventory</p>
        </div>
      )}
    </div>
  );
}
