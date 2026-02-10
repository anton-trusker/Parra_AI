import { useParams, useNavigate, Link } from 'react-router-dom';
import { mockWines, mockMovements } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Edit, Copy, Archive, Wine as WineIcon, ImageOff, MapPin, Grape, DollarSign, Package, Clock, Scan, Camera, Search, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function MethodIcon({ method }: { method: string }) {
  if (method === 'barcode') return <Scan className="w-3.5 h-3.5" />;
  if (method === 'image_ai') return <Camera className="w-3.5 h-3.5" />;
  return <Search className="w-3.5 h-3.5" />;
}

export default function WineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.roleId === 'role_admin';

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
  const volL = (wine.volume || 750) / 1000;
  const totalLitres = (wine.stockUnopened * volL) + (wine.stockOpened * volL);
  const movements = mockMovements.filter(m => m.wineId === wine.id);

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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total (L)</p>
              <p className="font-heading font-bold text-lg text-accent">{totalLitres.toFixed(2)}L</p>
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

      {/* Tabs: Details / History */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="details" className="flex-1 sm:flex-initial">Details</TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-initial">
            <History className="w-3.5 h-3.5 mr-1.5" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
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
                  <span className="text-muted-foreground">Total (Litres)</span><span className="font-bold text-accent">{totalLitres.toFixed(2)}L</span>
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
                  <span className="text-muted-foreground">SKU</span><span className="font-mono text-xs">{wine.sku || '—'}</span>
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
                {movements.slice(0, 5).map(m => {
                  const totalBtl = m.unopened + m.opened;
                  const volMl = wine.volume || 750;
                  const totalLtr = ((m.unopened * volMl) / 1000).toFixed(1);
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 text-sm gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <MethodIcon method={m.method} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{m.userName}</p>
                          <p className="text-xs text-muted-foreground">{new Date(m.timestamp).toLocaleDateString()} · {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 text-right">
                        <div>
                          <p className="font-heading font-bold">{totalBtl} <span className="text-xs font-normal text-muted-foreground">btl</span></p>
                          <p className="text-xs text-muted-foreground">{totalLtr} L</p>
                        </div>
                        {m.confidence && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">{m.confidence}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="wine-glass-effect rounded-xl p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-accent" /> Change History
            </h3>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No history records found for this wine.</p>
            ) : (
              <div className="space-y-3">
                {movements.map(m => {
                  const totalBtl = m.unopened + m.opened;
                  const volMl = wine.volume || 750;
                  const totalLtr = ((m.unopened * volMl + m.opened * volMl) / 1000).toFixed(2);
                  return (
                    <div key={m.id} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MethodIcon method={m.method} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm">{m.userName}</p>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Inventory count via <span className="capitalize font-medium text-foreground">{m.method.replace('_', ' ')}</span>
                          {m.sessionId && <> · Session <span className="font-mono">{m.sessionId}</span></>}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="text-muted-foreground">Unopened: <span className="font-semibold text-foreground">{m.unopened}</span></span>
                          <span className="text-muted-foreground">Opened: <span className="font-semibold text-foreground">{m.opened}</span></span>
                          <span className="text-muted-foreground">Total: <span className="font-bold text-foreground">{totalBtl} btl</span></span>
                          <span className="text-muted-foreground">Volume: <span className="font-medium text-accent">{totalLtr}L</span></span>
                        </div>
                        {m.confidence && (
                          <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent font-medium">
                            AI Confidence: {m.confidence}%
                          </span>
                        )}
                        {m.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">"{m.notes}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

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