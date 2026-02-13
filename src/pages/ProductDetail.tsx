import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, Barcode, Database, DollarSign, Warehouse, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useProduct, useProductBarcodes } from '@/hooks/useProducts';
import CollapsibleSection from '@/components/CollapsibleSection';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { data: barcodes = [] } = useProductBarcodes(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
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
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
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

      {/* Overview */}
      <CollapsibleSection icon={Package} title="Overview" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="SKU" value={product.sku} />
          <InfoRow label="Code" value={product.code} />
          <InfoRow label="Product Type" value={product.product_type} />
          <InfoRow label="Main Unit ID" value={product.main_unit_id} />
          <InfoRow label="Unit Capacity" value={product.unit_capacity?.toString()} />
          <InfoRow label="Description" value={product.description} />
        </div>
      </CollapsibleSection>

      {/* Pricing */}
      <CollapsibleSection icon={DollarSign} title="Pricing" defaultOpen>
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Sale Price" value={product.sale_price?.toFixed(2)} highlight />
          <InfoRow label="Purchase Price" value={product.purchase_price?.toFixed(2)} />
          <InfoRow label="Default Sale Price" value={product.default_sale_price?.toFixed(2)} />
          <InfoRow label="Price Updated" value={product.price_updated_at ? new Date(product.price_updated_at).toLocaleString() : null} />
        </div>
      </CollapsibleSection>

      {/* Stock */}
      <CollapsibleSection icon={Warehouse} title="Stock">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow label="Current Stock" value={product.current_stock?.toString()} highlight />
          <InfoRow label="Stock Updated" value={product.stock_updated_at ? new Date(product.stock_updated_at).toLocaleString() : null} />
          <InfoRow label="Not In Store Movement" value={product.not_in_store_movement ? 'Yes' : 'No'} />
        </div>
      </CollapsibleSection>

      {/* Barcodes */}
      <CollapsibleSection icon={Barcode} title={`Barcodes (${barcodes.length})`}>
        {barcodes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No barcodes linked</p>
        ) : (
          <div className="space-y-2">
            {barcodes.map(bc => (
              <div key={bc.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
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
      </CollapsibleSection>

      {/* Raw Syrve Data */}
      <CollapsibleSection icon={Database} title="Raw Syrve Data">
        <pre className="text-xs bg-secondary/50 p-4 rounded-lg overflow-x-auto max-h-96 text-muted-foreground">
          {JSON.stringify(product.syrve_data, null, 2)}
        </pre>
      </CollapsibleSection>
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
