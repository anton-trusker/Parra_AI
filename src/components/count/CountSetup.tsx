import { useState } from 'react';
import { Play, Loader2, Users, AlertCircle, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { mockStores } from '@/data/mockStores';

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
  const [selectedStore, setSelectedStore] = useState('store-1');
  const [baseline, setBaseline] = useState('syrve');
  const [allowBarcode, setAllowBarcode] = useState(true);
  const [allowAi, setAllowAi] = useState(true);
  const [showExpected, setShowExpected] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);

  // Update default title when count type changes
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

      {/* Active session warning */}
      {activeSession && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Active Session Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                "{activeSession.session_name}" is currently in progress. You can join this session or start a new one.
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

      <div className="wine-glass-effect rounded-xl p-6 space-y-5">
        {/* Session Title */}
        <div className="space-y-2">
          <Label>Session Title</Label>
          <Input
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g., Weekly Inventory — Feb 15"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* Count Type & Store */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Count Type</Label>
            <Select value={countType} onValueChange={handleCountTypeChange}>
              <SelectTrigger className="h-12 bg-card border-border">
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
            <Label>Store</Label>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="h-12 bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockStores.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-muted-foreground" />
                      {s.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Baseline Configuration */}
        <div className="space-y-2">
          <Label>Baseline Configuration</Label>
          <p className="text-xs text-muted-foreground">Where expected quantities come from</p>
          <RadioGroup value={baseline} onValueChange={setBaseline} className="space-y-2">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="syrve" />
              <div>
                <p className="text-sm font-medium">Current Syrve stock</p>
                <p className="text-xs text-muted-foreground">Use live stock data from Syrve</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="last_session" />
              <div>
                <p className="text-sm font-medium">Last session</p>
                <p className="text-xs text-muted-foreground">Use quantities from previous count</p>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="manual" />
              <div>
                <p className="text-sm font-medium">Manual / Blank</p>
                <p className="text-xs text-muted-foreground">Start with no expected quantities</p>
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Counting Settings */}
        <div className="space-y-3 pt-2 border-t border-border/40">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Counting Settings</Label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow barcode scanning</p>
              </div>
              <Switch checked={allowBarcode} onCheckedChange={setAllowBarcode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Allow AI recognition</p>
              </div>
              <Switch checked={allowAi} onCheckedChange={setAllowAi} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Show expected stock to counters</p>
              </div>
              <Switch checked={showExpected} onCheckedChange={setShowExpected} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm">Require approval before submission</p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="e.g., Weekly count, focus on premium section"
            className="bg-card border-border"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onStart}
            disabled={isLoading}
            className="h-14 text-base font-semibold"
          >
            Create as Draft
          </Button>
          <Button
            onClick={onStart}
            disabled={isLoading}
            className="h-14 text-base font-semibold app-gradient text-primary-foreground hover:opacity-90"
          >
            {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
            Create & Start
          </Button>
        </div>
      </div>
    </div>
  );
}
