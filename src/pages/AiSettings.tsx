import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Sliders, Image, Loader2, Key, Upload, CheckCircle2, XCircle, AlertTriangle, Clock, Search, FlaskConical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import CollapsibleSection from '@/components/CollapsibleSection';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useAiConfig() {
  return useQuery({
    queryKey: ['ai_config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_config').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

function useUpdateAiConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { data: existing } = await supabase.from('ai_config').select('id').limit(1).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('ai_config').update(updates).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_config').insert(updates);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai_config'] }),
  });
}

// ---- AI Testing Tab ----

interface StepLog {
  step: string;
  status: string;
  detail: string;
  duration_ms: number;
}

interface MatchResult {
  id: string;
  name: string;
  code: string | null;
  sku: string | null;
  product_type: string | null;
  current_stock: number | null;
  purchase_price: number | null;
  sale_price: number | null;
  unit_capacity: number | null;
  retrieval_method: string;
  confidence_pct: number;
}

interface TestResult {
  status: string;
  extracted: Record<string, unknown> | null;
  raw_ocr_text: string;
  best_match: MatchResult | null;
  all_matches: MatchResult[];
  steps: StepLog[];
  tokens_used: number | null;
  model_used: string;
  processing_time_ms: number;
  error?: string;
}

function StepIndicator({ status }: { status: string }) {
  if (status === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (status === 'failed') return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
}

function AiTestingTab() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      const base64 = dataUrl.split(',')[1];
      setImageBase64(base64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRecognize = async () => {
    if (!imageBase64) return;
    setIsProcessing(true);
    setResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-test-recognize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ image_base64: imageBase64 }),
      });
      const json = await resp.json();
      if (!resp.ok && !json.steps) {
        throw new Error(json.error || `HTTP ${resp.status}`);
      }
      setResult(json as TestResult);
    } catch (err: any) {
      toast.error(err.message || 'Recognition failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setImageBase64(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confidenceColor = (pct: number) => {
    if (pct >= 70) return 'text-emerald-600 dark:text-emerald-400';
    if (pct >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-destructive';
  };

  const confidenceBg = (pct: number) => {
    if (pct >= 70) return 'bg-emerald-500/10 border-emerald-500/30';
    if (pct >= 40) return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-destructive/10 border-destructive/30';
  };

  return (
    <div className="space-y-5">
      {/* Upload Area */}
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center space-y-3">
        {imagePreview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={imagePreview} alt="Label preview" className="max-h-64 rounded-lg border border-border shadow-sm object-contain" />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleClear}>Clear</Button>
              <Button size="sm" onClick={handleRecognize} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Recognizing…</> : <><Search className="w-4 h-4 mr-2" /> Recognize Label</>}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Upload a wine label image to test AI recognition</p>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Image className="w-4 h-4 mr-2" /> Choose Image
            </Button>
          </>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      </div>

      {/* Processing Spinner */}
      {isProcessing && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm">Running AI recognition pipeline…</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div className={`p-3 rounded-lg border flex items-center gap-2 ${
            result.status === 'matched' ? 'bg-emerald-500/10 border-emerald-500/30' :
            result.status === 'low_confidence' ? 'bg-amber-500/10 border-amber-500/30' :
            'bg-destructive/10 border-destructive/30'
          }`}>
            {result.status === 'matched' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> :
             result.status === 'low_confidence' ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
             <XCircle className="w-5 h-5 text-destructive" />}
            <span className="text-sm font-medium">
              {result.status === 'matched' ? 'Product matched!' :
               result.status === 'low_confidence' ? 'Low confidence match' :
               result.error || 'No match found'}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">{result.processing_time_ms}ms • {result.tokens_used ?? '?'} tokens • {result.model_used}</span>
          </div>

          {/* Processing Steps */}
          <CollapsibleSection icon={Clock} title="Processing Steps" defaultOpen>
            <div className="space-y-2">
              {result.steps.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <StepIndicator status={s.status} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{s.step}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({s.duration_ms}ms)</span>
                    <p className="text-xs text-muted-foreground break-all">{s.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          {/* Extracted Data */}
          {result.extracted && (
            <CollapsibleSection icon={Brain} title="Extracted Label Data" defaultOpen>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {Object.entries(result.extracted).filter(([k]) => k !== 'label_text_raw').map(([k, v]) => (
                  <div key={k}>
                    <span className="text-muted-foreground text-xs">{k.replace(/_/g, ' ')}</span>
                    <p className="font-mono text-xs truncate">{v != null ? String(v) : <span className="text-muted-foreground italic">null</span>}</p>
                  </div>
                ))}
              </div>
              {result.extracted.label_text_raw && (
                <div className="mt-3 p-2 rounded bg-muted/50 text-xs font-mono break-all max-h-32 overflow-auto">
                  {String(result.extracted.label_text_raw)}
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* Match Results */}
          <CollapsibleSection icon={Search} title={`Product Matches (${result.all_matches.length})`} defaultOpen>
            {result.all_matches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching products found in GOODS catalog.</p>
            ) : (
              <div className="space-y-2">
                {result.all_matches.map((m, i) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      i === 0 ? confidenceBg(m.confidence_pct) : 'bg-card border-border'
                    }`}
                  >
                    <div className={`text-lg font-bold tabular-nums w-14 text-right ${confidenceColor(m.confidence_pct)}`}>
                      {m.confidence_pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {m.code && <span>Code: {m.code}</span>}
                        {m.sku && <span>SKU: {m.sku}</span>}
                        <span>Stock: {m.current_stock ?? 0}</span>
                        {m.unit_capacity && <span>Cap: {m.unit_capacity}</span>}
                        <Badge variant="outline" className="text-[10px] h-4">{m.retrieval_method}</Badge>
                      </div>
                    </div>
                    {i === 0 && m.confidence_pct >= 50 && (
                      <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs">Best</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}

// ---- Configuration Tab (original settings) ----

const PROVIDER_OPTIONS = [
  { value: 'lovable', label: 'Built-in (Lovable AI)', needsKey: false },
  { value: 'openai', label: 'OpenAI', needsKey: true },
  { value: 'google', label: 'Google (Gemini)', needsKey: true },
  { value: 'anthropic', label: 'Anthropic (Claude)', needsKey: true },
  { value: 'custom', label: 'Custom (OpenAI-compatible)', needsKey: true },
];

const MODEL_OPTIONS: Record<string, { value: string; label: string }[]> = {
  lovable: [
    { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash (default)' },
    { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
    { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini' },
    { value: 'openai/gpt-5', label: 'GPT-5' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  google: [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
  anthropic: [
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  custom: [],
};

function ConfigurationTab({ config, isLoading }: { config: any; isLoading: boolean }) {
  const updateConfig = useUpdateAiConfig();
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({
    is_active: true,
    model_name: 'google/gemini-2.5-flash',
    provider: 'lovable',
    max_image_size_mb: 4,
    rate_limit_per_minute: 60,
    settings: {} as Record<string, any>,
  });

  useEffect(() => {
    if (config) {
      setForm({
        is_active: config.is_active ?? true,
        model_name: config.model_name || 'google/gemini-2.5-flash',
        provider: config.provider || 'lovable',
        max_image_size_mb: config.max_image_size_mb ?? 4,
        rate_limit_per_minute: config.rate_limit_per_minute ?? 60,
        settings: (config.settings as Record<string, any>) || {},
      });
    }
  }, [config]);

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig.mutateAsync({
        is_active: form.is_active,
        model_name: form.model_name,
        provider: form.provider,
        max_image_size_mb: form.max_image_size_mb,
        rate_limit_per_minute: form.rate_limit_per_minute,
        settings: {
          ...form.settings,
          auto_preselect_threshold: form.settings.auto_preselect_threshold ?? 0.85,
          rescan_threshold: form.settings.rescan_threshold ?? 0.4,
          vision_verification_enabled: form.settings.vision_verification_enabled ?? false,
        },
      });
      toast.success('AI settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-40 w-full" /></div>;
  }

  const threshold = form.settings.auto_preselect_threshold ?? 0.85;
  const rescanThreshold = form.settings.rescan_threshold ?? 0.4;
  const visionEnabled = form.settings.vision_verification_enabled ?? false;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>

      <CollapsibleSection icon={Brain} title="Recognition Pipeline" defaultOpen>
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Enable AI Recognition</p>
              <p className="text-xs text-muted-foreground">Allow label scanning during inventory counts</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Vision Verification</p>
              <p className="text-xs text-muted-foreground">Use vision model to verify ambiguous matches (increases accuracy but slower)</p>
            </div>
            <Switch checked={visionEnabled} onCheckedChange={v => setForm(f => ({ ...f, settings: { ...f.settings, vision_verification_enabled: v } }))} />
          </div>
          <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2">
            <Badge variant="outline">{form.provider === 'lovable' ? 'Built-in' : PROVIDER_OPTIONS.find(p => p.value === form.provider)?.label}</Badge>
            <Badge variant="secondary">{form.model_name}</Badge>
            {form.settings.custom_api_key && <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]">Key configured</Badge>}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Sliders} title="Thresholds">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Auto-preselect threshold</Label>
            <p className="text-xs text-muted-foreground mb-1">Score above which a match is pre-selected (user still confirms). Range: 0.0–1.0</p>
            <Input type="number" step="0.05" min="0" max="1" value={threshold}
              onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, auto_preselect_threshold: parseFloat(e.target.value) || 0.85 } }))}
              className="bg-secondary border-border w-28" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rescan suggestion threshold</Label>
            <p className="text-xs text-muted-foreground mb-1">Below this score, UI suggests rescanning the label</p>
            <Input type="number" step="0.05" min="0" max="1" value={rescanThreshold}
              onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, rescan_threshold: parseFloat(e.target.value) || 0.4 } }))}
              className="bg-secondary border-border w-28" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rate limit (calls/minute)</Label>
            <Input type="number" min="1" max="300" value={form.rate_limit_per_minute}
              onChange={e => setForm(f => ({ ...f, rate_limit_per_minute: parseInt(e.target.value) || 60 }))}
              className="bg-secondary border-border w-28" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Image} title="Image Policy">
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Max image size (MB)</Label>
            <Input type="number" min="1" max="20" value={form.max_image_size_mb}
              onChange={e => setForm(f => ({ ...f, max_image_size_mb: parseInt(e.target.value) || 4 }))}
              className="bg-secondary border-border w-28" />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Key} title="AI Provider & API Key" defaultOpen>
        <div className="space-y-4">
          {/* Provider Select */}
          <div className="space-y-1">
            <Label className="text-xs">Provider</Label>
            <Select
              value={form.provider}
              onValueChange={(val) => {
                const models = MODEL_OPTIONS[val] || [];
                const defaultModel = models[0]?.value || '';
                setForm(f => ({
                  ...f,
                  provider: val,
                  model_name: val === 'custom' ? f.model_name : defaultModel,
                  settings: { ...f.settings, ai_provider: val },
                }));
              }}
            >
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.provider === 'lovable' && (
              <p className="text-xs text-muted-foreground">No API key needed — uses the built-in Lovable AI gateway.</p>
            )}
          </div>

          {/* Model Select */}
          <div className="space-y-1">
            <Label className="text-xs">Model</Label>
            {form.provider === 'custom' ? (
              <Input
                placeholder="e.g. my-fine-tuned-model"
                value={form.model_name}
                onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))}
                className="bg-secondary border-border font-mono text-xs"
              />
            ) : (
              <Select
                value={form.model_name}
                onValueChange={(val) => setForm(f => ({ ...f, model_name: val }))}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODEL_OPTIONS[form.provider] || []).map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">{form.model_name}</Badge>
              {form.provider !== 'lovable' && (
                <Badge variant="secondary" className="text-[10px]">Custom</Badge>
              )}
            </div>
          </div>

          {/* API Key (only for non-lovable) */}
          {PROVIDER_OPTIONS.find(p => p.value === form.provider)?.needsKey && (
            <div className="space-y-1">
              <Label className="text-xs">API Key</Label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder={`Enter your ${PROVIDER_OPTIONS.find(p => p.value === form.provider)?.label} API key`}
                  value={form.settings.custom_api_key || ''}
                  onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, custom_api_key: e.target.value || undefined } }))}
                  className="bg-secondary border-border font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {!form.settings.custom_api_key && (
                <p className="text-xs text-amber-500">⚠ API key required for this provider</p>
              )}
            </div>
          )}

          {/* Custom Gateway URL */}
          {form.provider !== 'lovable' && (
            <div className="space-y-1">
              <Label className="text-xs">API Endpoint URL (optional)</Label>
              <Input
                type="url"
                placeholder={
                  form.provider === 'openai' ? 'https://api.openai.com/v1/chat/completions' :
                  form.provider === 'google' ? 'https://generativelanguage.googleapis.com/v1beta' :
                  form.provider === 'anthropic' ? 'https://api.anthropic.com/v1/messages' :
                  'https://your-api.com/v1/chat/completions'
                }
                value={form.settings.custom_gateway_url || ''}
                onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, custom_gateway_url: e.target.value || undefined } }))}
                className="bg-secondary border-border font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">Override the default endpoint. Leave empty for standard API.</p>
            </div>
          )}

          {/* Reset to built-in */}
          {form.provider !== 'lovable' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm(f => ({
                  ...f,
                  provider: 'lovable',
                  model_name: 'google/gemini-2.5-flash',
                  settings: {
                    ...f.settings,
                    ai_provider: 'lovable',
                    custom_api_key: undefined,
                    custom_gateway_url: undefined,
                  },
                }));
              }}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset to Built-in AI
            </Button>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}

// ---- Main Page ----

export default function AiSettings() {
  const { user } = useAuthStore();
  const { data: config, isLoading } = useAiConfig();

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">AI Recognition</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">AI Recognition</h1>

      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config"><Sliders className="w-4 h-4 mr-1.5" /> Configuration</TabsTrigger>
          <TabsTrigger value="testing"><FlaskConical className="w-4 h-4 mr-1.5" /> AI Testing</TabsTrigger>
        </TabsList>
        <TabsContent value="config">
          <ConfigurationTab config={config} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="testing">
          <AiTestingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
