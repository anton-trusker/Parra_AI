import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Package, MapPin, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { mockStores } from '@/data/mockStores';
import { mockStockByStore } from '@/data/mockStockByStore';

export default function ByStorePage() {
  const navigate = useNavigate();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const selectedStore = mockStores.find((s) => s.id === selectedStoreId);

  const filteredProducts = useMemo(() => {
    if (!selectedStoreId) return [];
    return mockStockByStore
      .filter((p) => p.stores.some((s) => s.storeId === selectedStoreId))
      .map((p) => {
        const storeData = p.stores.find((s) => s.storeId === selectedStoreId)!;
        return { ...p, storeUnopened: storeData.unopened, storeOpen: storeData.open, lastCounted: storeData.lastCounted };
      });
  }, [selectedStoreId]);

  const columns = [
    { key: 'productName', label: 'Product', sortable: true, render: (item: any) => (
      <button onClick={() => navigate(`/products/${item.productId}`)} className="text-left font-medium text-foreground hover:text-primary transition-colors">{item.productName}</button>
    )},
    { key: 'category', label: 'Category', sortable: true, render: (item: any) => <Badge variant="outline" className="text-xs">{item.category}</Badge> },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'storeUnopened', label: 'Unopened', sortable: true, render: (item: any) => <span className="tabular-nums">{item.storeUnopened}</span> },
    { key: 'storeOpen', label: 'Open', sortable: true, render: (item: any) => <span className="tabular-nums">{item.storeOpen}</span> },
    { key: 'lastCounted', label: 'Last Counted', sortable: true, render: (item: any) => item.lastCounted ? <span className="text-xs text-muted-foreground">{new Date(item.lastCounted).toLocaleDateString()}</span> : <span className="text-xs text-muted-foreground">—</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory by Store" subtitle="View and manage stock levels per location" icon={Store} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStores.map((store) => (
          <Card key={store.id} className={`cursor-pointer transition-all hover:shadow-md rounded-xl ${selectedStoreId === store.id ? 'ring-2 ring-primary border-primary' : 'border-border/60'}`} onClick={() => setSelectedStoreId(store.id === selectedStoreId ? null : store.id)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{store.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{store.address}, {store.city}</div>
                </div>
                <ArrowRight className={`w-4 h-4 transition-transform ${selectedStoreId === store.id ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5 text-muted-foreground" /><span className="tabular-nums font-medium">{store.productCount}</span><span className="text-muted-foreground">products</span></div>
                <div className="text-muted-foreground">·</div>
                <div><span className="tabular-nums font-medium">{store.totalStock}</span><span className="text-muted-foreground ml-1">units</span></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedStore && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">{selectedStore.name} — Products</h2>
          <SimpleDataTable data={filteredProducts} columns={columns} keyField="productId" emptyMessage={`No products found in ${selectedStore.name}`} />
        </div>
      )}
      {!selectedStore && (
        <div className="text-center py-12 text-muted-foreground">
          <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a store above to view its inventory</p>
        </div>
      )}
    </div>
  );
}
