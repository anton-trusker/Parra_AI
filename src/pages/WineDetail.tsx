import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockWines, mockMovements } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Edit, Copy, Archive, Wine as WineIcon, ImageOff, MapPin, Grape, DollarSign, Package, Clock, Scan, Camera, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function MethodIcon({ method }: { method: string }) {
  if (method === 'barcode') return <Scan className="w-3.5 h-3.5" />;
  if (method === 'image_ai') return <Camera className="w-3.5 h-3.5" />;
  return <Search className="w-3.5 h-3.5" />;
}

export default function WineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const wine = mockWines.find(w => w.id === id);
  if (!wine) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <WineIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold mb-2">Wine not found</h2>
        <Button variant="outline" onClick={() => navigate('/catalog')}>Back to Catalog</Button>
      </div>
    );
  }

  const total = wine.stockUnopened + wine.stockOpened;
  const movements = mockMovements.filter(m => m.wineId === wine.id).slice(0, 5);

  const stockStatusCls = total === 0 ? 'stock-out' : total < wine.minStockLevel ? 'stock-low' : 'stock-healthy';
  const stockStatusLabel = total === 0 ? 'Out of Stock' : total < wine.minStockLevel ? 'Low Stock' : 'In Stock';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/catalog" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Catalog
        </Link>
        <span>/</span>
        <span className="text-foreground">{wine.name}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Image */}
        <div className="w-full lg:w-72 h-64 lg:h-auto wine-glass-effect rounded-xl flex items-center justify-center flex-shrink-0">
          {wine.hasImage ? (
            <div className="w-full h-full bg-gradient-to-b from-wine-burgundy/40 to-card rounded-xl flex items-center justify-center">
              <WineIcon className="w-20 h-20 text-wine-gold/30" />
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageOff className="w-12 h-12 mb-2" />
              <span className="text-sm">No Image</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">{wine.fullName || wine.name}</h1>
              <p className="text-lg text-muted-foreground">{wine.producer}</p>
              {wine.estate && wine.estate !== wine.producer && (
                <p className="text-sm text-muted-foreground">Estate: {wine.estate}</p>
              )}
            </div>
            {isAdmin && (
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" className="border-border" onClick={() => navigate(`/catalog/${wine.id}/edit`)}>
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="border-border" onClick={() => toast.info('Duplicate feature coming soon')}>
                  <Copy className="w-4 h-4 mr-1" /> Duplicate
                </Button>
              </div>
            )}
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2">
            <span className={`wine-badge bg-wine-red/20 text-wine-red-light`}>{wine.type}</span>
            <span className={`wine-badge ${stockStatusCls}`}>{stockStatusLabel}</span>
            {wine.appellation && <span className="wine-badge bg-secondary text-secondary-foreground">{wine.appellation}</span>}
            {wine.availableByGlass && <span className="wine-badge bg-accent/15 text-accent">By Glass</span>}
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Vintage</p>
              <p className="font-heading font-bold text-lg">{wine.vintage || 'NV'}</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-heading font-bold text-lg">{wine.volume}ml</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">ABV</p>
              <p className="font-heading font-bold text-lg">{wine.abv}%</p>
            </div>
            {isAdmin && (
              <div className="wine-glass-effect rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-heading font-bold text-lg text-accent">${wine.price}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Origin */}
        <div className="wine-glass-effect rounded-xl p-5 space-y-3">
          <h3 className="font-heading font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Origin</h3>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted-foreground">Country</span><span>{wine.country}</span>
            <span className="text-muted-foreground">Region</span><span>{wine.region}</span>
            {wine.subRegion && <><span className="text-muted-foreground">Sub-Region</span><span>{wine.subRegion}</span></>}
            {wine.appellation && <><span className="text-muted-foreground">Appellation</span><span>{wine.appellation}</span></>}
          </div>
        </div>

        {/* Grapes & Character */}
        <div className="wine-glass-effect rounded-xl p-5 space-y-3">
          <h3 className="font-heading font-semibold flex items-center gap-2"><Grape className="w-4 h-4 text-accent" /> Grapes & Character</h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {wine.grapeVarieties.map(g => (
              <span key={g} className="wine-badge bg-secondary text-secondary-foreground">{g}</span>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            {wine.body && <><span className="text-muted-foreground">Body</span><span className="capitalize">{wine.body}</span></>}
            {wine.sweetness && <><span className="text-muted-foreground">Sweetness</span><span className="capitalize">{wine.sweetness}</span></>}
            {wine.acidity && <><span className="text-muted-foreground">Acidity</span><span className="capitalize">{wine.acidity}</span></>}
            {wine.tannins && <><span className="text-muted-foreground">Tannins</span><span className="capitalize">{wine.tannins}</span></>}
          </div>
        </div>

        {/* Stock (admin only) */}
        {isAdmin && (
          <div className="wine-glass-effect rounded-xl p-5 space-y-3">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Stock</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Unopened</span><span className="font-semibold">{wine.stockUnopened}</span>
              <span className="text-muted-foreground">Opened</span><span className="font-semibold">{wine.stockOpened}</span>
              <span className="text-muted-foreground">Total</span><span className="font-bold">{total}</span>
              <span className="text-muted-foreground">Min Level</span><span>{wine.minStockLevel}</span>
              {wine.maxStockLevel && <><span className="text-muted-foreground">Max Level</span><span>{wine.maxStockLevel}</span></>}
              {wine.reorderPoint && <><span className="text-muted-foreground">Reorder At</span><span>{wine.reorderPoint}</span></>}
              <span className="text-muted-foreground">Location</span><span>{wine.location}</span>
              <span className="text-muted-foreground">Value</span><span className="text-accent font-semibold">${(total * wine.price).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Pricing (admin only) */}
        {isAdmin && (
          <div className="wine-glass-effect rounded-xl p-5 space-y-3">
            <h3 className="font-heading font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-accent" /> Pricing</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              {wine.purchasePrice != null && <><span className="text-muted-foreground">Purchase</span><span>${wine.purchasePrice}</span></>}
              <span className="text-muted-foreground">Sale Price</span><span className="text-accent">${wine.salePrice || wine.price}</span>
              {wine.glassPrice != null && <><span className="text-muted-foreground">Glass Price</span><span>${wine.glassPrice}</span></>}
              {wine.supplierName && <><span className="text-muted-foreground">Supplier</span><span>{wine.supplierName}</span></>}
              <span className="text-muted-foreground">SKU</span><span className="font-mono text-xs">{wine.sku}</span>
              {wine.barcode && <><span className="text-muted-foreground">Barcode</span><span className="font-mono text-xs">{wine.barcode}</span></>}
            </div>
          </div>
        )}
      </div>

      {/* Tasting Notes */}
      {wine.tastingNotes && (
        <div className="wine-glass-effect rounded-xl p-5">
          <h3 className="font-heading font-semibold mb-2">Tasting Notes</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{wine.tastingNotes}</p>
          {wine.foodPairing && (
            <p className="text-sm mt-3"><span className="text-muted-foreground">Pairs with:</span> {wine.foodPairing}</p>
          )}
        </div>
      )}

      {/* Recent movements */}
      {isAdmin && movements.length > 0 && (
        <div className="wine-glass-effect rounded-xl p-5">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /> Recent Movements</h3>
          <div className="space-y-2">
            {movements.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm">
                <div className="flex items-center gap-2">
                  <MethodIcon method={m.method} />
                  <span className="text-muted-foreground">{m.userName}</span>
                </div>
                <span>{m.unopened}U + {m.opened}O</span>
                <span className="text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="mt-2 text-accent" onClick={() => navigate('/history')}>
            View All History →
          </Button>
        </div>
      )}

      {/* Admin danger zone */}
      {isAdmin && (
        <div className="wine-glass-effect rounded-xl p-5 border-destructive/30">
          <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => toast.info('Archive feature coming soon')}>
              <Archive className="w-4 h-4 mr-1" /> Archive Wine
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
