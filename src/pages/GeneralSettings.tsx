import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GlassWater, MapPin, Wine, Ruler, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useGlassDimensions, useAddGlassDimension, useRemoveGlassDimension } from '@/hooks/useGlassDimensions';
import { useLocations, useAddLocation, useRemoveLocation, useAddSubLocation, useRemoveSubLocation } from '@/hooks/useLocations';
import { useVolumes, useAddVolume, useRemoveVolume } from '@/hooks/useVolumes';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

export default function GeneralSettings() {
  const { user } = useAuthStore();

  const { data: glassDimensions = [], isLoading: loadingGlass } = useGlassDimensions();
  const addGlass = useAddGlassDimension();
  const removeGlass = useRemoveGlassDimension();

  const { data: locations = [], isLoading: loadingLocs } = useLocations();
  const addLoc = useAddLocation();
  const removeLoc = useRemoveLocation();
  const addSubLoc = useAddSubLocation();
  const removeSubLoc = useRemoveSubLocation();

  const { data: volumes = [], isLoading: loadingVols } = useVolumes();
  const addVol = useAddVolume();
  const removeVol = useRemoveVolume();

  const { data: openedBottleUnit = 'fraction', isLoading: loadingUnit } = useAppSetting<string>('opened_bottle_unit', 'fraction');
  const updateSetting = useUpdateAppSetting();

  const [newGlassLabel, setNewGlassLabel] = useState('');
  const [newGlassVolume, setNewGlassVolume] = useState('');
  const [newLocName, setNewLocName] = useState('');
  const [newLocType, setNewLocType] = useState('');
  const [newVolMl, setNewVolMl] = useState('');
  const [newVolSize, setNewVolSize] = useState('');
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());
  const [newSubLocNames, setNewSubLocNames] = useState<Record<string, string>>({});

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  const isLoading = loadingGlass || loadingLocs || loadingVols || loadingUnit;

  const toggleExpanded = (id: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddGlass = async () => {
    const vol = parseFloat(newGlassVolume);
    if (!newGlassLabel || isNaN(vol) || vol <= 0) { toast.error('Enter a valid label and volume'); return; }
    try {
      await addGlass.mutateAsync({ label: newGlassLabel, volume_litres: vol });
      setNewGlassLabel(''); setNewGlassVolume('');
      toast.success('Glass dimension added');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddLocation = async () => {
    if (!newLocName) { toast.error('Enter a location name'); return; }
    try {
      await addLoc.mutateAsync({ name: newLocName, type: newLocType || 'other' });
      setNewLocName(''); setNewLocType('');
      toast.success('Location added');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddSubLocation = async (locId: string) => {
    const name = newSubLocNames[locId]?.trim();
    if (!name) { toast.error('Enter a sub-location name'); return; }
    try {
      await addSubLoc.mutateAsync({ location_id: locId, name });
      setNewSubLocNames((prev) => ({ ...prev, [locId]: '' }));
      toast.success('Sub-location added');
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAddVolume = async () => {
    const ml = parseInt(newVolMl);
    if (isNaN(ml) || ml <= 0 || !newVolSize) { toast.error('Enter valid volume and size name'); return; }
    try {
      await addVol.mutateAsync({ ml, label: `${(ml / 1000).toFixed(3)}L`, bottle_size: newVolSize });
      setNewVolMl(''); setNewVolSize('');
      toast.success('Volume option added');
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

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
        <Select
          value={openedBottleUnit}
          onValueChange={(v) => {
            updateSetting.mutate({ key: 'opened_bottle_unit', value: v }, {
              onSuccess: () => toast.success('Measurement unit saved'),
              onError: (e: any) => toast.error(e.message),
            });
          }}
        >
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
                <span className="text-sm text-muted-foreground ml-2">({g.volume_litres}L)</span>
              </div>
              <Button variant="ghost" size="sm" disabled={removeGlass.isPending} onClick={() => removeGlass.mutate(g.id, { onSuccess: () => toast.success('Removed') })}>
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
          <Button size="sm" onClick={handleAddGlass} disabled={addGlass.isPending} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
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
                  <button onClick={() => toggleExpanded(l.id)} className="flex items-center gap-2 text-left flex-1">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <span className="font-medium">{l.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">({l.type || 'other'})</span>
                    {l.sub_locations.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                        {l.sub_locations.length} sub
                      </span>
                    )}
                  </button>
                  <Button variant="ghost" size="sm" disabled={removeLoc.isPending} onClick={() => removeLoc.mutate(l.id, { onSuccess: () => toast.success('Removed') })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                {isExpanded && (
                  <div className="px-3 pb-3 pl-9 space-y-2">
                    {l.sub_locations.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-2 rounded-md bg-background/50">
                        <span className="text-sm">{sub.name}</span>
                        <Button variant="ghost" size="sm" disabled={removeSubLoc.isPending} onClick={() => removeSubLoc.mutate(sub.id, { onSuccess: () => toast.success('Removed') })}>
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
                      <Button size="sm" variant="outline" className="h-8 border-border" disabled={addSubLoc.isPending} onClick={() => handleAddSubLocation(l.id)}>
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
          <Button size="sm" onClick={handleAddLocation} disabled={addLoc.isPending} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
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
                <span className="text-sm text-muted-foreground ml-2">({v.ml}ml · {v.bottle_size || '—'})</span>
              </div>
              <Button variant="ghost" size="sm" disabled={removeVol.isPending} onClick={() => removeVol.mutate(v.id, { onSuccess: () => toast.success('Removed') })}>
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
          <Button size="sm" onClick={handleAddVolume} disabled={addVol.isPending} className="wine-gradient text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
