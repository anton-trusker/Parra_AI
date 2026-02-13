import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, ShieldCheck, Ruler, AlertTriangle, Loader2, ScanBarcode, Brain, Search, Beaker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';
import { useAppSetting, useUpdateAppSetting } from '@/hooks/useAppSettings';

export default function InventorySettings() {
  const { user } = useAuthStore();
  // Existing settings
  const { data: approvalRequired = true, isLoading: l1 } = useAppSetting<boolean>('inventory_approval_required', true);
  const { data: allowCountingAfterEnd = false, isLoading: l2 } = useAppSetting<boolean>('inventory_allow_counting_after_end', false);
  const { data: allowStaffCorrections = true, isLoading: l3 } = useAppSetting<boolean>('inventory_allow_staff_corrections', true);
  const { data: requireReasonForAdjustment = false, isLoading: l4 } = useAppSetting<boolean>('inventory_require_adjustment_reason', false);
  const { data: varianceThresholdLitres = 0, isLoading: l5 } = useAppSetting<number>('inventory_variance_threshold_litres', 0);
  const { data: requireEvidenceForHighVariance = false, isLoading: l6 } = useAppSetting<boolean>('inventory_require_evidence_high_variance', false);
  const { data: maxUnopenedPerEntry = 50, isLoading: l7 } = useAppSetting<number>('inventory_max_unopened_per_entry', 50);
  const { data: autoTimeoutHours = 0, isLoading: l8 } = useAppSetting<number>('inventory_auto_timeout_hours', 0);
  // New counting method settings
  const { data: barcodeEnabled = true, isLoading: l9 } = useAppSetting<boolean>('inventory_barcode_scanner_enabled', true);
  const { data: aiEnabled = true, isLoading: l10 } = useAppSetting<boolean>('inventory_ai_scanner_enabled', true);
  const { data: manualSearchEnabled = true, isLoading: l11 } = useAppSetting<boolean>('inventory_allow_manual_search', true);
  const { data: countingUnit = 'bottles', isLoading: l12 } = useAppSetting<string>('inventory_counting_unit', 'bottles');
  const { data: trackOpened = true, isLoading: l13 } = useAppSetting<boolean>('inventory_track_opened_bottles', true);
  const { data: requireLocation = true, isLoading: l14 } = useAppSetting<boolean>('inventory_require_location', true);
  const { data: allowNegativeStock = false, isLoading: l15 } = useAppSetting<boolean>('inventory_allow_negative_stock', false);
  // New improved rules
  const { data: baselineSource = 'syrve', isLoading: l16 } = useAppSetting<string>('inventory_baseline_source', 'syrve');
  const { data: autoCloseDays = 0, isLoading: l17 } = useAppSetting<number>('inventory_auto_close_days', 0);
  const { data: allowRecount = false, isLoading: l18 } = useAppSetting<boolean>('inventory_allow_recount', false);
  const { data: showLitresEquiv = true, isLoading: l19 } = useAppSetting<boolean>('inventory_show_litres_equivalent', true);

  const update = useUpdateAppSetting();
  const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || l7 || l8 || l9 || l10 || l11 || l12 || l13 || l14 || l15 || l16 || l17 || l18 || l19;

  const [form, setForm] = useState({
    approval_required: true,
    allow_counting_after_end: false,
    allow_staff_corrections: true,
    require_adjustment_reason: false,
    variance_threshold_litres: 0,
    require_evidence_high_variance: false,
    max_unopened_per_entry: 50,
    auto_timeout_hours: 0,
    barcode_scanner_enabled: true,
    ai_scanner_enabled: true,
    allow_manual_search: true,
    counting_unit: 'bottles',
    track_opened_bottles: true,
    require_location: true,
    allow_negative_stock: false,
    baseline_source: 'syrve',
    auto_close_days: 0,
    allow_recount: false,
    show_litres_equivalent: true,
  });

  useEffect(() => {
    if (!isLoading) {
      setForm({
        approval_required: approvalRequired,
        allow_counting_after_end: allowCountingAfterEnd,
        allow_staff_corrections: allowStaffCorrections,
        require_adjustment_reason: requireReasonForAdjustment,
        variance_threshold_litres: varianceThresholdLitres,
        require_evidence_high_variance: requireEvidenceForHighVariance,
        max_unopened_per_entry: maxUnopenedPerEntry,
        auto_timeout_hours: autoTimeoutHours,
        barcode_scanner_enabled: barcodeEnabled,
        ai_scanner_enabled: aiEnabled,
        allow_manual_search: manualSearchEnabled,
        counting_unit: countingUnit,
        track_opened_bottles: trackOpened,
        require_location: requireLocation,
        allow_negative_stock: allowNegativeStock,
        baseline_source: baselineSource,
        auto_close_days: autoCloseDays,
        allow_recount: allowRecount,
        show_litres_equivalent: showLitresEquiv,
      });
    }
  }, [isLoading, approvalRequired, allowCountingAfterEnd, allowStaffCorrections, requireReasonForAdjustment, varianceThresholdLitres, requireEvidenceForHighVariance, maxUnopenedPerEntry, autoTimeoutHours, barcodeEnabled, aiEnabled, manualSearchEnabled, countingUnit, trackOpened, requireLocation, allowNegativeStock, baselineSource, autoCloseDays, allowRecount, showLitresEquiv]);

  const [saving, setSaving] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const handleSave = async () => {
    setSaving(true);
    try {
      const mapping: Record<string, any> = {
        inventory_approval_required: form.approval_required,
        inventory_allow_counting_after_end: form.allow_counting_after_end,
        inventory_allow_staff_corrections: form.allow_staff_corrections,
        inventory_require_adjustment_reason: form.require_adjustment_reason,
        inventory_variance_threshold_litres: form.variance_threshold_litres,
        inventory_require_evidence_high_variance: form.require_evidence_high_variance,
        inventory_max_unopened_per_entry: form.max_unopened_per_entry,
        inventory_auto_timeout_hours: form.auto_timeout_hours,
        inventory_barcode_scanner_enabled: form.barcode_scanner_enabled,
        inventory_ai_scanner_enabled: form.ai_scanner_enabled,
        inventory_allow_manual_search: form.allow_manual_search,
        inventory_counting_unit: form.counting_unit,
        inventory_track_opened_bottles: form.track_opened_bottles,
        inventory_require_location: form.require_location,
        inventory_allow_negative_stock: form.allow_negative_stock,
        inventory_baseline_source: form.baseline_source,
        inventory_auto_close_days: form.auto_close_days,
        inventory_allow_recount: form.allow_recount,
        inventory_show_litres_equivalent: form.show_litres_equivalent,
      };
      for (const [key, value] of Object.entries(mapping)) {
        await update.mutateAsync({ key, value });
      }
      toast.success('Inventory rules saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
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
        <span className="text-foreground">Inventory Rules</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Inventory Rules</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">Changes apply to future sessions only. Active sessions keep their current rules.</p>

      {/* Counting Methods */}
      <CollapsibleSection icon={ScanBarcode} title="Counting Methods" defaultOpen>
        <div className="space-y-4">
          <ToggleRow label="Barcode Scanner" description="Enable barcode scanning to identify products during counting" checked={form.barcode_scanner_enabled} onChange={v => setForm(f => ({ ...f, barcode_scanner_enabled: v }))} />
          <ToggleRow label="AI Label Recognition" description="Use camera-based AI recognition to identify wine labels" checked={form.ai_scanner_enabled} onChange={v => setForm(f => ({ ...f, ai_scanner_enabled: v }))} />
          <ToggleRow label="Manual Search" description="Allow staff to search for products manually by name" checked={form.allow_manual_search} onChange={v => setForm(f => ({ ...f, allow_manual_search: v }))} />

          <div className="space-y-1 pt-2 border-t">
            <Label className="text-xs">Counting Unit</Label>
            <p className="text-xs text-muted-foreground mb-1">How quantities are entered and displayed during counting</p>
            <Select value={form.counting_unit} onValueChange={v => setForm(f => ({ ...f, counting_unit: v }))}>
              <SelectTrigger className="bg-secondary border-border w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottles">Bottles</SelectItem>
                <SelectItem value="litres">Litres</SelectItem>
                <SelectItem value="both">Both (Bottles + Litres)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ToggleRow label="Track opened bottles" description="Separately track opened bottles with glass-level measurement" checked={form.track_opened_bottles} onChange={v => setForm(f => ({ ...f, track_opened_bottles: v }))} />
          <ToggleRow label="Show litres equivalent" description="Display litre equivalent alongside bottle counts" checked={form.show_litres_equivalent} onChange={v => setForm(f => ({ ...f, show_litres_equivalent: v }))} />
        </div>
      </CollapsibleSection>

      {/* Session Rules */}
      <CollapsibleSection icon={ClipboardCheck} title="Session Rules" defaultOpen>
        <div className="space-y-4">
          <ToggleRow label="Approval required before submission" description="Manager must approve inventory before it's sent to Syrve" checked={form.approval_required} onChange={v => setForm(f => ({ ...f, approval_required: v }))} />
          <ToggleRow label="Allow counting after 'End Counting'" description="Staff can still add counts after manager ends counting phase" checked={form.allow_counting_after_end} onChange={v => setForm(f => ({ ...f, allow_counting_after_end: v }))} />
          <ToggleRow label="Allow staff corrections" description="Staff can add negative correction events to fix mistakes" checked={form.allow_staff_corrections} onChange={v => setForm(f => ({ ...f, allow_staff_corrections: v }))} />
          <ToggleRow label="Require reason for manager adjustments" description="Manager must provide a comment when adding adjustment events" checked={form.require_adjustment_reason} onChange={v => setForm(f => ({ ...f, require_adjustment_reason: v }))} />
          <ToggleRow label="Require location assignment" description="Each count must be tagged with a location/sub-location" checked={form.require_location} onChange={v => setForm(f => ({ ...f, require_location: v }))} />
          <ToggleRow label="Allow negative stock" description="Allow stock values to go below zero" checked={form.allow_negative_stock} onChange={v => setForm(f => ({ ...f, allow_negative_stock: v }))} />
          <ToggleRow label="Allow recount" description="Allow recounting the same item within one session" checked={form.allow_recount} onChange={v => setForm(f => ({ ...f, allow_recount: v }))} />

          <div className="space-y-1 pt-2 border-t">
            <Label className="text-xs">Baseline Source</Label>
            <p className="text-xs text-muted-foreground mb-1">Where expected quantities come from at session start</p>
            <Select value={form.baseline_source} onValueChange={v => setForm(f => ({ ...f, baseline_source: v }))}>
              <SelectTrigger className="bg-secondary border-border w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="syrve">Syrve (live stock)</SelectItem>
                <SelectItem value="last_session">Last Session</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Variance & Safety */}
      <CollapsibleSection icon={AlertTriangle} title="Variance & Safety">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Variance threshold (litres)</Label>
            <p className="text-xs text-muted-foreground mb-1">Require manager review if total variance exceeds this value. Set to 0 to disable.</p>
            <Input type="number" step="0.1" min="0" value={form.variance_threshold_litres} onChange={e => setForm(f => ({ ...f, variance_threshold_litres: parseFloat(e.target.value) || 0 }))} className="bg-secondary border-border w-32" />
          </div>
          <ToggleRow label="Require evidence for high-variance items" description="Staff must attach a photo for items exceeding the variance threshold" checked={form.require_evidence_high_variance} onChange={v => setForm(f => ({ ...f, require_evidence_high_variance: v }))} />
          <div className="space-y-1">
            <Label className="text-xs">Max unopened bottles per entry</Label>
            <p className="text-xs text-muted-foreground mb-1">Prevents fat-finger errors during counting</p>
            <Input type="number" min="1" max="999" value={form.max_unopened_per_entry} onChange={e => setForm(f => ({ ...f, max_unopened_per_entry: parseInt(e.target.value) || 50 }))} className="bg-secondary border-border w-32" />
          </div>
        </div>
      </CollapsibleSection>

      {/* Session Lifecycle */}
      <CollapsibleSection icon={ShieldCheck} title="Session Lifecycle">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Auto-timeout (hours)</Label>
            <p className="text-xs text-muted-foreground mb-1">Automatically end counting after this many hours. Set to 0 to disable.</p>
            <Input type="number" min="0" max="48" value={form.auto_timeout_hours} onChange={e => setForm(f => ({ ...f, auto_timeout_hours: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border w-32" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Auto-close stale sessions (days)</Label>
            <p className="text-xs text-muted-foreground mb-1">Automatically close sessions older than N days. Set to 0 to disable.</p>
            <Input type="number" min="0" max="90" value={form.auto_close_days} onChange={e => setForm(f => ({ ...f, auto_close_days: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border w-32" />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
