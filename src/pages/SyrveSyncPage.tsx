import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { StopCircle } from 'lucide-react';
import { ArrowLeft, RefreshCw, Download, CheckCircle2, XCircle, Clock, Loader2, Package, FolderTree, Store, Barcode, Send, SkipForward, Wine, Beaker } from 'lucide-react';
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
  useSyrveStores,
  useSyrveBarcodeCount,
  useSyrveOutboxJobs,
  useProcessOutbox,
  useForceStopSync,
} from '@/hooks/useSyrve';

export default function SyrveSyncPage() {
  const navigate = useNavigate();
  const { data: config } = useSyrveConfig();
  const { data: syncRuns, isLoading: runsLoading } = useSyrveSyncRuns();
  const { data: products } = useSyrveProducts();
  const { data: categories } = useSyrveCategories();
  const { data: stores } = useSyrveStores();
  const { data: barcodeCount } = useSyrveBarcodeCount();
  const { data: outboxJobs } = useSyrveOutboxJobs();
  const syncMutation = useSyrveSync();
  const processOutbox = useProcessOutbox();
  const forceStop = useForceStopSync();

  const isConfigured = config?.connection_status === 'connected';
  const isSyncing = syncRuns?.some(r => r.status === 'running');
  const pendingJobs = outboxJobs?.filter(j => j.status === 'pending' || j.status === 'processing') || [];

  // Compute unit type breakdown from products
  const unitBreakdown = (() => {
    if (!products || products.length === 0) return null;
    const units: Record<string, number> = {};
    const categories: Record<string, number> = {};
    let withContainers = 0;
    let withoutContainers = 0;

    for (const p of products) {
      const unit = (p as any).main_unit_id || 'unknown';
      units[unit] = (units[unit] || 0) + 1;

      const meta = (p as any).metadata as any;
      if (meta?.productCategory) {
        const cat = meta.productCategory;
        categories[cat] = (categories[cat] || 0) + 1;
      }

      const syrveData = (p as any).syrve_data as any;
      if (syrveData?.containers && Array.isArray(syrveData.containers) && syrveData.containers.length > 0) {
        withContainers++;
      } else {
        withoutContainers++;
      }
    }

    return { units, categories, withContainers, withoutContainers };
  })();

  const handleSync = async (type: string) => {
    try {
      const result = await syncMutation.mutateAsync(type);
      const s = result.stats || {};
      const parts = [];
      if (s.products) parts.push(`Products: ${s.products}`);
      if (s.categories) parts.push(`Categories: ${s.categories}`);
      if (s.stores) parts.push(`Stores: ${s.stores}`);
      if (s.barcodes) parts.push(`Barcodes: ${s.barcodes}`);
      if (s.skipped) parts.push(`Skipped: ${s.skipped}`);
      toast.success(`Sync completed! ${parts.join(', ')}`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    }
  };

  const handleProcessOutbox = async () => {
    try {
      const result = await processOutbox.mutateAsync(undefined);
      toast.success(`Processed ${result.processed} outbox job(s)`);
    } catch (err: any) {
      toast.error(err.message || 'Outbox processing failed');
    }
  };

  const handleForceStop = async () => {
    try {
      await forceStop.mutateAsync();
      toast.success('Sync stopped and lock cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to stop sync');
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-primary" />;
      case 'failed': return <XCircle className="w-4 h-4 text-destructive" />;
      case 'running': case 'processing': return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default">Success</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'running': case 'processing': return <Badge variant="secondary">Running</Badge>;
      case 'pending': return <Badge variant="outline">Pending</Badge>;
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stores?.length ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Stores</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
              <Barcode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{barcodeCount ?? '—'}</p>
              <p className="text-sm text-muted-foreground">Barcodes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Type Breakdown */}
      {unitBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Beaker className="w-5 h-5" />
              Product Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Unit types */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">By Main Unit</p>
                <div className="space-y-1">
                  {Object.entries(unitBreakdown.units)
                    .sort(([, a], [, b]) => b - a)
                    .map(([unit, count]) => (
                      <div key={unit} className="flex items-center justify-between text-sm">
                        <span className="truncate">{unit || 'unknown'}</span>
                        <Badge variant="outline" className="ml-2">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Container info */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Container Data</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>With containers</span>
                    <Badge variant="outline">{unitBreakdown.withContainers}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Without containers</span>
                    <Badge variant="outline">{unitBreakdown.withoutContainers}</Badge>
                  </div>
                </div>
              </div>

              {/* Product categories */}
              {Object.keys(unitBreakdown.categories).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">By Category Type</p>
                  <div className="space-y-1">
                    {Object.entries(unitBreakdown.categories)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, count]) => (
                        <div key={cat} className="flex items-center justify-between text-sm">
                          <span className="truncate">{cat}</span>
                          <Badge variant="outline" className="ml-2">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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
              <Package className="w-4 h-4 mr-2" />
              Products Only
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSync('categories')}
              disabled={syncMutation.isPending || isSyncing}
            >
              <FolderTree className="w-4 h-4 mr-2" />
              Categories Only
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSync('stores')}
              disabled={syncMutation.isPending || isSyncing}
            >
              <Store className="w-4 h-4 mr-2" />
              Stores Only
            </Button>
            {isSyncing && (
              <Button
                variant="destructive"
                onClick={handleForceStop}
                disabled={forceStop.isPending}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Force Stop
              </Button>
            )}
          </div>
          {config?.selected_category_ids && config.selected_category_ids.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <SkipForward className="w-3 h-3" />
              Category filter active: only {config.selected_category_ids.length} categories will be synced
            </p>
          )}
        </CardContent>
      </Card>

      {/* Outbox Jobs */}
      {outboxJobs && outboxJobs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Outbox Jobs
                </CardTitle>
                <CardDescription>Inventory submissions to Syrve</CardDescription>
              </div>
              {pendingJobs.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleProcessOutbox}
                  disabled={processOutbox.isPending}
                >
                  {processOutbox.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Process {pendingJobs.length} Pending
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outboxJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {statusIcon(job.status)}
                    <div>
                      <p className="font-medium capitalize">{job.job_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(job.created_at).toLocaleString()}
                        {job.attempts > 0 && ` • Attempts: ${job.attempts}`}
                      </p>
                      {job.last_error && (
                        <p className="text-xs text-destructive mt-1">{job.last_error}</p>
                      )}
                    </div>
                  </div>
                  {statusBadge(job.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
