import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Sliders, Image, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

export default function AiSettings() {
  const { user } = useAuthStore();
  const { data: config, isLoading } = useAiConfig();
  const updateConfig = useUpdateAiConfig();

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

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

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
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const threshold = form.settings.auto_preselect_threshold ?? 0.85;
  const rescanThreshold = form.settings.rescan_threshold ?? 0.4;
  const visionEnabled = form.settings.vision_verification_enabled ?? false;

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">AI Recognition</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">AI Recognition</h1>
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
            <Badge variant="outline">{form.model_name}</Badge>
            <span className="text-xs text-muted-foreground">
              {form.settings.custom_api_key ? 'using custom key' : 'built-in'}
            </span>
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

      <CollapsibleSection icon={Key} title="API Key">
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            By default, the built-in AI gateway is used. You can optionally provide your own API key for direct access to Google Gemini or OpenAI models.
          </p>
          <div className="space-y-1">
            <Label className="text-xs">Custom API Key</Label>
            <Input
              type="password"
              placeholder="Leave empty to use built-in gateway"
              value={form.settings.custom_api_key || ''}
              onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, custom_api_key: e.target.value || undefined } }))}
              className="bg-secondary border-border font-mono text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Custom Gateway URL</Label>
            <Input
              type="url"
              placeholder="https://ai.gateway.lovable.dev/v1/chat/completions"
              value={form.settings.custom_gateway_url || ''}
              onChange={e => setForm(f => ({ ...f, settings: { ...f.settings, custom_gateway_url: e.target.value || undefined } }))}
              className="bg-secondary border-border font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">OpenAI-compatible endpoint. Leave empty for default.</p>
          </div>
          {form.settings.custom_api_key && (
            <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, settings: { ...f.settings, custom_api_key: undefined, custom_gateway_url: undefined } }))}>
              Clear Custom Key
            </Button>
          )}
        </div>
      </CollapsibleSection>
    </div>
  );
}
