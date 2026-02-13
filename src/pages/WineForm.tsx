import { useState, useRef } from 'react';
import { useNavigate, useParams, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useWine, useCreateWine, useUpdateWine } from '@/hooks/useWines';
import { useUploadWineImage } from '@/hooks/useWineImages';
import { getCountries, getRegionsForCountry, getSubRegionsForRegion, getAppellationsForRegion } from '@/data/referenceData';
import { useVolumes } from '@/hooks/useVolumes';
import { useGlassDimensions } from '@/hooks/useGlassDimensions';
import { useLocations } from '@/hooks/useLocations';
import { ArrowLeft, Save, Trash2, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type WineTypeEnum = Database['public']['Enums']['wine_type_enum'];

export default function WineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEdit = !!id;
  const { data: existing, isLoading } = useWine(id);
  const createWine = useCreateWine();
  const updateWine = useUpdateWine();
  const uploadImage = useUploadWineImage();
  const { data: volumes = [] } = useVolumes();
  const { data: glassDimensions = [] } = useGlassDimensions();
  const { data: locations = [] } = useLocations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);

  const [form, setForm] = useState({
    name: '', fullName: '', producer: '', estate: '',
    type: 'red' as WineTypeEnum, vintage: '', country: '', region: '', subRegion: '', appellation: '',
    volume: '750', bottleSize: 'standard', abv: '', closureType: '', sku: '', barcode: '', barcodeType: 'EAN-13',
    grapeVarieties: '',
    purchasePrice: '', salePrice: '', glassPrice: '', availableByGlass: false,
    stockUnopened: '0', stockOpened: '0', minStockLevel: '0', maxStockLevel: '', reorderPoint: '', reorderQuantity: '',
    cellarSection: '', rackNumber: '', shelfPosition: '', binLocation: '',
    supplierName: '', tastingNotes: '', body: '', sweetness: '', acidity: '', tannins: '',
    foodPairing: '', glassPourSizeMl: '',
  });

  // Populate form when existing data loads
  if (isEdit && existing && !formInitialized) {
    setForm({
      name: existing.name || '', fullName: existing.full_name || '', producer: existing.producer || '', estate: existing.estate || '',
      type: (existing.wine_type || 'red') as WineTypeEnum,
      vintage: existing.vintage?.toString() || '', country: existing.country || '', region: existing.region || '',
      subRegion: existing.sub_region || '', appellation: existing.appellation || '',
      volume: (existing.volume_ml || 750).toString(), bottleSize: existing.bottle_size || 'standard',
      abv: existing.alcohol_content?.toString() || '', closureType: existing.closure_type || '',
      sku: existing.sku || '', barcode: existing.primary_barcode || '', barcodeType: existing.barcode_type || 'EAN-13',
      grapeVarieties: Array.isArray(existing.grape_varieties) ? (existing.grape_varieties as string[]).join(', ') : '',
      purchasePrice: existing.purchase_price?.toString() || '', salePrice: existing.sale_price?.toString() || '',
      glassPrice: existing.glass_price?.toString() || '', availableByGlass: existing.available_by_glass,
      stockUnopened: existing.current_stock_unopened.toString(), stockOpened: existing.current_stock_opened.toString(),
      minStockLevel: (existing.min_stock_level ?? 0).toString(), maxStockLevel: existing.max_stock_level?.toString() || '',
      reorderPoint: existing.reorder_point?.toString() || '', reorderQuantity: existing.reorder_quantity?.toString() || '',
      cellarSection: existing.cellar_section || '', rackNumber: existing.rack_number || '',
      shelfPosition: existing.shelf_position || '', binLocation: existing.bin_location || '',
      supplierName: existing.supplier_name || '', tastingNotes: existing.tasting_notes || '',
      body: existing.body || '', sweetness: existing.sweetness || '', acidity: existing.acidity || '', tannins: existing.tannins || '',
      foodPairing: existing.food_pairing || '', glassPourSizeMl: existing.glass_pour_size_ml?.toString() || '',
    });
    setFormInitialized(true);
  }

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;
  if (isEdit && !isLoading && !existing) return <Navigate to="/catalog" replace />;
  if (isEdit && isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));
  const countries = getCountries();
  const regions = form.country ? getRegionsForCountry(form.country) : [];
  const subRegions = form.country && form.region ? getSubRegionsForRegion(form.country, form.region) : [];
  const appellations = form.country && form.region ? getAppellationsForRegion(form.country, form.region) : [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => { setImagePreview(null); setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const handleVolumeSelect = (volId: string) => {
    const vol = volumes.find(v => v.id === volId);
    if (vol) setForm(f => ({ ...f, volume: vol.ml.toString(), bottleSize: vol.bottle_size || '' }));
  };

  const handleSave = async () => {
    if (!form.name || !form.producer) { toast.error('Name and Producer are required'); return; }

    const grapes = form.grapeVarieties ? form.grapeVarieties.split(',').map(g => g.trim()).filter(Boolean) : [];
    const payload = {
      name: form.name, full_name: form.fullName || null, producer: form.producer, estate: form.estate || null,
      wine_type: form.type as WineTypeEnum, vintage: form.vintage ? parseInt(form.vintage) : null,
      country: form.country || null, region: form.region || null, sub_region: form.subRegion || null,
      appellation: form.appellation || null, volume_ml: parseInt(form.volume) || 750,
      bottle_size: form.bottleSize || null, alcohol_content: form.abv ? parseFloat(form.abv) : null,
      closure_type: form.closureType || null, sku: form.sku || null, primary_barcode: form.barcode || null,
      barcode_type: form.barcodeType || null, grape_varieties: grapes,
      purchase_price: form.purchasePrice ? parseFloat(form.purchasePrice) : null,
      sale_price: form.salePrice ? parseFloat(form.salePrice) : null,
      glass_price: form.glassPrice ? parseFloat(form.glassPrice) : null,
      available_by_glass: form.availableByGlass,
      current_stock_unopened: parseInt(form.stockUnopened) || 0,
      current_stock_opened: parseInt(form.stockOpened) || 0,
      min_stock_level: parseInt(form.minStockLevel) || 0,
      max_stock_level: form.maxStockLevel ? parseInt(form.maxStockLevel) : null,
      reorder_point: form.reorderPoint ? parseInt(form.reorderPoint) : null,
      reorder_quantity: form.reorderQuantity ? parseInt(form.reorderQuantity) : null,
      cellar_section: form.cellarSection || null, rack_number: form.rackNumber || null,
      shelf_position: form.shelfPosition || null, bin_location: form.binLocation || null,
      supplier_name: form.supplierName || null, tasting_notes: form.tastingNotes || null,
      body: form.body || null, sweetness: form.sweetness || null, acidity: form.acidity || null,
      tannins: form.tannins || null, food_pairing: form.foodPairing || null,
      glass_pour_size_ml: form.glassPourSizeMl ? parseInt(form.glassPourSizeMl) : null,
    };

    try {
      let wineId: string;
      if (isEdit && id) {
        await updateWine.mutateAsync({ id, updates: payload });
        wineId = id;
        toast.success('Wine updated successfully');
      } else {
        const created = await createWine.mutateAsync(payload);
        wineId = created.id;
        toast.success('Wine added to catalog');
      }
      // Upload image if selected
      if (imageFile) {
        await uploadImage.mutateAsync({ wineId, file: imageFile, isPrimary: true });
      }
      navigate(`/catalog/${wineId}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save wine');
    }
  };

  const isSaving = createWine.isPending || updateWine.isPending;
  const volumeLitres = form.volume ? (parseInt(form.volume) / 1000).toFixed(3) : '0';

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/catalog" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Catalog
        </Link>
        <span>/</span>
        <span className="text-foreground">{isEdit ? 'Edit Wine' : 'Add Wine'}</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">{isEdit ? `Edit ${existing?.name || ''}` : 'Add New Wine'}</h1>

      {/* Image Upload */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Wine Image</h3>
        <div className="flex items-start gap-4">
          <div className="w-32 h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/30 flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Wine" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground"><ImageIcon className="w-8 h-8 mb-1" /><span className="text-xs">No Image</span></div>
            )}
          </div>
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <Button variant="outline" size="sm" className="border-border" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> {imagePreview ? 'Change Image' : 'Upload Image'}
            </Button>
            {imagePreview && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRemoveImage}>
                <X className="w-4 h-4 mr-1" /> Remove
              </Button>
            )}
            <p className="text-xs text-muted-foreground">JPG, PNG or WebP, max 5MB</p>
          </div>
        </div>
      </section>

      {/* Basic Info */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Wine Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Full descriptive name" className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Producer *</Label><Input value={form.producer} onChange={e => update('producer', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Estate</Label><Input value={form.estate} onChange={e => update('estate', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[['red','Red'],['white','White'],['rose','Rosé'],['sparkling','Sparkling'],['fortified','Fortified'],['dessert','Dessert']].map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Year</Label><Input type="number" value={form.vintage} onChange={e => update('vintage', e.target.value)} placeholder="e.g. 2020" className="bg-secondary border-border" /></div>
          <div className="sm:col-span-2 space-y-1.5"><Label>Grape Varieties</Label><Input value={form.grapeVarieties} onChange={e => update('grapeVarieties', e.target.value)} placeholder="Comma separated: Cabernet Sauvignon, Merlot" className="bg-secondary border-border" /></div>
        </div>
      </section>

      {/* Origin */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Origin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={v => { update('country', v); update('region', ''); update('subRegion', ''); update('appellation', ''); }}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>{countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Select value={form.region} onValueChange={v => { update('region', v); update('subRegion', ''); update('appellation', ''); }} disabled={!form.country}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={form.country ? 'Select region' : 'Select country first'} /></SelectTrigger>
              <SelectContent>{regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-Region</Label>
            <Select value={form.subRegion} onValueChange={v => update('subRegion', v)} disabled={!form.region || subRegions.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={subRegions.length ? 'Select sub-region' : 'N/A'} /></SelectTrigger>
              <SelectContent>{subRegions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Appellation</Label>
            <Select value={form.appellation} onValueChange={v => update('appellation', v)} disabled={!form.region || appellations.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={appellations.length ? 'Select appellation' : 'N/A'} /></SelectTrigger>
              <SelectContent>{appellations.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Product Details */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Product Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Volume</Label>
            <Select onValueChange={handleVolumeSelect} value={volumes.find(v => v.ml === parseInt(form.volume))?.id || ''}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select volume" /></SelectTrigger>
              <SelectContent>{volumes.map(v => <SelectItem key={v.id} value={v.id}>{v.label} ({v.bottle_size || '—'})</SelectItem>)}</SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{form.volume}ml = {volumeLitres}L</p>
          </div>
          <div className="space-y-1.5"><Label>ABV (%)</Label><Input type="number" step="0.1" value={form.abv} onChange={e => update('abv', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Closure</Label>
            <Select value={form.closureType} onValueChange={v => update('closureType', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{['cork', 'screw_cap', 'glass', 'synthetic'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>SKU</Label><Input value={form.sku} onChange={e => update('sku', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Barcode</Label><Input value={form.barcode} onChange={e => update('barcode', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
      </section>

      {/* Pricing */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Pricing</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Purchase Price</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Sale Price</Label><Input type="number" step="0.01" value={form.salePrice} onChange={e => update('salePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Glass Price</Label><Input type="number" step="0.01" value={form.glassPrice} onChange={e => update('glassPrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="flex items-center gap-2 sm:col-span-3">
            <Switch checked={form.availableByGlass} onCheckedChange={v => update('availableByGlass', v)} />
            <Label>Available by Glass</Label>
          </div>
          {form.availableByGlass && (
            <div className="space-y-1.5 sm:col-span-3">
              <Label>Glass Pour Size</Label>
              <Select value={form.glassPourSizeMl} onValueChange={v => update('glassPourSizeMl', v)}>
                <SelectTrigger className="bg-secondary border-border w-64"><SelectValue placeholder="Select glass size" /></SelectTrigger>
                <SelectContent>
                  {glassDimensions.map(g => (
                    <SelectItem key={g.id} value={(g.volume_litres * 1000).toString()}>
                      {g.label} ({(g.volume_litres * 1000).toFixed(0)}ml)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </section>

      {/* Stock & Location */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Inventory Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Unopened Stock</Label><Input type="number" value={form.stockUnopened} onChange={e => update('stockUnopened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Opened Stock</Label><Input type="number" step="0.001" value={form.stockOpened} onChange={e => update('stockOpened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Min Stock Level</Label><Input type="number" value={form.minStockLevel} onChange={e => update('minStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Max Stock Level</Label><Input type="number" value={form.maxStockLevel} onChange={e => update('maxStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Point</Label><Input type="number" value={form.reorderPoint} onChange={e => update('reorderPoint', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Qty</Label><Input type="number" value={form.reorderQuantity} onChange={e => update('reorderQuantity', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Bin Location</Label><Input value={form.binLocation} onChange={e => update('binLocation', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Cellar Section</Label><Input value={form.cellarSection} onChange={e => update('cellarSection', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Rack Number</Label><Input value={form.rackNumber} onChange={e => update('rackNumber', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Shelf Position</Label><Input value={form.shelfPosition} onChange={e => update('shelfPosition', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="space-y-1.5"><Label>Supplier</Label><Input value={form.supplierName} onChange={e => update('supplierName', e.target.value)} className="bg-secondary border-border" /></div>
      </section>

      {/* Tasting */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Tasting & Character</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['body', 'sweetness', 'acidity', 'tannins'] as const).map(field => (
            <div key={field} className="space-y-1.5">
              <Label className="capitalize">{field}</Label>
              <Select value={(form as any)[field]} onValueChange={v => update(field, v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(field === 'body' ? ['light', 'medium', 'full'] :
                    field === 'tannins' ? ['soft', 'medium', 'firm', 'grippy'] :
                    ['dry', 'off-dry', 'medium', 'sweet']).map(o => (
                    <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
        <div className="space-y-1.5"><Label>Tasting Notes</Label><Textarea value={form.tastingNotes} onChange={e => update('tastingNotes', e.target.value)} className="bg-secondary border-border" rows={3} /></div>
        <div className="space-y-1.5"><Label>Food Pairing</Label><Input value={form.foodPairing} onChange={e => update('foodPairing', e.target.value)} placeholder="Beef, Lamb, Hard Cheese..." className="bg-secondary border-border" /></div>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)} className="border-border">Cancel</Button>
        <Button onClick={handleSave} disabled={isSaving} className="wine-gradient text-primary-foreground hover:opacity-90">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isEdit ? 'Update Wine' : 'Add Wine'}
        </Button>
      </div>

      {isEdit && (
        <section className="wine-glass-effect rounded-xl p-5 border-destructive/30">
          <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
          <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => toast.info('Use the detail page to archive')}>
            <Trash2 className="w-4 h-4 mr-1" /> Archive Wine
          </Button>
        </section>
      )}
    </div>
  );
}
