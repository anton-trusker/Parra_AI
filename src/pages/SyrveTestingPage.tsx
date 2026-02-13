import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft, Beaker, ToggleLeft, ToggleRight, Package, FolderTree, Store, Download,
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle, Eye, ChevronDown, ChevronRight,
  Send, RefreshCw, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  useSyrveConfig,
  useSyrveSync,
  useSyrveApiLogs,
  useSyrveOutboxJobs,
  useProcessOutbox,
  useToggleTestingMode,
} from '@/hooks/useSyrve';

export default function SyrveTestingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  const { data: config } = useSyrveConfig();
  const { data: apiLogs, isLoading: logsLoading } = useSyrveApiLogs(100);
  const { data: outboxJobs } = useSyrveOutboxJobs();
  const syncMutation = useSyrveSync();
  const processOutbox = useProcessOutbox();
  const toggleTestingMode = useToggleTestingMode();

  const isTestingMode = config?.testing_mode === true;
  const isConnected = config?.connection_status === 'connected';

  const handleToggleTestingMode = async () => {
    try {
      await toggleTestingMode.mutateAsync(!isTestingMode);
      toast.success(isTestingMode ? 'Testing mode disabled — data will be sent to Syrve' : 'Testing mode enabled — no data will be sent to Syrve');
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle testing mode');
    }
  };

  const handleSync = async (type: string) => {
    try {
      const result = await syncMutation.mutateAsync(type);
      const s = result.stats || {};
      const parts = Object.entries(s).filter(([, v]) => (v as number) > 0).map(([k, v]) => `${k}: ${v}`);
      toast.success(`Sync completed! ${parts.join(', ')}`);
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    }
  };

  const handleProcessOutbox = async () => {
    try {
      const result = await processOutbox.mutateAsync(undefined);
      toast.success(`Processed ${result.processed} job(s)${isTestingMode ? ' (test mode)' : ''}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed');
    }
  };

  const statusIcon = (status: string) => {
    if (status.includes('success')) return <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />;
    if (status.includes('error') || status === 'failed') return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    if (status === 'running' || status === 'processing') return <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />;
    return <Clock className="w-4 h-4 text-muted-foreground shrink-0" />;
  };

  const statusBadge = (status: string) => {
    if (status.includes('test')) return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Test</Badge>;
    if (status.includes('success')) return <Badge variant="default">Success</Badge>;
    if (status.includes('error') || status === 'failed') return <Badge variant="destructive">Error</Badge>;
    if (status === 'pending') return <Badge variant="outline">Pending</Badge>;
    return <Badge variant="secondary">{status}</Badge>;
  };

  const pendingJobs = outboxJobs?.filter(j => j.status === 'pending' || j.status === 'processing') || [];

  if (!isConnected) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/settings/syrve')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-heading font-bold">Integration Testing</h1>
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings/syrve')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Beaker className="w-7 h-7" />
            Integration Testing
          </h1>
          <p className="text-muted-foreground">Test Syrve integration without sending real data</p>
        </div>
      </div>

      {/* Testing Mode Toggle */}
      <Card className={isTestingMode ? 'border-amber-500/50 bg-amber-500/5' : ''}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isTestingMode ? (
                <div className="p-3 rounded-xl bg-amber-500/15">
                  <Beaker className="w-6 h-6 text-amber-600" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-primary/10">
                  <Send className="w-6 h-6 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-heading font-semibold">
                  {isTestingMode ? 'Testing Mode Active' : 'Production Mode'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isTestingMode
                    ? 'Outbox jobs will be logged but NOT sent to Syrve. Inbound syncs (categories, products, stores) still fetch real data.'
                    : 'All outbox jobs will be submitted to Syrve as normal.'}
                </p>
              </div>
            </div>
            <Switch
              checked={isTestingMode}
              onCheckedChange={handleToggleTestingMode}
              disabled={toggleTestingMode.isPending}
            />
          </div>
          {isTestingMode && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                No inventory data will be sent to Syrve while testing mode is enabled.
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Sections */}
      <Card>
        <CardHeader>
          <CardTitle>Import Data Sections</CardTitle>
          <CardDescription>Import each data type separately to test and verify</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleSync('stores')}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Store className="w-6 h-6" />}
              <span className="font-medium">Stores</span>
              <span className="text-xs text-muted-foreground">Fetch store locations</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleSync('categories')}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <FolderTree className="w-6 h-6" />}
              <span className="font-medium">Categories</span>
              <span className="text-xs text-muted-foreground">Fetch product groups</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleSync('products')}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6" />}
              <span className="font-medium">Products</span>
              <span className="text-xs text-muted-foreground">Fetch product catalog</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={() => handleSync('bootstrap')}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
              <span className="font-medium">Full Sync</span>
              <span className="text-xs text-muted-foreground">All sections at once</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Outbox Test */}
      {outboxJobs && outboxJobs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Outbox Jobs
                  {isTestingMode && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]">Test Mode</Badge>}
                </CardTitle>
                <CardDescription>
                  {isTestingMode ? 'Jobs will be simulated, not sent to Syrve' : 'Jobs will be sent to Syrve'}
                </CardDescription>
              </div>
              {pendingJobs.length > 0 && (
                <Button size="sm" onClick={handleProcessOutbox} disabled={processOutbox.isPending}>
                  {processOutbox.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Process {pendingJobs.length} Pending
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {outboxJobs.map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {statusIcon(job.status)}
                      <div>
                        <p className="font-medium capitalize text-sm">{job.job_type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.created_at).toLocaleString()}
                          {job.attempts > 0 && ` • Attempts: ${job.attempts}`}
                        </p>
                      </div>
                    </div>
                    {statusBadge(job.status)}
                  </div>
                  {job.last_error && (
                    <p className="text-xs text-destructive bg-destructive/5 p-2 rounded">{job.last_error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Request/Response Log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            API Request Log
          </CardTitle>
          <CardDescription>All Syrve API calls with request/response details</CardDescription>
        </CardHeader>
        <CardContent>
          {logsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
          ) : !apiLogs || apiLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No API calls recorded yet. Run a sync to see logs.</div>
          ) : (
            <div className="space-y-1">
              {apiLogs.map((log) => {
                const isExpanded = expandedLog === log.id;
                const isTest = log.action_type.includes('TEST') || log.request_url?.includes('TEST MODE');
                return (
                  <div key={log.id} className={`rounded-lg border transition-colors ${isTest ? 'border-amber-500/30 bg-amber-500/5' : 'border-border'}`}>
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 rounded-lg transition-colors"
                    >
                      {statusIcon(log.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold">{log.action_type}</span>
                          {isTest && <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[9px] px-1.5">TEST</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {log.request_method} {log.request_url?.replace(/key=[^&]+/, 'key=***')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.duration_ms && (
                          <span className="text-xs text-muted-foreground">{log.duration_ms}ms</span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.created_at).toLocaleTimeString()}
                        </span>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2">
                        <Separator />
                        <div className="grid gap-2 text-xs">
                          <div>
                            <span className="font-semibold text-muted-foreground">Status: </span>
                            {statusBadge(log.status)}
                          </div>
                          {log.request_url && (
                            <div>
                              <span className="font-semibold text-muted-foreground">URL: </span>
                              <code className="text-[11px] bg-muted px-1.5 py-0.5 rounded break-all">
                                {log.request_url.replace(/key=[^&]+/, 'key=***')}
                              </code>
                            </div>
                          )}
                          {log.duration_ms && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Duration: </span>
                              <span>{log.duration_ms}ms</span>
                            </div>
                          )}
                          {log.error_message && (
                            <div>
                              <span className="font-semibold text-muted-foreground">Error: </span>
                              <span className="text-destructive">{log.error_message}</span>
                            </div>
                          )}
                          {log.response_payload_preview && (
                            <div>
                              <span className="font-semibold text-muted-foreground block mb-1">Response Preview:</span>
                              <pre className="bg-muted p-2 rounded text-[11px] overflow-x-auto max-h-40 whitespace-pre-wrap">
                                {log.response_payload_preview}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
