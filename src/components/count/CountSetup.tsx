import { useState } from 'react';
import { Play, Loader2, Users, AlertCircle, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useStores } from '@/hooks/useStores';

interface CountSetupProps {
  countType: string;
  onCountTypeChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onStart: () => void;
  isLoading?: boolean;
  activeSession?: any;
  onJoinSession?: () => void;
}

export default function CountSetup({ countType, onCountTypeChange, notes, onNotesChange, onStart, isLoading, activeSession, onJoinSession }: CountSetupProps) {
  const now = new Date();
  const defaultTitle = `${countType === 'full' ? 'Full' : countType === 'partial' ? 'Partial' : 'Spot'} Inventory — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  
  const [sessionTitle, setSessionTitle] = useState(defaultTitle);
  const [selectedStore, setSelectedStore] = useState('');
  const [baseline, setBaseline] = useState('syrve');
  const [allowBarcode, setAllowBarcode] = useState(true);
  const [allowAi, setAllowAi] = useState(true);
  const [showExpected, setShowExpected] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  const { data: stores = [], isLoading: storesLoading } = useStores();

  const handleCountTypeChange = (v: string) => {
    onCountTypeChange(v);
    const label = v === 'full' ? 'Full' : v === 'partial' ? 'Partial' : 'Spot';
    setSessionTitle(`${label} Inventory — ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Create Session</h1>
        <p className="text-muted-foreground mt-1">Set up a new inventory counting session</p>
      </div>

      {activeSession && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Active Session Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                "{activeSession.session_name}" is currently in progress.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">In Progress</Badge>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={onJoinSession}>
            <Users className="w-4 h-4" />
            Join Active Session
          </Button>
        </div>
      )}

      <div className="glass-card rounded-xl p-6 space-y-5">
        {/* Session Title */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Session Title</Label>
          <Input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g., Weekly Inventory — Feb 15"
            className="h-11 bg-muted/30 border-border/60 focus:bg-card"
          />
        </div>

        {/* Count Type & Store */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Count Type</Label>
            <Select value={countType} onValueChange={handleCountTypeChange}>
              <SelectTrigger className="h-11 bg-muted/30 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Inventory</SelectItem>
                <SelectItem value="partial">Partial Count</SelectItem>
                <SelectItem value="spot">Spot Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Warehouse</Label>
            {storesLoading ? (
              <Skeleton className="h-11 rounded-md" />
            ) : (
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="h-11 bg-muted/30 border-border/60">
                  <SelectValue placeholder="Select warehouse..." />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3.5 h-3.5 text-muted-foreground" />
                        {s.name}
                        {s.code && <span className="text-muted-foreground text-[10px]">#{s.code}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Baseline Configuration */}
        <div className="space-y-2.5">
          <Label className="text-sm font-medium">Baseline Configuration</Label>
          <p className="text-xs text-muted-foreground -mt-1">Where expected quantities come from</p>
          <RadioGroup value={baseline} onValueChange={setBaseline} className="space-y-2">
            {[
              { value: 'syrve', title: 'Current Syrve stock', desc: 'Use live stock data from Syrve' },
              { value: 'last_session', title: 'Last session', desc: 'Use quantities from previous count' },
              { value: 'manual', title: 'Manual / Blank', desc: 'Start with no expected quantities' },
            ].map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                baseline === opt.value ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/30'
              }`}>
                <RadioGroupItem value={opt.value} />
                <div>
                  <p className="text-sm font-medium">{opt.title}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        </div>

        {/* Counting Settings */}
        <div className="space-y-3 pt-3 border-t border-border/40">
          <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Counting Settings</Label>
          <div className="space-y-2.5">
            {[
              { label: 'Allow barcode scanning', checked: allowBarcode, onChange: setAllowBarcode },
              { label: 'Allow AI recognition', checked: allowAi, onChange: setAllowAi },
              { label: 'Show expected stock to counters', checked: showExpected, onChange: setShowExpected },
              { label: 'Require approval before submission', checked: requireApproval, onChange: setRequireApproval },
            ].map(setting => (
              <div key={setting.label} className="flex items-center justify-between py-1">
                <p className="text-sm">{setting.label}</p>
                <Switch checked={setting.checked} onCheckedChange={setting.onChange} />
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Notes (optional)</Label>
          <Textarea
            placeholder="e.g., Weekly count, focus on premium section"
            className="bg-muted/30 border-border/60 focus:bg-card"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onStart}
            disabled={isLoading}
            className="h-12 text-sm font-semibold"
          >
            Create as Draft
          </Button>
          <Button
            onClick={onStart}
            disabled={isLoading}
            className="h-12 text-sm font-semibold app-gradient text-primary-foreground hover:opacity-90"
          >
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
            Create & Start
          </Button>
        </div>
      </div>
    </div>
  );
}
