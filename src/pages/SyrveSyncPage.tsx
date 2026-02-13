import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Download, CheckCircle2, XCircle, Clock, Loader2, Package, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useSyrveConfig,
  useSyrveSyncRuns,
  useSyrveSync,
  useSyrveProducts,
  useSyrveCategories,
} from '@/hooks/useSyrve';

export default function SyrveSyncPage() {
  const navigate = useNavigate();
  const { data: config } = useSyrveConfig();
  const { data: syncRuns, isLoading: runsLoading } = useSyrveSyncRuns();
  const { data: products } = useSyrveProducts();
  const { data: categories } = useSyrveCategories();
  const syncMutation = useSyrveSync();

  const isConfigured = config?.connection_status === 'connected';
  const isSyncing = syncRuns?.some(r => r.status === 'running');

  const handleSync = async (type: string) => {
    try {
      const result = await syncMutation.mutateAsync(type);
      toast.success(`Sync completed! Products: ${result.stats?.products || 0}, Categories: ${result.stats?.categories || 0}`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default">Success</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': return <Badge variant="secondary">Running</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (!isConfigured) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings/syrve')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-heading font-bold">Sync Management</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Syrve is not configured. Please set up your connection first.</p>
            <Button className="mt-4" onClick={() => navigate('/settings/syrve')}>Configure Syrve</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings/syrve')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Sync Management</h1>
          <p className="text-muted-foreground">Synchronize data from Syrve Server API</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{products?.length ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <FolderTree className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{categories?.length ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{syncRuns?.length ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Sync Runs</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Operations</CardTitle>
          <CardDescription>Run full or incremental syncs from your Syrve server</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleSync('bootstrap')}
              disabled={syncMutation.isPending || isSyncing}
            >
              {(syncMutation.isPending || isSyncing) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Download className="w-4 h-4 mr-2" />
              Full Bootstrap Sync
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSync('products')}
              disabled={syncMutation.isPending || isSyncing}
            >
              Products Only
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSync('categories')}
              disabled={syncMutation.isPending || isSyncing}
            >
              Categories Only
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSync('stores')}
              disabled={syncMutation.isPending || isSyncing}
            >
              Stores Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization runs</CardDescription>
        </CardHeader>
        <CardContent>
          {runsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : !syncRuns || syncRuns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No sync runs yet. Run your first sync above.</p>
          ) : (
            <div className="space-y-2">
              {syncRuns.map((run) => (
                <div key={run.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {statusIcon(run.status)}
                    <div>
                      <p className="font-medium capitalize">{run.run_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(run.started_at).toLocaleString()}
                        {run.finished_at && ` • ${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`}
                      </p>
                      {run.stats && typeof run.stats === 'object' && (
                        <p className="text-xs text-muted-foreground">
                          {Object.entries(run.stats as Record<string, number>)
                            .filter(([, v]) => v > 0)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' • ')}
                        </p>
                      )}
                      {run.error && (
                        <p className="text-xs text-destructive mt-1">{run.error}</p>
                      )}
                    </div>
                  </div>
                  {statusBadge(run.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
