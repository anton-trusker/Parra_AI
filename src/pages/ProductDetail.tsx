import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Barcode, Database, DollarSign, Warehouse, Bot, History, ImageIcon, TrendingUp, TrendingDown, Link2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProduct, useProductBarcodes } from '@/hooks/useProducts';
import { mockAiScans } from '@/data/mockAiScans';
import { mockStockByStore } from '@/data/mockStockByStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data
const mockStockHistory = [
  { date: '2026-02-15', event: 'Inventory count completed', change: -2, stockAfter: 12, user: 'Maria Silva' },
  { date: '2026-02-12', event: 'Stock adjustment', change: +3, stockAfter: 14, user: 'João Costa' },
  { date: '2026-02-10', event: 'Inventory count completed', change: -1, stockAfter: 11, user: 'Maria Silva' },
  { date: '2026-02-05', event: 'Syrve sync update', change: 0, stockAfter: 12, user: 'System' },
  { date: '2026-01-31', event: 'Year-end audit', change: -3, stockAfter: 12, user: 'João Costa' },
];

const mockStockChart = [
  { date: 'Jan 20', stock: 18 }, { date: 'Jan 27', stock: 15 }, { date: 'Feb 3', stock: 14 },
  { date: 'Feb 7', stock: 11 }, { date: 'Feb 10', stock: 14 }, { date: 'Feb 15', stock: 12 },
];

const mockMovements = [
  { id: '1', date: '2026-02-15 09:30', type: 'count', from: 'Inventory Session #IC-2025-008', qty: -2, balance: 12 },
  { id: '2', date: '2026-02-12 14:15', type: 'adjustment', from: 'Manual adjustment by João Costa', qty: +3, balance: 14 },
  { id: '3', date: '2026-02-10 08:00', type: 'count', from: 'Inventory Session #IC-2025-007', qty: -1, balance: 11 },
  { id: '4', date: '2026-02-05 03:00', type: 'sync', from: 'Syrve stock sync', qty: 0, balance: 12 },
  { id: '5', date: '2026-01-31 16:00', type: 'count', from: 'Year-end audit session', qty: -3, balance: 12 },
];

const mockRelatedDishes = [
  { id: 'dish-1', name: 'Wine by Glass - House Red', type: 'DISH', usageQty: '0.15L per serving' },
  { id: 'dish-2', name: 'Wine Tasting Flight - Red', type: 'DISH', usageQty: '0.075L per flight' },
  { id: 'dish-3', name: 'Sangria Pitcher', type: 'PREPARED', usageQty: '0.5L per pitcher' },
];

const mockIngredients = [
  { id: 'ing-1', name: 'House Red Wine', type: 'GOODS', usageQty: '0.5L' },
  { id: 'ing-2', name: 'Fresh Orange Juice', type: 'GOODS', usageQty: '0.2L' },
  { id: 'ing-3', name: 'Sugar Syrup', type: 'GOODS', usageQty: '0.05L' },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { data: barcodes = [] } = useProductBarcodes(id);
  const productAiScans = mockAiScans.filter(s => s.productId === id).slice(0, 5);
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

  const isGoods = product.product_type === 'GOODS';
  const isDish = product.product_type === 'DISH' || product.product_type === 'PREPARED';

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/products" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Products
        </Link>
        <span>/</span>
        <span className="text-foreground truncate">{product.name}</span>
      </div>

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

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2"><Package className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="stock" className="gap-2"><Warehouse className="w-4 h-4" />Stock</TabsTrigger>
          <TabsTrigger value="relationships" className="gap-2"><Link2 className="w-4 h-4" />Relationships</TabsTrigger>
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

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-5">
          {/* Stock chart */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Stock Level Trend</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockStockChart}>
                    <defs>
                      <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="stock" stroke="hsl(var(--primary))" fill="url(#stockGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stock by store */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Warehouse className="w-4 h-4 text-muted-foreground" />Stock by Location</h3>
              {storeStock ? (
                <div className="space-y-0">
                  <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50 px-1">
                    <span>Location</span><span className="text-right">Unopened</span><span className="text-right">Open</span><span className="text-right">Last Counted</span>
                  </div>
                  {storeStock.stores.map(s => (
                    <div key={s.storeId} className="grid grid-cols-4 gap-2 py-2.5 border-b border-border/30 last:border-0 text-sm px-1">
                      <span>{s.storeName}</span>
                      <span className="text-right tabular-nums">{s.unopened}</span>
                      <span className="text-right tabular-nums">{s.open}</span>
                      <span className="text-right text-xs text-muted-foreground">{s.lastCounted ? new Date(s.lastCounted).toLocaleDateString() : '—'}</span>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 gap-2 pt-2 font-medium text-sm px-1">
                    <span>Total</span>
                    <span className="text-right tabular-nums">{storeStock.totalUnopened}</span>
                    <span className="text-right tabular-nums">{storeStock.totalOpen}</span>
                    <span />
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

          {/* Movement history */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Stock Movements</h3>
              <div className="space-y-0">
                <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50 px-1">
                  <span>Date</span><span>Type</span><span className="col-span-1">Source</span><span className="text-right">Change</span><span className="text-right">Balance</span>
                </div>
                {mockMovements.map(m => (
                  <div key={m.id} className="grid grid-cols-5 gap-2 py-2.5 border-b border-border/30 last:border-0 text-sm px-1 items-center">
                    <span className="text-xs text-muted-foreground">{m.date}</span>
                    <Badge variant="outline" className="text-[10px] w-fit">{m.type}</Badge>
                    <span className="text-xs text-muted-foreground truncate">{m.from}</span>
                    <span className={`text-right tabular-nums font-medium ${m.qty > 0 ? 'text-emerald-500' : m.qty < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {m.qty > 0 ? `+${m.qty}` : m.qty}
                    </span>
                    <span className="text-right tabular-nums">{m.balance}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-5">
          {isGoods && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2"><Link2 className="w-4 h-4 text-muted-foreground" />Used in Dishes</h3>
                <p className="text-xs text-muted-foreground mb-4">Dishes and prepared items that consume this ingredient</p>
                {mockRelatedDishes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Not used in any dishes</p>
                ) : (
                  <div className="space-y-2">
                    {mockRelatedDishes.map(dish => (
                      <div key={dish.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{dish.name}</p>
                            <p className="text-xs text-muted-foreground">{dish.usageQty}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{dish.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isDish && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2"><Link2 className="w-4 h-4 text-muted-foreground" />Ingredients</h3>
                <p className="text-xs text-muted-foreground mb-4">Raw goods consumed when this dish is prepared</p>
                {mockIngredients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No ingredients defined</p>
                ) : (
                  <div className="space-y-2">
                    {mockIngredients.map(ing => (
                      <div key={ing.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{ing.name}</p>
                            <p className="text-xs text-muted-foreground">{ing.usageQty}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">{ing.type}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!isGoods && !isDish && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5 text-center py-12">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No relationships available for this product type</p>
                <p className="text-xs text-muted-foreground mt-1">Relationships are shown for Goods (used in dishes) and Dishes/Prepared items (ingredients)</p>
              </CardContent>
            </Card>
          )}
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
