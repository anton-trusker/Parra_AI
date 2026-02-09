import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Navigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GlassWater, MapPin, Wine, Ruler } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function GeneralSettings() {
  const { user } = useAuthStore();
  const {
    glassDimensions, addGlassDimension, removeGlassDimension,
    locations, addLocation, removeLocation,
    volumes, addVolume, removeVolume,
    openedBottleUnit, setOpenedBottleUnit,
  } = useSettingsStore();

  // Glass dimension form
  const [newGlassLabel, setNewGlassLabel] = useState('');
  const [newGlassVolume, setNewGlassVolume] = useState('');

  // Location form
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState<'cellar' | 'bar' | 'storage'>('cellar');

  // Volume form
  const [newVolMl, setNewVolMl] = useState('');
  const [newVolSize, setNewVolSize] = useState('');

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleAddGlass = () => {
    const vol = parseFloat(newGlassVolume);
    if (!newGlassLabel || isNaN(vol) || vol <= 0) { toast.error('Enter a valid label and volume'); return; }
    addGlassDimension({ id: `g${Date.now()}`, label: newGlassLabel, volumeLitres: vol });
    setNewGlassLabel(''); setNewGlassVolume('');
    toast.success('Glass dimension added');
  };

  const handleAddLocation = () => {
    if (!newLocName) { toast.error('Enter a location name'); return; }
    addLocation({ id: `loc${Date.now()}`, name: newLocName, type: newLocType });
    setNewLocName('');
    toast.success('Location added');
  };

  const handleAddVolume = () => {
    const ml = parseInt(newVolMl);
    if (isNaN(ml) || ml <= 0 || !newVolSize) { toast.error('Enter valid volume and size name'); return; }
    addVolume({ id: `v${Date.now()}`, ml, label: `${(ml / 1000).toFixed(3)}L`, bottleSize: newVolSize });
    setNewVolMl(''); setNewVolSize('');
    toast.success('Volume option added');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">General Settings</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">General Settings</h1>

      {/* Opened bottle unit */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><Ruler className="w-5 h-5 text-primary" /> Opened Bottle Measurement</h3>
        <p className="text-sm text-muted-foreground">How opened bottles are measured during inventory counts</p>
        <Select value={openedBottleUnit} onValueChange={(v) => setOpenedBottleUnit(v as any)}>
          <SelectTrigger className="bg-secondary border-border w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fraction">Fraction of bottle (e.g. 0.3)</SelectItem>
            <SelectItem value="litres">Litres (e.g. 0.25L)</SelectItem>
          </SelectContent>
        </Select>
      </section>

      {/* Glass Dimensions */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><GlassWater className="w-5 h-5 text-primary" /> Glass Dimensions</h3>
        <p className="text-sm text-muted-foreground">Define standard glass pour sizes for by-the-glass service</p>
        <div className="space-y-2">
          {glassDimensions.map(g => (
            <div key={g.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <span className="font-medium">{g.label}</span>
                <span className="text-sm text-muted-foreground ml-2">({g.volumeLitres}L)</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { removeGlassDimension(g.id); toast.success('Removed'); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input value={newGlassLabel} onChange={e => setNewGlassLabel(e.target.value)} placeholder="e.g. 0.125L" className="bg-secondary border-border w-28" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Volume (L)</Label>
            <Input type="number" step="0.001" value={newGlassVolume} onChange={e => setNewGlassVolume(e.target.value)} placeholder="0.125" className="bg-secondary border-border w-24" />
          </div>
          <Button size="sm" onClick={handleAddGlass} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </section>

      {/* Locations */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Locations</h3>
        <p className="text-sm text-muted-foreground">Storage locations for wine inventory</p>
        <div className="space-y-2">
          {locations.map(l => (
            <div key={l.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <span className="font-medium">{l.name}</span>
                <span className="text-xs text-muted-foreground ml-2 capitalize">({l.type})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { removeLocation(l.id); toast.success('Removed'); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Cellar C" className="bg-secondary border-border w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={newLocType} onValueChange={v => setNewLocType(v as any)}>
              <SelectTrigger className="bg-secondary border-border w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cellar">Cellar</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" onClick={handleAddLocation} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </section>

      {/* Bottle Volumes */}
      <section className="wine-glass-effect rounded-xl p-5 space-y-4">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2"><Wine className="w-5 h-5 text-primary" /> Bottle Volumes</h3>
        <p className="text-sm text-muted-foreground">Available bottle sizes/volumes. Used in wine forms and litre calculations.</p>
        <div className="space-y-2">
          {volumes.map(v => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div>
                <span className="font-medium">{v.label}</span>
                <span className="text-sm text-muted-foreground ml-2">({v.ml}ml · {v.bottleSize})</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { removeVolume(v.id); toast.success('Removed'); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Volume (ml)</Label>
            <Input type="number" value={newVolMl} onChange={e => setNewVolMl(e.target.value)} placeholder="750" className="bg-secondary border-border w-24" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Size Name</Label>
            <Input value={newVolSize} onChange={e => setNewVolSize(e.target.value)} placeholder="Standard" className="bg-secondary border-border w-28" />
          </div>
          <Button size="sm" onClick={handleAddVolume} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </section>
    </div>
  );
}
