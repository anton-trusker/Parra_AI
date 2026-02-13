import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Eye, Sliders, Image, Loader2, RefreshCw } from 'lucide-react';
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

function useWineStats() {
  return useQuery({
    queryKey: ['wine_stats_for_ai'],
    queryFn: async () => {
      const { count: total } = await supabase.from('wines').select('id', { count: 'exact', head: true }).eq('is_active', true);
      const { count: withEmbedding } = await supabase.from('wines').select('id', { count: 'exact', head: true }).eq('is_active', true).not('embedding', 'is', null);
      const { count: withSearchText } = await supabase.from('wines').select('id', { count: 'exact', head: true }).eq('is_active', true).not('search_text', 'is', null);
      return { total: total || 0, withEmbedding: withEmbedding || 0, withSearchText: withSearchText || 0 };
    },
  });
}

export default function AiSettings() {
  const { user } = useAuthStore();
  const { data: config, isLoading } = useAiConfig();
  const updateConfig = useUpdateAiConfig();
  const { data: stats } = useWineStats();

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
  const [reindexing, setReindexing] = useState(false);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

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

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('generate-wine-embeddings', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      const result = res.data;
      toast.success(`Reindexed ${result?.updated || 0} wines`);
    } catch (e: any) {
      toast.error(e.message || 'Reindex failed');
    } finally {
      setReindexing(false);
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

      {/* Index Stats */}
      {stats && (
        <div className="grid gap-3 grid-cols-3">
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total wines</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-2xl font-bold">{stats.withSearchText}</p>
            <p className="text-xs text-muted-foreground">Text indexed</p>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3 text-center">
            <p className="text-2xl font-bold">{stats.withEmbedding}</p>
            <p className="text-xs text-muted-foreground">Embeddings</p>
          </div>
        </div>
      )}

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
            <span className="text-xs text-muted-foreground">via {form.provider}</span>
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

      <CollapsibleSection icon={RefreshCw} title="Search Index">
        <p className="text-sm text-muted-foreground mb-3">Rebuild the text search index for all active wines. This enables fuzzy matching during label recognition.</p>
        <Button onClick={handleReindex} disabled={reindexing} variant="outline">
          {reindexing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Rebuild Search Index
        </Button>
      </CollapsibleSection>
    </div>
  );
}
