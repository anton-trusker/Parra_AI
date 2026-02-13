import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GlassWater, MapPin, Wine, Ruler, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';

export default function GeneralSettings() {
  const { user } = useAuthStore();
  const {
    glassDimensions, addGlassDimension, removeGlassDimension,
    locations, addLocation, removeLocation, addSubLocation, removeSubLocation,
    volumes, addVolume, removeVolume,
    openedBottleUnit, setOpenedBottleUnit,
  } = useSettingsStore();

  const [newGlassLabel, setNewGlassLabel] = useState('');
  const [newGlassVolume, setNewGlassVolume] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState('cellar');
  const [newVolMl, setNewVolMl] = useState('');
  const [newVolSize, setNewVolSize] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [newSubLocNames, setNewSubLocNames] = useState<Record<string, string>>({});

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const toggleExpanded = (id: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddGlass = () => {
    const vol = parseFloat(newGlassVolume);
    if (!newGlassLabel || isNaN(vol) || vol <= 0) { toast.error('Enter a valid label and volume'); return; }
    addGlassDimension({ id: `g${Date.now()}`, label: newGlassLabel, volumeLitres: vol });
    setNewGlassLabel(''); setNewGlassVolume('');
    toast.success('Glass dimension added');
  };

  const handleAddLocation = () => {
    if (!newLocName) { toast.error('Enter a location name'); return; }
    addLocation({ id: `loc${Date.now()}`, name: newLocName, type: newLocType || 'other', subLocations: [] });
    setNewLocName('');
    toast.success('Location added');
  };

  const handleAddSubLocation = (locId: string) => {
    const name = newSubLocNames[locId]?.trim();
    if (!name) { toast.error('Enter a sub-location name'); return; }
    addSubLocation(locId, { id: `sub${Date.now()}`, name });
    setNewSubLocNames((prev) => ({ ...prev, [locId]: '' }));
    toast.success('Sub-location added');
  };

  const handleAddVolume = () => {
    const ml = parseInt(newVolMl);
    if (isNaN(ml) || ml <= 0 || !newVolSize) { toast.error('Enter valid volume and size name'); return; }
    addVolume({ id: `v${Date.now()}`, ml, label: `${(ml / 1000).toFixed(3)}L`, bottleSize: newVolSize });
    setNewVolMl(''); setNewVolSize('');
    toast.success('Volume option added');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">General Settings</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">General Settings</h1>

      {/* Opened bottle unit */}
      <CollapsibleSection icon={Ruler} title="Opened Bottle Measurement" defaultOpen>
        <p className="text-sm text-muted-foreground mb-3">How opened bottles are measured during inventory counts</p>
        <Select value={openedBottleUnit} onValueChange={(v) => { setOpenedBottleUnit(v as any); toast.success('Measurement unit saved'); }}>
          <SelectTrigger className="bg-secondary border-border w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fraction">Fraction of bottle (e.g. 0.3)</SelectItem>
            <SelectItem value="litres">Litres (e.g. 0.25L)</SelectItem>
          </SelectContent>
        </Select>
      </CollapsibleSection>

      {/* Glass Dimensions */}
      <CollapsibleSection icon={GlassWater} title="Glass Dimensions" badge={`${glassDimensions.length} sizes`}>
        <p className="text-sm text-muted-foreground mb-3">Define standard glass pour sizes for by-the-glass service</p>
        <div className="space-y-2 mb-4">
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
      </CollapsibleSection>

      {/* Locations with sub-locations */}
      <CollapsibleSection icon={MapPin} title="Locations" badge={`${locations.length} locations`}>
        <p className="text-sm text-muted-foreground mb-3">Storage locations and sub-locations for wine inventory</p>
        <div className="space-y-2 mb-4">
          {locations.map(l => {
            const isExpanded = expandedLocations.has(l.id);
            return (
              <div key={l.id} className="rounded-lg bg-secondary/50 overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <button
                    onClick={() => toggleExpanded(l.id)}
                    className="flex items-center gap-2 text-left flex-1"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{l.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">({l.type})</span>
                    {l.subLocations.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {l.subLocations.length} sub
                      </span>
                    )}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => { removeLocation(l.id); toast.success('Removed'); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pl-9 space-y-2">
                    {l.subLocations.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                        <span className="text-sm">{sub.name}</span>
                        <Button variant="ghost" size="sm" onClick={() => { removeSubLocation(l.id, sub.id); toast.success('Removed'); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 items-center">
                      <Input
                        value={newSubLocNames[l.id] || ''}
                        onChange={(e) => setNewSubLocNames((prev) => ({ ...prev, [l.id]: e.target.value }))}
                        placeholder="e.g. Shelf 1"
                        className="bg-background border-border w-36 h-8 text-sm"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubLocation(l.id); }}
                      />
                      <Button size="sm" variant="outline" className="h-8 border-border" onClick={() => handleAddSubLocation(l.id)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Name</Label>
            <Input value={newLocName} onChange={e => setNewLocName(e.target.value)} placeholder="Cellar C" className="bg-secondary border-border w-36" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Input value={newLocType} onChange={e => setNewLocType(e.target.value)} placeholder="e.g. store, warehouse" className="bg-secondary border-border w-32" />
          </div>
          <Button size="sm" onClick={handleAddLocation} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </CollapsibleSection>

      {/* Bottle Volumes */}
      <CollapsibleSection icon={Wine} title="Bottle Volumes" badge={`${volumes.length} sizes`}>
        <p className="text-sm text-muted-foreground mb-3">Available bottle sizes/volumes. Used in wine forms and litre calculations.</p>
        <div className="space-y-2 mb-4">
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
      </CollapsibleSection>
    </div>
  );
}
