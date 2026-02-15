import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import {
  SlidersHorizontal, Shield, Users, RefreshCw, Database, Bell,
  Building2, ClipboardCheck, Brain, ArrowRight, AlertTriangle,
  CreditCard, User, Puzzle
} from 'lucide-react';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import StatusIndicator from '@/components/StatusIndicator';
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

interface SettingCard {
  icon: React.ElementType;
  title: string;
  desc: string;
  href?: string;
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

  const alerts: { message: string; href: string; level: 'warn' | 'error' }[] = [];
  if (!isConnected) alerts.push({ message: 'Syrve not connected — set up your integration', href: '/settings/syrve', level: 'error' });
  else {
    if (!syrveConfig?.default_store_id) alerts.push({ message: 'Default store not selected', href: '/settings/syrve', level: 'warn' });
    if (productCount === 0) alerts.push({ message: 'No products synced yet — run your first sync', href: '/settings/syrve/sync', level: 'warn' });
  }

  const sections: { label: string; cards: SettingCard[] }[] = [
    {
      label: 'General',
      cards: [
        { icon: Building2, title: 'Business', desc: 'Business profile, locale, and timezone', href: '/settings/business' },
        { icon: SlidersHorizontal, title: 'General', desc: 'Measurement units and configuration', href: '/settings/general' },
      ],
    },
    {
      label: 'Users & Access',
      cards: [
        { icon: Users, title: 'User Management', desc: 'Manage user accounts and access', href: '/users' },
        { icon: Shield, title: 'Roles & Permissions', desc: 'Custom roles and access rights', href: '/settings/roles' },
      ],
    },
    {
      label: 'Integrations',
      cards: [
        { icon: RefreshCw, title: 'Syrve Integration', desc: 'Product catalog sync from Syrve API', href: '/settings/syrve' },
        { icon: Brain, title: 'AI Recognition', desc: 'Label recognition and AI pipeline', href: '/settings/ai' },
      ],
    },
    {
      label: 'Inventory',
      cards: [
        { icon: ClipboardCheck, title: 'Inventory Rules', desc: 'Approval workflows and thresholds', href: '/settings/inventory' },
      ],
    },
    {
      label: 'System',
      cards: [
        { icon: CreditCard, title: 'Billing & Usage', desc: 'Subscription, AI usage, invoices', href: '/settings/billing' },
        { icon: Database, title: 'Database', desc: 'Backups and data import/export' },
        { icon: Bell, title: 'Notifications', desc: 'Low stock alerts and preferences' },
        { icon: Puzzle, title: 'Custom Fields', desc: 'Custom attributes for products' },
        { icon: User, title: 'My Profile', desc: 'Account settings and preferences', href: '/profile' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">Configure your inventory system and integrations.</p>
      </div>

      {/* System Health Status Bar */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/settings/syrve">
          <StatusIndicator
            status={isConnected ? 'success' : 'error'}
            label={isConnected ? 'Syrve Connected' : 'Syrve Disconnected'}
            detail={isConnected ? syrveConfig?.default_store_name || 'Connected' : 'Click to configure'}
          />
        </Link>
        <Link to="/settings/syrve/sync">
          <StatusIndicator
            status={lastSync?.status === 'completed' || lastSync?.status === 'success' ? 'success' : lastSync?.status === 'failed' ? 'error' : 'neutral'}
            label={lastSync ? `Last sync: ${lastSync.status === 'completed' ? 'Success' : lastSync.status}` : 'Never synced'}
            detail={`${productCount} products`}
          />
        </Link>
        <Link to="/settings/ai">
          <StatusIndicator
            status={aiConfig?.is_active ? 'success' : 'neutral'}
            label={aiConfig?.is_active ? 'AI Enabled' : 'AI Disabled'}
            detail={aiConfig?.model_name || 'Not configured'}
          />
        </Link>
        <Link to="/users">
          <StatusIndicator
            status="success"
            label={`${userCount ?? '—'} Active Users`}
            detail="User management"
          />
        </Link>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <Link key={i} to={alert.href}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors hover:shadow-sm ${
                alert.level === 'error'
                  ? 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10'
                  : 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10'
              }`}>
                <AlertTriangle className={`w-4 h-4 shrink-0 ${alert.level === 'error' ? 'text-destructive' : 'text-amber-500'}`} />
                <span className="text-sm flex-1">{alert.message}</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Grouped Settings */}
      {sections.map(section => (
        <div key={section.label}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{section.label}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((s) => {
              const inner = (
                <Card className={`h-full transition-all group border-border/60 ${s.href ? 'hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5' : 'opacity-50'}`}>
                  <CardContent className="p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-heading font-semibold text-sm">{s.title}</p>
                        {s.href && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
                      </div>
                      <CardDescription className="text-xs mt-0.5">{s.desc}</CardDescription>
                    </div>
                  </CardContent>
                </Card>
              );

              return s.href ? (
                <Link key={s.title} to={s.href} className="block h-full">{inner}</Link>
              ) : (
                <div key={s.title} className="cursor-not-allowed h-full">{inner}</div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
