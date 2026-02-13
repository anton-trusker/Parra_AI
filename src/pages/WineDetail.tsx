import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useWine } from '@/hooks/useWines';
import { useWineImages, useUploadWineImage, useSetPrimaryImage, useDeleteWineImage } from '@/hooks/useWineImages';
import { useWineVariants } from '@/hooks/useWineVariants';
import { useWineMovements } from '@/hooks/useWineMovements';
import { useArchiveWine } from '@/hooks/useWines';
import { ArrowLeft, Edit, Copy, Archive, Wine as WineIcon, ImageOff, MapPin, Grape, DollarSign, Package, Clock, History, Upload, Star, Trash2, Layers, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useRef } from 'react';

const TYPE_DISPLAY: Record<string, string> = {
  red: 'Red', white: 'White', rose: 'Rosé', sparkling: 'Sparkling', fortified: 'Fortified', dessert: 'Dessert',
};

export default function WineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: wine, isLoading } = useWine(id);
  const { data: images = [] } = useWineImages(id);
  const { data: variants = [] } = useWineVariants(id);
  const { data: movements = [] } = useWineMovements(id);
  const uploadImage = useUploadWineImage();
  const setPrimary = useSetPrimaryImage();
  const deleteImage = useDeleteWineImage();
  const archiveWine = useArchiveWine();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6"><Skeleton className="w-72 h-64 rounded-xl" /><div className="flex-1 space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-6 w-1/2" /><Skeleton className="h-20 w-full" /></div></div>
      </div>
    );
  }

  if (!wine) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <WineIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold mb-2">Wine not found</h2>
        <Button variant="outline" onClick={() => navigate('/catalog')}>Back to Catalog</Button>
      </div>
    );
  }

  const total = wine.current_stock_unopened + wine.current_stock_opened;
  const volL = (wine.volume_ml || 750) / 1000;
  const totalLitres = total * volL;
  const primaryImage = images.find(i => i.is_primary) || images[0];
  const typeDisplay = wine.wine_type ? TYPE_DISPLAY[wine.wine_type] || wine.wine_type : '—';

  const stockStatusCls = wine.stock_status === 'out_of_stock' ? 'stock-out' : wine.stock_status === 'low_stock' ? 'stock-low' : 'stock-healthy';
  const stockStatusLabel = wine.stock_status === 'out_of_stock' ? 'Out of Stock' : wine.stock_status === 'low_stock' ? 'Low Stock' : 'In Stock';

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    try {
      await uploadImage.mutateAsync({ wineId: wine.id, file, isPrimary: images.length === 0 });
      toast.success('Image uploaded');
    } catch { toast.error('Failed to upload image'); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleArchive = async () => {
    try {
      await archiveWine.mutateAsync(wine.id);
      toast.success('Wine archived');
      navigate('/catalog');
    } catch { toast.error('Failed to archive'); }
  };

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
        <div className="w-full lg:w-72 h-64 lg:h-auto wine-glass-effect rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          {primaryImage?.image_url ? (
            <img src={primaryImage.image_url} alt={wine.name} className="w-full h-full object-cover rounded-xl" />
          ) : (
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageOff className="w-12 h-12 mb-2" />
              <span className="text-sm">No Image</span>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-heading font-bold">{wine.full_name || wine.name}</h1>
              <p className="text-lg text-muted-foreground">{wine.producer || '—'}</p>
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

          <div className="flex flex-wrap gap-2">
            <span className="wine-badge bg-wine-red/20 text-wine-red-light">{typeDisplay}</span>
            <span className={`wine-badge ${stockStatusCls}`}>{stockStatusLabel}</span>
            {wine.appellation && <span className="wine-badge bg-secondary text-secondary-foreground">{wine.appellation}</span>}
            {wine.available_by_glass && <span className="wine-badge bg-accent/15 text-accent">By Glass</span>}
            {wine.enrichment_source && wine.enrichment_source !== 'manual' && (
              <span className={`wine-badge ${wine.enrichment_source === 'syrve_auto' ? 'bg-sky-500/20 text-sky-400' : wine.enrichment_source === 'ai' ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-secondary-foreground'}`}>
                {wine.enrichment_source === 'syrve_auto' ? 'Auto-enriched' : wine.enrichment_source === 'ai' ? 'AI Enriched' : wine.enrichment_source}
              </span>
            )}
          </div>
          {wine.raw_source_name && (
            <p className="text-xs text-muted-foreground">Original name: <span className="font-mono">{wine.raw_source_name}</span></p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Year</p>
              <p className="font-heading font-bold text-lg">{wine.vintage || 'NV'}</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Volume</p>
              <p className="font-heading font-bold text-lg">{wine.volume_ml || 750}ml</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">ABV</p>
              <p className="font-heading font-bold text-lg">{wine.alcohol_content || '—'}%</p>
            </div>
            <div className="wine-glass-effect rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total (L)</p>
              <p className="font-heading font-bold text-lg text-accent">{totalLitres.toFixed(2)}L</p>
            </div>
            {isAdmin && (
              <div className="wine-glass-effect rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-heading font-bold text-lg text-accent">{wine.currency || 'AED'} {wine.sale_price ?? '—'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="details" className="flex-1 sm:flex-initial">Details</TabsTrigger>
          <TabsTrigger value="images" className="flex-1 sm:flex-initial">
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Images ({images.length})
          </TabsTrigger>
          <TabsTrigger value="variants" className="flex-1 sm:flex-initial">
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Variants ({variants.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-initial">
            <History className="w-3.5 h-3.5 mr-1.5" /> History
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="wine-glass-effect rounded-xl p-5 space-y-3">
              <h3 className="font-heading font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-accent" /> Origin</h3>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-muted-foreground">Country</span><span>{wine.country || '—'}</span>
                <span className="text-muted-foreground">Region</span><span>{wine.region || '—'}</span>
                {wine.sub_region && <><span className="text-muted-foreground">Sub-Region</span><span>{wine.sub_region}</span></>}
                {wine.appellation && <><span className="text-muted-foreground">Appellation</span><span>{wine.appellation}</span></>}
                {wine.vineyard && <><span className="text-muted-foreground">Vineyard</span><span>{wine.vineyard}</span></>}
              </div>
            </div>

            <div className="wine-glass-effect rounded-xl p-5 space-y-3">
              <h3 className="font-heading font-semibold flex items-center gap-2"><Grape className="w-4 h-4 text-accent" /> Grapes & Character</h3>
              {Array.isArray(wine.grape_varieties) && (wine.grape_varieties as string[]).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(wine.grape_varieties as string[]).map((g: string) => (
                    <span key={g} className="wine-badge bg-secondary text-secondary-foreground">{g}</span>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                {wine.body && <><span className="text-muted-foreground">Body</span><span className="capitalize">{wine.body}</span></>}
                {wine.sweetness && <><span className="text-muted-foreground">Sweetness</span><span className="capitalize">{wine.sweetness}</span></>}
                {wine.acidity && <><span className="text-muted-foreground">Acidity</span><span className="capitalize">{wine.acidity}</span></>}
                {wine.tannins && <><span className="text-muted-foreground">Tannins</span><span className="capitalize">{wine.tannins}</span></>}
              </div>
            </div>

            {isAdmin && (
              <div className="wine-glass-effect rounded-xl p-5 space-y-3">
                <h3 className="font-heading font-semibold flex items-center gap-2"><Package className="w-4 h-4 text-accent" /> Stock</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Unopened</span><span className="font-semibold">{wine.current_stock_unopened}</span>
                  <span className="text-muted-foreground">Opened</span><span className="font-semibold">{wine.current_stock_opened}</span>
                  <span className="text-muted-foreground">Total</span><span className="font-bold">{total}</span>
                  <span className="text-muted-foreground">Total (Litres)</span><span className="font-bold text-accent">{totalLitres.toFixed(2)}L</span>
                  <span className="text-muted-foreground">Min Level</span><span>{wine.min_stock_level ?? '—'}</span>
                  {wine.max_stock_level != null && <><span className="text-muted-foreground">Max Level</span><span>{wine.max_stock_level}</span></>}
                  {wine.reorder_point != null && <><span className="text-muted-foreground">Reorder At</span><span>{wine.reorder_point}</span></>}
                  {wine.bin_location && <><span className="text-muted-foreground">Location</span><span>{wine.bin_location}</span></>}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="wine-glass-effect rounded-xl p-5 space-y-3">
                <h3 className="font-heading font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-accent" /> Pricing</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  {wine.purchase_price != null && <><span className="text-muted-foreground">Purchase</span><span>{wine.currency || 'AED'} {wine.purchase_price}</span></>}
                  <span className="text-muted-foreground">Sale Price</span><span className="text-accent">{wine.currency || 'AED'} {wine.sale_price ?? '—'}</span>
                  {wine.glass_price != null && <><span className="text-muted-foreground">Glass Price</span><span>{wine.currency || 'AED'} {wine.glass_price}</span></>}
                  {wine.supplier_name && <><span className="text-muted-foreground">Supplier</span><span>{wine.supplier_name}</span></>}
                  <span className="text-muted-foreground">SKU</span><span className="font-mono text-xs">{wine.sku || '—'}</span>
                  {wine.primary_barcode && <><span className="text-muted-foreground">Barcode</span><span className="font-mono text-xs">{wine.primary_barcode}</span></>}
                </div>
              </div>
            )}
          </div>

          {wine.tasting_notes && (
            <div className="wine-glass-effect rounded-xl p-5">
              <h3 className="font-heading font-semibold mb-2">Tasting Notes</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{wine.tasting_notes}</p>
              {wine.food_pairing && (
                <p className="text-sm mt-3"><span className="text-muted-foreground">Pairs with:</span> {wine.food_pairing}</p>
              )}
            </div>
          )}
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <div className="wine-glass-effect rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold">Wine Images</h3>
              {isAdmin && (
                <>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadImage.isPending}>
                    {uploadImage.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                    Upload
                  </Button>
                </>
              )}
            </div>
            {images.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No images uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden border border-border">
                    <img src={img.image_url || ''} alt="" className="w-full h-40 object-cover" />
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-medium flex items-center gap-0.5">
                        <Star className="w-3 h-3" /> Primary
                      </span>
                    )}
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!img.is_primary && (
                          <Button size="sm" variant="secondary" onClick={() => setPrimary.mutate({ imageId: img.id, wineId: wine.id })}>
                            <Star className="w-3 h-3 mr-1" /> Primary
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteImage.mutate({ imageId: img.id, storageKey: img.storage_key, wineId: wine.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Variants Tab */}
        <TabsContent value="variants" className="space-y-4">
          <div className="wine-glass-effect rounded-xl p-5">
            <h3 className="font-heading font-semibold mb-4">Wine Variants</h3>
            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No variants created yet.</p>
            ) : (
              <div className="space-y-3">
                {variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div>
                      <p className="font-medium text-sm">{v.variant_name || `${wine.name} ${v.vintage || ''}`}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.volume_ml || 750}ml · {v.bottle_state || 'unopened'} · Stock: {v.current_stock}
                        {v.variant_sku && ` · SKU: ${v.variant_sku}`}
                      </p>
                    </div>
                    <div className="text-right">
                      {v.sale_price != null && <p className="text-sm text-accent font-medium">{wine.currency || 'AED'} {v.sale_price}</p>}
                      {v.purchase_price != null && <p className="text-xs text-muted-foreground">Cost: {wine.currency || 'AED'} {v.purchase_price}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="wine-glass-effect rounded-xl p-5">
            <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-accent" /> Movement History
            </h3>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No movement history found.</p>
            ) : (
              <div className="space-y-3">
                {movements.map(m => (
                  <div key={m.id} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-sm capitalize">{m.movement_type.replace('_', ' ')}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(m.performed_at).toLocaleDateString()} {new Date(m.performed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <span className="text-muted-foreground">Change: <span className={`font-semibold ${m.quantity_change > 0 ? 'text-green-500' : 'text-destructive'}`}>{m.quantity_change > 0 ? '+' : ''}{m.quantity_change}</span></span>
                        <span className="text-muted-foreground">After: <span className="font-semibold text-foreground">{m.quantity_after}</span></span>
                        {m.recording_method && <span className="text-muted-foreground">Method: <span className="capitalize">{m.recording_method}</span></span>}
                      </div>
                      {m.reason && <p className="text-xs text-muted-foreground mt-1.5 italic">"{m.reason}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Danger zone */}
      {isAdmin && (
        <div className="wine-glass-effect rounded-xl p-5 border-destructive/30">
          <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
          <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={handleArchive}>
            <Archive className="w-4 h-4 mr-1" /> Archive Wine
          </Button>
        </div>
      )}
    </div>
  );
}
