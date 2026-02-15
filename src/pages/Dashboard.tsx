import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Package, AlertTriangle, Users, Clock, TrendingUp,
  ArrowRight, RefreshCw, CheckCircle2, XCircle, Loader2,
  ClipboardCheck, Wifi, WifiOff, BarChart3, Bot, Store, Play, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProducts } from '@/hooks/useProducts';
import { useInventorySessions } from '@/hooks/useInventorySessions';
import { useSyrveConfig, useSyrveSyncRuns } from '@/hooks/useSyrve';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mockAiScans } from '@/data/mockAiScans';
import { mockInventoryChecks, checkStatusConfig, type CheckStatus } from '@/data/mockInventoryChecks';
import { mockStores } from '@/data/mockStores';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

// Mock weekly variance trend
const varianceTrend = [
  { week: 'W1', pct: 3.2 }, { week: 'W2', pct: 4.1 }, { week: 'W3', pct: 2.8 },
  { week: 'W4', pct: 5.5 }, { week: 'W5', pct: 3.9 }, { week: 'W6', pct: 2.1 },
];

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="stat-card text-left w-full group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
      </div>
      <p className="text-2xl font-bold font-heading">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

function SessionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    draft: { cls: 'bg-secondary text-secondary-foreground', label: 'Draft' },
    in_progress: { cls: 'bg-primary/15 text-primary', label: 'Active' },
    completed: { cls: 'bg-amber-500/15 text-amber-500', label: 'Pending' },
    approved: { cls: 'bg-emerald-500/15 text-emerald-500', label: 'Approved' },
    flagged: { cls: 'bg-destructive/15 text-destructive', label: 'Flagged' },
  };
  const c = map[status] || map.draft;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.cls}`}>{c.label}</span>;
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();
  const { data: hideScannerDesktop } = useAppSetting('inventory_hide_scanner_desktop', false);
  const shouldHideScanner = !isMobile && hideScannerDesktop === true;

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: sessions = [], isLoading: sessionsLoading } = useInventorySessions();
  const { data: syrveConfig } = useSyrveConfig();
  const { data: syncRuns } = useSyrveSyncRuns();
  const { data: userCount } = useQuery({
    queryKey: ['user_count_dashboard'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
      return count || 0;
    },
  });

  const totalProducts = products.filter(p => p.is_active).length;
  const totalStock = products.reduce((s, p) => s + (Number(p.current_stock) || 0), 0);
  const lowStockProducts = products.filter(p => (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) < 5);
  const outOfStock = products.filter(p => (Number(p.current_stock) || 0) <= 0).length;

  const recentSessions = sessions.slice(0, 5);
  const isConnected = syrveConfig?.connection_status === 'connected';
  const lastSync = syncRuns?.[0];

  // Mock AI stats
  const aiConfirmed = mockAiScans.filter(s => s.status === 'confirmed').length;
  const aiWithConf = mockAiScans.filter(s => s.confidence > 0);
  const aiAvgConf = aiWithConf.length > 0 ? Math.round((aiWithConf.reduce((sum, s) => sum + s.confidence, 0) / aiWithConf.length) * 100) : 0;

  // Mock inventory health
  const checksInProgress = mockInventoryChecks.filter(c => c.status === 'in_progress').length;
  const checksPending = mockInventoryChecks.filter(c => c.status === 'pending_review').length;
  const totalVariances = mockInventoryChecks.reduce((sum, c) => sum + c.varianceItems, 0);

  // Active sessions from mock data
  const activeSessions = mockInventoryChecks.filter(c => ['in_progress', 'pending_review', 'draft'].includes(c.status));

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">
            {greeting}, {user?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Stats */}
      {productsLoading ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Package} label="Products" value={totalProducts} sub={`${outOfStock} out of stock`} onClick={() => navigate('/products')} />
          <StatCard icon={BarChart3} label="Total Stock" value={totalStock.toLocaleString()} sub="across all products" onClick={() => navigate('/inventory/by-store')} />
          <StatCard icon={AlertTriangle} label="Low Stock" value={lowStockProducts.length} color="bg-amber-500/10 text-amber-500" sub="below 5 units" onClick={() => navigate('/products')} />
          <StatCard icon={Users} label="Active Users" value={userCount ?? '—'} color="bg-emerald-500/10 text-emerald-500" onClick={() => navigate('/users')} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {!shouldHideScanner && (
              <button onClick={() => navigate('/count')} className="group relative overflow-hidden rounded-xl p-5 text-left app-gradient text-primary-foreground transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5">
                <ClipboardCheck className="w-8 h-8 mb-3 opacity-80" />
                <p className="font-heading font-semibold text-lg">Start Count</p>
                <p className="text-sm opacity-75 mt-1">Scan or search</p>
                <ArrowRight className="absolute top-5 right-5 w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <button onClick={() => navigate('/inventory/checks')} className="group rounded-xl p-5 text-left border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all hover:-translate-y-0.5">
              <ClipboardCheck className="w-8 h-8 mb-3 text-primary opacity-70" />
              <p className="font-heading font-semibold">Sessions</p>
              <p className="text-sm text-muted-foreground mt-1">{checksInProgress} in progress</p>
            </button>
            <button onClick={() => navigate('/products')} className="group rounded-xl p-5 text-left border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all hover:-translate-y-0.5">
              <Search className="w-8 h-8 mb-3 text-primary opacity-70" />
              <p className="font-heading font-semibold">Search Products</p>
              <p className="text-sm text-muted-foreground mt-1">{totalProducts} total</p>
            </button>
            <button onClick={() => navigate('/inventory/ai-scans')} className="group rounded-xl p-5 text-left border border-border bg-card hover:bg-muted/50 hover:border-primary/20 transition-all hover:-translate-y-0.5">
              <Bot className="w-8 h-8 mb-3 text-primary opacity-70" />
              <p className="font-heading font-semibold">AI Scans</p>
              <p className="text-sm text-muted-foreground mt-1">{mockAiScans.length} total</p>
            </button>
          </div>

          {/* Active Sessions Table */}
          {activeSessions.length > 0 && (
            <Card className="border-border/60 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <h3 className="font-heading font-semibold text-sm">Active Sessions</h3>
                    <Badge variant="secondary" className="text-[10px]">{activeSessions.length}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/inventory/checks')}>
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {activeSessions.slice(0, 4).map(s => {
                    const pct = s.totalItems > 0 ? Math.round((s.countedItems / s.totalItems) * 100) : 0;
                    const cfg = checkStatusConfig[s.status as CheckStatus];
                    return (
                      <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => navigate(`/inventory/checks/${s.id}`)}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">{s.storeName} · {s.createdBy}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-20">
                            <Progress value={pct} className="h-1.5" />
                            <p className="text-[10px] text-muted-foreground text-right mt-0.5 tabular-nums">{pct}%</p>
                          </div>
                          <Badge className={`${cfg.color} border-0 text-[10px]`}>{cfg.label}</Badge>
                          {s.status === 'in_progress' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={e => { e.stopPropagation(); navigate(`/inventory/checks/${s.id}`); }}>
                              <Play className="w-3 h-3" />Join
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Health with Variance Trend */}
          <Card className="border-border/60 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">Inventory Health</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/inventory/checks')}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">{checksInProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-500">{checksPending}</p>
                  <p className="text-xs text-muted-foreground">Pending Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{totalVariances}</p>
                  <p className="text-xs text-muted-foreground">Total Variances</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground mb-2">Weekly Variance Trend (%)</p>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={varianceTrend}>
                      <Line type="monotone" dataKey="pct" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        formatter={(value: any) => [`${value}%`, 'Variance']}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Activity Monitor */}
          <Card className="border-border/60 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <h3 className="font-heading font-semibold text-sm">AI Activity Monitor</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/inventory/ai-scans')}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{mockAiScans.length}</p>
                  <p className="text-xs text-muted-foreground">Total Scans</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-500">{aiConfirmed}</p>
                  <p className="text-xs text-muted-foreground">Confirmed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{aiAvgConf}%</p>
                  <p className="text-xs text-muted-foreground">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          {lowStockProducts.length > 0 && (
            <Card className="border-border/60 rounded-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="font-heading font-semibold text-sm">Low Stock Alerts</h3>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/products')}>
                    View all <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {lowStockProducts.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                      <span className="text-sm truncate flex-1 mr-3">{p.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.min(((p.current_stock || 0) / 5) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs font-mono font-semibold text-amber-500 w-6 text-right">{p.current_stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Integration Status */}
          <Card className="border-border/60 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                {isConnected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
                <h3 className="font-heading font-semibold text-sm">Syrve Integration</h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'} className="text-[10px]">
                    {isConnected ? 'Connected' : 'Disconnected'}
                  </Badge>
                </div>
                {isConnected && syrveConfig?.default_store_name && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Store</span>
                    <span className="text-xs truncate max-w-[120px]">{syrveConfig.default_store_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Sync</span>
                  <span className="text-xs">{lastSync?.finished_at ? new Date(lastSync.finished_at).toLocaleDateString() : 'Never'}</span>
                </div>
                {lastSync && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Result</span>
                    <span className={`text-xs font-medium ${lastSync.status === 'success' || lastSync.status === 'completed' ? 'text-emerald-500' : lastSync.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {lastSync.status === 'completed' ? 'Success' : lastSync.status}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stores Overview */}
          <Card className="border-border/60 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-heading font-semibold text-sm">Stores</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/inventory/by-store')}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-3">
                {mockStores.map(store => (
                  <div key={store.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm">{store.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{store.productCount} products</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/60 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-heading font-semibold text-sm">Recent Activity</h3>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => navigate('/history')}>
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              {sessionsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
                </div>
              ) : recentSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No sessions yet</p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map(s => (
                    <div key={s.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{s.session_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {s.started_at ? new Date(s.started_at).toLocaleDateString() : '—'}
                          {' · '}{s.total_wines_counted} counted
                        </p>
                      </div>
                      <SessionStatusBadge status={s.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
