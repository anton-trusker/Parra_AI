import { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { getCountries, getRegionsForCountry, getSubRegionsForRegion, getAppellationsForRegion } from '@/data/referenceData';
import { ArrowLeft, Save, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Navigate, Link } from 'react-router-dom';

export default function WineForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { volumes, glassDimensions, locations } = useSettingsStore();
  const isEdit = !!id;
  const existing = isEdit ? mockWines.find(w => w.id === id) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(existing?.imageUrl || null);

  const [form, setForm] = useState({
    name: existing?.name || '',
    fullName: existing?.fullName || '',
    producer: existing?.producer || '',
    estate: existing?.estate || '',
    type: existing?.type || 'Red',
    vintage: existing?.vintage?.toString() || '',
    country: existing?.country || '',
    region: existing?.region || '',
    subRegion: existing?.subRegion || '',
    appellation: existing?.appellation || '',
    volume: existing?.volume?.toString() || '750',
    bottleSize: existing?.bottleSize || 'Standard',
    abv: existing?.abv?.toString() || '',
    closureType: existing?.closureType || '',
    sku: existing?.sku || '',
    barcode: existing?.barcode || '',
    barcodeType: existing?.barcodeType || 'EAN-13',
    grapeVarieties: existing?.grapeVarieties?.join(', ') || '',
    purchasePrice: existing?.purchasePrice?.toString() || '',
    salePrice: (existing?.salePrice || existing?.price)?.toString() || '',
    glassPrice: existing?.glassPrice?.toString() || '',
    availableByGlass: existing?.availableByGlass || false,
    stockUnopened: existing?.stockUnopened?.toString() || '0',
    stockOpened: existing?.stockOpened?.toString() || '0',
    minStockLevel: existing?.minStockLevel?.toString() || '6',
    maxStockLevel: existing?.maxStockLevel?.toString() || '',
    reorderPoint: existing?.reorderPoint?.toString() || '',
    reorderQuantity: existing?.reorderQuantity?.toString() || '',
    cellarSection: existing?.cellarSection || '',
    rackNumber: existing?.rackNumber || '',
    shelfPosition: existing?.shelfPosition || '',
    locationId: '',
    subLocationId: '',
    supplierName: existing?.supplierName || '',
    tastingNotes: existing?.tastingNotes || '',
    body: existing?.body || '',
    sweetness: existing?.sweetness || '',
    acidity: existing?.acidity || '',
    tannins: existing?.tannins || '',
    foodPairing: existing?.foodPairing || '',
    glassPourSizeMl: existing?.glassPourSizeMl?.toString() || '',
  });

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (isEdit && !existing) return <Navigate to="/catalog" replace />;

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
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVolumeSelect = (volId: string) => {
    const vol = volumes.find(v => v.id === volId);
    if (vol) {
      setForm(f => ({ ...f, volume: vol.ml.toString(), bottleSize: vol.bottleSize }));
    }
  };

  const handleSave = () => {
    if (!form.name || !form.producer) { toast.error('Name and Producer are required'); return; }
    toast.success(isEdit ? 'Wine updated successfully' : 'Wine added to catalog');
    navigate('/catalog');
  };

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

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">{isEdit ? `Edit ${existing?.name}` : 'Add New Wine'}</h1>

      {/* Image Upload */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Wine Image</h3>
        <div className="flex items-start gap-4">
          <div className="w-32 h-40 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-secondary/30 flex-shrink-0">
            {imagePreview ? (
              <img src={imagePreview} alt="Wine" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-xs">No Image</span>
              </div>
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
          <div className="space-y-1.5">
            <Label>Wine Name *</Label>
            <Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Full Name</Label>
            <Input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Full descriptive name" className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Producer *</Label>
            <Input value={form.producer} onChange={e => update('producer', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Estate</Label>
            <Input value={form.estate} onChange={e => update('estate', e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={v => update('type', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Red', 'White', 'Rosé', 'Sparkling', 'Fortified', 'Dessert'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Vintage</Label>
            <Input type="number" value={form.vintage} onChange={e => update('vintage', e.target.value)} placeholder="e.g. 2020" className="bg-secondary border-border" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Grape Varieties</Label>
            <Input value={form.grapeVarieties} onChange={e => update('grapeVarieties', e.target.value)} placeholder="Comma separated: Cabernet Sauvignon, Merlot" className="bg-secondary border-border" />
          </div>
        </div>
      </section>

      {/* Origin - with cascading dropdowns */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Origin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Select value={form.country} onValueChange={v => { update('country', v); update('region', ''); update('subRegion', ''); update('appellation', ''); }}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Region</Label>
            <Select value={form.region} onValueChange={v => { update('region', v); update('subRegion', ''); update('appellation', ''); }} disabled={!form.country}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={form.country ? 'Select region' : 'Select country first'} /></SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Sub-Region</Label>
            <Select value={form.subRegion} onValueChange={v => update('subRegion', v)} disabled={!form.region || subRegions.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={subRegions.length ? 'Select sub-region' : 'N/A'} /></SelectTrigger>
              <SelectContent>
                {subRegions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Appellation</Label>
            <Select value={form.appellation} onValueChange={v => update('appellation', v)} disabled={!form.region || appellations.length === 0}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={appellations.length ? 'Select appellation' : 'N/A'} /></SelectTrigger>
              <SelectContent>
                {appellations.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Product Details - Volume from settings */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Product Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Volume</Label>
            <Select onValueChange={handleVolumeSelect} value={volumes.find(v => v.ml === parseInt(form.volume))?.id || ''}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select volume" /></SelectTrigger>
              <SelectContent>
                {volumes.map(v => <SelectItem key={v.id} value={v.id}>{v.label} ({v.bottleSize})</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{form.volume}ml = {volumeLitres}L</p>
          </div>
          <div className="space-y-1.5"><Label>ABV (%)</Label><Input type="number" step="0.1" value={form.abv} onChange={e => update('abv', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Closure</Label>
            <Select value={form.closureType} onValueChange={v => update('closureType', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {['cork', 'screw_cap', 'glass', 'synthetic'].map(c => <SelectItem key={c} value={c} className="capitalize">{c.replace('_', ' ')}</SelectItem>)}
              </SelectContent>
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
          <div className="space-y-1.5"><Label>Purchase Price ($)</Label><Input type="number" step="0.01" value={form.purchasePrice} onChange={e => update('purchasePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Sale Price ($)</Label><Input type="number" step="0.01" value={form.salePrice} onChange={e => update('salePrice', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Glass Price ($)</Label><Input type="number" step="0.01" value={form.glassPrice} onChange={e => update('glassPrice', e.target.value)} className="bg-secondary border-border" /></div>
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
                    <SelectItem key={g.id} value={(g.volumeLitres * 1000).toString()}>
                      {g.label} ({(g.volumeLitres * 1000).toFixed(0)}ml)
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
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={form.locationId} onValueChange={v => { update('locationId', v); update('subLocationId', ''); }}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select location" /></SelectTrigger>
              <SelectContent>
                {locations.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.name} <span className="text-muted-foreground capitalize">({l.type})</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(() => {
            const selectedLoc = locations.find(l => l.id === form.locationId);
            if (!selectedLoc || selectedLoc.subLocations.length === 0) return null;
            return (
              <div className="space-y-1.5">
                <Label>Sub-Location</Label>
                <Select value={form.subLocationId} onValueChange={v => update('subLocationId', v)}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select sub-location" /></SelectTrigger>
                  <SelectContent>
                    {selectedLoc.subLocations.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })()}
        </div>
        <div className="space-y-1.5"><Label>Supplier</Label><Input value={form.supplierName} onChange={e => update('supplierName', e.target.value)} className="bg-secondary border-border" /></div>
      </section>

      {/* Tasting */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Tasting & Character</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['body', 'sweetness', 'acidity', 'tannins'].map(field => (
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
        <Button onClick={handleSave} className="wine-gradient text-primary-foreground hover:opacity-90">
          <Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update Wine' : 'Add Wine'}
        </Button>
      </div>

      {/* Danger zone for edit */}
      {isEdit && (
        <section className="wine-glass-effect rounded-xl p-5 border-destructive/30">
          <h3 className="font-heading font-semibold mb-2 text-destructive">Danger Zone</h3>
          <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => { toast.info('Archive feature coming soon'); }}>
            <Trash2 className="w-4 h-4 mr-1" /> Archive Wine
          </Button>
        </section>
      )}
    </div>
  );
}
