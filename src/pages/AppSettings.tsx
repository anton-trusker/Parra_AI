import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import {
  SlidersHorizontal, Shield, Users, RefreshCw, Database, Bell,
  Building2, ClipboardCheck, Brain, Wifi, WifiOff, CheckCircle2,
  AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSyrveConfig, useSyrveProducts, useSyrveSyncRuns } from '@/hooks/useSyrve';
import { useAppSetting } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

function useUserCount() {
  return useQuery({
    queryKey: ['user_count'],
    queryFn: async () => {
      const { count, error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
      if (error) throw error;
      return count || 0;
    },
  });
}

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

export default function AppSettings() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  const { data: syrveConfig } = useSyrveConfig();
  const { data: syncRuns } = useSyrveSyncRuns();
  const { data: products } = useSyrveProducts();
  const { data: userCount } = useUserCount();
  const { data: aiConfig } = useAiConfig();

  const isConnected = syrveConfig?.connection_status === 'connected';
  const lastSync = syncRuns?.[0];
  const productCount = products?.length || 0;

  // Build alerts
  const alerts: { message: string; href: string; level: 'warn' | 'error' }[] = [];
  if (!isConnected) alerts.push({ message: 'Syrve not connected', href: '/settings/syrve', level: 'error' });
  else {
    if (!syrveConfig?.default_store_id) alerts.push({ message: 'Default store not selected', href: '/settings/syrve', level: 'warn' });
    if (productCount === 0) alerts.push({ message: 'No products synced yet', href: '/settings/syrve/sync', level: 'warn' });
  }

  const sections = [
    { icon: Building2, title: 'Business', desc: 'Business profile, locale, currency, and timezone', href: '/settings/business' },
    { icon: SlidersHorizontal, title: 'General', desc: 'Glass dimensions, locations, bottle volumes, measurement units', href: '/settings/general' },
    { icon: ClipboardCheck, title: 'Inventory Rules', desc: 'Approval workflows, variance thresholds, counting rules', href: '/settings/inventory' },
    { icon: RefreshCw, title: 'Syrve Integration', desc: 'Connect to Syrve Server API for product catalog sync', href: '/settings/syrve' },
    { icon: Brain, title: 'AI Recognition', desc: 'Configure label recognition pipeline and thresholds', href: '/settings/ai' },
    { icon: Shield, title: 'Roles & Permissions', desc: 'Create custom roles and configure access rights', href: '/settings/roles' },
    { icon: Users, title: 'User Management', desc: 'Add, edit, and manage user accounts', href: '/users' },
    { icon: Database, title: 'Database', desc: 'Manage backups and data import/export' },
    { icon: Bell, title: 'Notifications', desc: 'Configure low stock alerts and preferences' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your inventory system and integrations.</p>
      </div>

      {/* Health Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Syrve Connection */}
        <Link to="/settings/syrve">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Syrve</p>
                <p className="font-semibold text-sm truncate">{isConnected ? 'Connected' : 'Not connected'}</p>
                {isConnected && syrveConfig?.default_store_name && (
                  <p className="text-xs text-muted-foreground truncate">{syrveConfig.default_store_name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Last Sync */}
        <Link to="/settings/syrve/sync">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${lastSync?.status === 'completed' ? 'bg-primary/10 text-primary' : lastSync?.status === 'failed' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'}`}>
                {lastSync?.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Last Sync</p>
                <p className="font-semibold text-sm">
                  {lastSync ? (lastSync.status === 'completed' ? 'Success' : lastSync.status) : 'Never'}
                </p>
                {lastSync?.finished_at && (
                  <p className="text-xs text-muted-foreground">{new Date(lastSync.finished_at).toLocaleDateString()}</p>
                )}
                <p className="text-xs text-muted-foreground">{productCount} products</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* AI Recognition */}
        <Link to="/settings/ai">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`p-2 rounded-lg ${aiConfig?.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Brain className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Recognition</p>
                <p className="font-semibold text-sm">{aiConfig?.is_active ? 'Enabled' : 'Disabled'}</p>
                <p className="text-xs text-muted-foreground">{aiConfig?.model_name || 'Not configured'}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Users */}
        <Link to="/users">
          <Card className="hover:shadow-md transition-shadow h-full">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="font-semibold text-sm">{userCount ?? '—'} active</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Link key={i} to={alert.href}>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${alert.level === 'error' ? 'border-destructive/30 bg-destructive/5' : 'border-yellow-500/30 bg-yellow-500/5'}`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.level === 'error' ? 'text-destructive' : 'text-yellow-500'}`} />
                <span className="text-sm flex-1">{alert.message}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Settings Sections */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const content = (
            <Card className="h-full hover:shadow-md transition-all border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  {s.title}
                </CardTitle>
                <CardDescription className="text-xs">{s.desc}</CardDescription>
              </CardHeader>
            </Card>
          );

          return s.href ? (
            <Link key={s.title} to={s.href} className="block h-full">{content}</Link>
          ) : (
            <div key={s.title} className="opacity-50 cursor-not-allowed h-full">{content}</div>
          );
        })}
      </div>
    </div>
  );
}
