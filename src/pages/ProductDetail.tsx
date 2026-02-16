import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Barcode, Database, DollarSign, Warehouse, Bot, History, ImageIcon, Link2, ArrowRight, Ruler, FolderTree } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProduct, useProductBarcodes, useProductChildren, useProductStockByStore, useMeasurementUnitsMap, resolveUnitName } from '@/hooks/useProducts';
import { mockAiScans } from '@/data/mockAiScans';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(id);
  const { data: barcodes = [] } = useProductBarcodes(id);
  const { data: children = [] } = useProductChildren(id);
  const { data: stockByStore = [] } = useProductStockByStore(id);
  const { data: unitsMap } = useMeasurementUnitsMap();
  const productAiScans = mockAiScans.filter(s => s.productId === id).slice(0, 5);

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
  const parentProduct = Array.isArray(product.parent_product) ? product.parent_product[0] : product.parent_product;
  const containers = product.syrve_data?.containers;
  const metadata = product.metadata || {};
  const syrveData = product.syrve_data || {};

  // Extract useful info from syrve_data
  const cookingPlaceType = metadata.cookingPlaceType || syrveData.cookingPlaceType || null;
  const productCategory = metadata.productCategory || syrveData.productCategory || null;

  // Container info and main unit
  const primaryContainer = Array.isArray(containers) && containers.length > 0
    ? (containers.find((c: any) => !c.deleted) || containers[0])
    : null;
  const containerVolume = primaryContainer?.count != null ? Number(primaryContainer.count) : null;
  const containerName = primaryContainer?.name || '';
  const mainUnitLabel = resolveUnitName(product.main_unit_id, unitsMap) || syrveData.mainUnit || '';

  const totalStoreStock = stockByStore.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const totalAmount = containerVolume ? totalStoreStock * containerVolume : null;

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
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {product.product_type && <TypeBadge type={product.product_type} />}
            {product.categories?.name && <Badge variant="outline">{product.categories.name}</Badge>}
            {productCategory && productCategory !== product.categories?.name && (
              <Badge variant="outline" className="text-muted-foreground">{productCategory}</Badge>
            )}
            {!product.is_active && <Badge variant="destructive">Inactive</Badge>}
            {product.is_marked && <Badge variant="secondary">Marked</Badge>}
            {product.is_by_glass && <Badge variant="secondary">By Glass</Badge>}
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
                  <InfoRow label="Category" value={product.categories?.name} />
                  {product.description && <InfoRow label="Description" value={product.description} />}
                  {cookingPlaceType && <InfoRow label="Cooking Place" value={cookingPlaceType} />}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Ruler className="w-4 h-4 text-muted-foreground" />Unit & Volume</h3>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow label="Main Unit" value={resolveUnitName(product.main_unit_id, unitsMap) || syrveData.mainUnit || null} />
                  <InfoRow label="Unit Capacity" value={product.unit_capacity ? `${product.unit_capacity}` : null} />
                  {Array.isArray(containers) && containers.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Containers</p>
                      <div className="space-y-1">
                        {containers.map((c: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1">
                            <span>{c.name || 'unit'}</span>
                            <span className="text-muted-foreground">{c.count != null ? `${c.count}L` : '—'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
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

            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Barcode className="w-4 h-4 text-muted-foreground" />Barcodes ({barcodes.length})</h3>
                {barcodes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No barcodes linked</p>
                ) : (
                  <div className="space-y-2">
                    {barcodes.map(bc => (
                      <div key={bc.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                        <div>
                          <span className="font-mono text-sm">{bc.barcode}</span>
                          {bc.container_name && <span className="text-xs text-muted-foreground ml-2">({bc.container_name})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          {bc.is_primary && <Badge variant="default" className="text-[10px]">Primary</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Stock Tab */}
        <TabsContent value="stock" className="space-y-5">
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-muted-foreground" />Stock by Store
              </h3>
              {stockByStore.length > 0 ? (
                <div className="space-y-0">
                  <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider pb-2 border-b border-border/50 px-1">
                    <span>Store</span><span>Type</span><span className="text-right">Stock</span><span className="text-right">Qty</span><span className="text-right">Unit Cost</span>
                  </div>
                  {stockByStore.map(s => {
                    const qty = Number(s.quantity) || 0;
                    const amt = containerVolume ? qty * containerVolume : null;
                    return (
                      <div key={s.id} className="grid grid-cols-5 gap-2 py-2.5 border-b border-border/30 last:border-0 text-sm px-1">
                        <span className="font-medium">{s.stores?.name || 'Unknown'}</span>
                        <span className="text-muted-foreground text-xs">{s.stores?.store_type || '—'}</span>
                        <span className="text-right tabular-nums font-medium">{qty.toFixed(2)}{mainUnitLabel ? ` ${mainUnitLabel}` : ''}</span>
                        <span className="text-right tabular-nums text-muted-foreground">{amt != null ? amt.toFixed(2) : '—'}</span>
                        <span className="text-right tabular-nums text-muted-foreground">{s.unit_cost?.toFixed(2) ?? '—'}</span>
                      </div>
                    );
                  })}
                  <div className="grid grid-cols-5 gap-2 pt-2 font-semibold text-sm px-1">
                    <span>Total</span>
                    <span />
                    <span className="text-right tabular-nums">{totalStoreStock.toFixed(2)}{mainUnitLabel ? ` ${mainUnitLabel}` : ''}</span>
                    <span className="text-right tabular-nums">{totalAmount != null ? totalAmount.toFixed(2) : '—'}</span>
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

          {/* Overall stock summary */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <InfoRow label="Total Stock" value={`${totalStoreStock || product.current_stock || 0}${mainUnitLabel ? ` ${mainUnitLabel}` : ''}`} highlight />
                <InfoRow label="Total Qty" value={totalAmount != null ? totalAmount.toFixed(2) : (product.unit_capacity && product.current_stock ? (product.current_stock * product.unit_capacity).toFixed(2) : null)} />
                <InfoRow label="Not in Store Movement" value={product.not_in_store_movement ? 'Yes' : 'No'} />
                <InfoRow label="Last Stock Update" value={product.stock_updated_at ? new Date(product.stock_updated_at).toLocaleDateString() : null} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-5">
          {/* Parent product */}
          {parentProduct && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Link2 className="w-4 h-4 text-muted-foreground" />Parent Product</h3>
                <div
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/products/${parentProduct.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-muted-foreground rotate-180" />
                    <span className="text-sm font-medium">{parentProduct.name}</span>
                  </div>
                  <TypeBadge type={parentProduct.product_type} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Child products (dishes using this goods) */}
          {children.length > 0 && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  {isGoods ? 'Used in Dishes' : 'Child Products'} ({children.length})
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  {isGoods ? 'Dishes and prepared items linked to this ingredient' : 'Products derived from this item'}
                </p>
                <div className="space-y-2">
                  {children.map((child: any) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/products/${child.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{child.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {child.unit_capacity && <span>{child.unit_capacity}L</span>}
                            {child.sale_price && <span>€{child.sale_price.toFixed(2)}</span>}
                            {child.current_stock != null && <span>Stock: {child.current_stock}</span>}
                          </div>
                        </div>
                      </div>
                      <TypeBadge type={child.product_type} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!parentProduct && children.length === 0 && (
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-5 text-center py-12">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">No relationships found</p>
                <p className="text-xs text-muted-foreground mt-1">Parent/child links are established during Syrve sync</p>
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
                <InfoRow label="Main Unit (Syrve)" value={resolveUnitName(product.main_unit_id, unitsMap) || syrveData.mainUnit || product.main_unit_id} />
                <InfoRow label="Last Synced" value={product.synced_at ? new Date(product.synced_at).toLocaleString() : null} />
                <InfoRow label="Active" value={product.is_active ? 'Yes' : 'No'} />
                <InfoRow label="Deleted in Syrve" value={product.is_deleted ? 'Yes' : 'No'} />
                <InfoRow label="Parent Group ID" value={syrveData.parentId || null} />
              </div>
              {metadata.vintage && <InfoRow label="Vintage (extracted)" value={String(metadata.vintage)} />}
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Raw Syrve Data</h3>
              <pre className="text-xs bg-muted/30 p-4 rounded-lg overflow-x-auto max-h-96 text-muted-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(syrveData, null, 2)}
              </pre>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Product Metadata</h3>
              <pre className="text-xs bg-muted/30 p-4 rounded-lg overflow-x-auto max-h-96 text-muted-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = {
    GOODS: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    DISH: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    MODIFIER: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
    PREPARED: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[type || ''] || 'bg-secondary text-secondary-foreground border border-border'}`}>{type || '—'}</span>;
}

function InfoRow({ label, value, highlight }: { label: string; value: string | null | undefined; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${highlight ? 'text-accent font-medium' : 'text-foreground'}`}>{value || '—'}</p>
    </div>
  );
}
