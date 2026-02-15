import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Barcode, Database, DollarSign, Warehouse, Bot, History, ImageIcon, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProduct, useProductBarcodes } from '@/hooks/useProducts';
import { mockAiScans } from '@/data/mockAiScans';
import { mockStockByStore } from '@/data/mockStockByStore';

// Mock history data
const mockStockHistory = [
  { date: '2026-02-15', event: 'Inventory count completed', change: -2, stockAfter: 12, user: 'Maria Silva' },
  { date: '2026-02-12', event: 'Stock adjustment', change: +3, stockAfter: 14, user: 'João Costa' },
  { date: '2026-02-10', event: 'Inventory count completed', change: -1, stockAfter: 11, user: 'Maria Silva' },
  { date: '2026-02-05', event: 'Syrve sync update', change: 0, stockAfter: 12, user: 'System' },
  { date: '2026-01-31', event: 'Year-end audit', change: -3, stockAfter: 12, user: 'João Costa' },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { data: barcodes = [] } = useProductBarcodes(id);

  // Mock AI data for this product
  const productAiScans = mockAiScans.filter(s => s.productId === id).slice(0, 5);
  // Mock per-store stock
  const storeStock = mockStockByStore.find(s => s.productId === id);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Products
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{product.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">{product.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {product.product_type && <Badge variant="secondary">{product.product_type}</Badge>}
            {product.categories?.name && <Badge variant="outline">{product.categories.name}</Badge>}
            {!product.is_active && <Badge variant="destructive">Inactive</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2"><Package className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="images" className="gap-2"><ImageIcon className="w-4 h-4" />Images & AI</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Database className="w-4 h-4" />Integrations</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><History className="w-4 h-4" />History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" />Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="SKU" value={product.sku} />
                  <InfoRow label="Code" value={product.code} />
                  <InfoRow label="Type" value={product.product_type} />
                  <InfoRow label="Unit Capacity" value={product.unit_capacity?.toString()} />
                  <InfoRow label="Description" value={product.description} />
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-muted-foreground" />Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Sale Price" value={product.sale_price?.toFixed(2)} highlight />
                  <InfoRow label="Purchase Price" value={product.purchase_price?.toFixed(2)} />
                  <InfoRow label="Default Sale Price" value={product.default_sale_price?.toFixed(2)} />
                  <InfoRow label="Updated" value={product.price_updated_at ? new Date(product.price_updated_at).toLocaleDateString() : null} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stock per store */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Warehouse className="w-4 h-4 text-muted-foreground" />Stock by Store</h3>
              {storeStock ? (
                <div className="space-y-2">
                  {storeStock.stores.map(s => (
                    <div key={s.storeId} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm">{s.storeName}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="tabular-nums">{s.unopened} <span className="text-muted-foreground text-xs">unopened</span></span>
                        <span className="tabular-nums">{s.open} <span className="text-muted-foreground text-xs">open</span></span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 font-medium text-sm">
                    <span>Total</span>
                    <span className="tabular-nums">{storeStock.totalUnopened + storeStock.totalOpen}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Current Stock" value={product.current_stock?.toString()} highlight />
                  <InfoRow label="Updated" value={product.stock_updated_at ? new Date(product.stock_updated_at).toLocaleDateString() : null} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Barcodes */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Barcode className="w-4 h-4 text-muted-foreground" />Barcodes ({barcodes.length})</h3>
              {barcodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No barcodes linked</p>
              ) : (
                <div className="space-y-2">
                  {barcodes.map(bc => (
                    <div key={bc.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <span className="font-mono text-sm">{bc.barcode}</span>
                        {bc.container_name && <span className="text-xs text-muted-foreground ml-2">({bc.container_name})</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {bc.is_primary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                        <Badge variant="outline" className="text-[10px]">{bc.source || 'unknown'}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images & AI Tab */}
        <TabsContent value="images" className="space-y-5">
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><ImageIcon className="w-4 h-4 text-muted-foreground" />Images</h3>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="aspect-square rounded-lg bg-muted/30 border border-dashed border-border/60 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">No images uploaded yet</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2"><Bot className="w-4 h-4 text-muted-foreground" />AI Recognition Results</h3>
                <Button variant="outline" size="sm" className="gap-2 text-xs"><Bot className="w-3.5 h-3.5" />Run AI Scan</Button>
              </div>
              {productAiScans.length === 0 ? (
                <p className="text-sm text-muted-foreground">No AI scans for this product</p>
              ) : (
                <div className="space-y-3">
                  {productAiScans.map(scan => (
                    <div key={scan.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{scan.detectedName}</p>
                        <p className="text-xs text-muted-foreground">{new Date(scan.timestamp).toLocaleString()} · {scan.modelUsed}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm tabular-nums font-medium ${scan.confidence >= 0.9 ? 'text-emerald-500' : scan.confidence >= 0.7 ? 'text-amber-500' : 'text-destructive'}`}>
                          {Math.round(scan.confidence * 100)}%
                        </span>
                        <p className="text-[10px] text-muted-foreground">{scan.processingTimeMs}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-5">
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Database className="w-4 h-4 text-muted-foreground" />Syrve Mapping</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <InfoRow label="Syrve Product ID" value={product.syrve_product_id} />
                <InfoRow label="Last Synced" value={product.synced_at ? new Date(product.synced_at).toLocaleString() : null} />
                <InfoRow label="Active" value={product.is_active ? 'Yes' : 'No'} />
                <InfoRow label="Deleted in Syrve" value={product.is_deleted ? 'Yes' : 'No'} />
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Raw Syrve Data</h3>
              <pre className="text-xs bg-muted/30 p-4 rounded-lg overflow-x-auto max-h-96 text-muted-foreground">
                {JSON.stringify(product.syrve_data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-5">
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><History className="w-4 h-4 text-muted-foreground" />Stock History</h3>
              <div className="space-y-0">
                {mockStockHistory.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
                    <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{entry.event}</p>
                      <p className="text-xs text-muted-foreground">{entry.date} · {entry.user}</p>
                    </div>
                    <div className="text-right">
                      {entry.change !== 0 && (
                        <span className={`text-sm tabular-nums font-medium ${entry.change < 0 ? 'text-destructive' : 'text-emerald-500'}`}>
                          {entry.change > 0 ? `+${entry.change}` : entry.change}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground tabular-nums">Stock: {entry.stockAfter}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${highlight ? 'text-accent font-medium' : 'text-foreground'}`}>{value || '—'}</p>
    </div>
  );
}
