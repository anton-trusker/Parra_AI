import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
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
  const isEdit = !!id;
  const existing = isEdit ? mockWines.find(w => w.id === id) : null;

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  if (isEdit && !existing) return <Navigate to="/catalog" replace />;

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
    // Pricing
    purchasePrice: existing?.purchasePrice?.toString() || '',
    salePrice: (existing?.salePrice || existing?.price)?.toString() || '',
    glassPrice: existing?.glassPrice?.toString() || '',
    availableByGlass: existing?.availableByGlass || false,
    // Stock
    stockUnopened: existing?.stockUnopened?.toString() || '0',
    stockOpened: existing?.stockOpened?.toString() || '0',
    minStockLevel: existing?.minStockLevel?.toString() || '6',
    maxStockLevel: existing?.maxStockLevel?.toString() || '',
    reorderPoint: existing?.reorderPoint?.toString() || '',
    reorderQuantity: existing?.reorderQuantity?.toString() || '',
    // Location
    cellarSection: existing?.cellarSection || '',
    rackNumber: existing?.rackNumber || '',
    shelfPosition: existing?.shelfPosition || '',
    // Supplier
    supplierName: existing?.supplierName || '',
    // Tasting
    tastingNotes: existing?.tastingNotes || '',
    body: existing?.body || '',
    sweetness: existing?.sweetness || '',
    acidity: existing?.acidity || '',
    tannins: existing?.tannins || '',
    foodPairing: existing?.foodPairing || '',
  });

  const update = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.name || !form.producer) {
      toast.error('Name and Producer are required');
      return;
    }
    toast.success(isEdit ? 'Wine updated successfully' : 'Wine added to catalog');
    navigate('/catalog');
  };

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

      {/* Origin */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Origin</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label>Country</Label><Input value={form.country} onChange={e => update('country', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Region</Label><Input value={form.region} onChange={e => update('region', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Sub-Region</Label><Input value={form.subRegion} onChange={e => update('subRegion', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Appellation</Label><Input value={form.appellation} onChange={e => update('appellation', e.target.value)} placeholder="AOC, DOC, AVA..." className="bg-secondary border-border" /></div>
        </div>
      </section>

      {/* Product Details */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Product Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Volume (ml)</Label><Input type="number" value={form.volume} onChange={e => update('volume', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Bottle Size</Label>
            <Select value={form.bottleSize} onValueChange={v => update('bottleSize', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Half', 'Standard', 'Magnum', 'Jeroboam', 'Other'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
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
        </div>
      </section>

      {/* Stock & Location */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg">Inventory Settings</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Unopened Stock</Label><Input type="number" value={form.stockUnopened} onChange={e => update('stockUnopened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Opened Stock</Label><Input type="number" value={form.stockOpened} onChange={e => update('stockOpened', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Min Stock Level</Label><Input type="number" value={form.minStockLevel} onChange={e => update('minStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Max Stock Level</Label><Input type="number" value={form.maxStockLevel} onChange={e => update('maxStockLevel', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Point</Label><Input type="number" value={form.reorderPoint} onChange={e => update('reorderPoint', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Reorder Qty</Label><Input type="number" value={form.reorderQuantity} onChange={e => update('reorderQuantity', e.target.value)} className="bg-secondary border-border" /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
