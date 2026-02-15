import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, CheckCircle2, ThumbsUp, ThumbsDown, Send, Search, ScanLine, ClipboardList, AlertTriangle, MessageSquare, Bot, Clock, Eye, RotateCcw, FileText, Users
} from 'lucide-react';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockInventoryChecks, checkStatusConfig } from '@/data/mockInventoryChecks';
import { mockCheckItems, mockActivityLog } from '@/data/mockCheckDetail';

const methodIcons: Record<string, React.ElementType> = { manual: ClipboardList, barcode: ScanLine, ai_scan: Bot };

function VarianceSeverity({ variance, expected }: { variance: number | null; expected: number }) {
  if (variance === null || variance === 0) return null;
  const pct = expected > 0 ? Math.abs(variance / expected) * 100 : 0;
  if (pct > 10) return <span className="w-2 h-2 rounded-full bg-destructive inline-block" title="High variance" />;
  if (pct > 5) return <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" title="Medium variance" />;
  return <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Low variance" />;
}

export default function InventoryCheckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [varianceOnly, setVarianceOnly] = useState(false);
  const [countFilter, setCountFilter] = useState<'all' | 'counted' | 'not_counted'>('all');

  const check = mockInventoryChecks.find((c) => c.id === id);
  if (!check) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/checks')} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const cfg = checkStatusConfig[check.status];

  const filteredItems = mockCheckItems.filter((item) => {
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (varianceOnly && (item.varianceUnopened === 0 || item.varianceUnopened === null) && (item.varianceOpen === 0 || item.varianceOpen === null)) return false;
    if (countFilter === 'counted' && item.countedUnopened === null) return false;
    if (countFilter === 'not_counted' && item.countedUnopened !== null) return false;
    return true;
  });

  const totalCounted = mockCheckItems.filter((i) => i.countedUnopened !== null).length;
  const totalVariance = mockCheckItems.filter((i) => (i.varianceUnopened && i.varianceUnopened !== 0) || (i.varianceOpen && i.varianceOpen !== 0)).length;
  const totalItems = mockCheckItems.length;
  const progressPct = totalItems > 0 ? Math.round((totalCounted / totalItems) * 100) : 0;

  // Variance aggregates
  const surplusItems = mockCheckItems.filter(i => (i.varianceUnopened ?? 0) > 0);
  const shortageItems = mockCheckItems.filter(i => (i.varianceUnopened ?? 0) < 0);
  const surplusTotal = surplusItems.reduce((sum, i) => sum + (i.varianceUnopened ?? 0), 0);
  const shortageTotal = shortageItems.reduce((sum, i) => sum + (i.varianceUnopened ?? 0), 0);
  const netVariance = surplusTotal + shortageTotal;

  const countingColumns = [
    { key: 'productName', label: 'Product', sortable: true, render: (item: any) => <span className="font-medium text-foreground">{item.productName}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (item: any) => <Badge variant="outline" className="text-xs">{item.category}</Badge> },
    { key: 'countMethod', label: 'Method', sortable: true, render: (item: any) => { const Icon = methodIcons[item.countMethod] || ClipboardList; return <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs capitalize">{item.countMethod.replace('_', ' ')}</span></div>; }},
    { key: 'expectedUnopened', label: 'Expected', sortable: true, render: (item: any) => <span className="tabular-nums">{item.expectedUnopened}</span> },
    { key: 'countedUnopened', label: 'Counted', sortable: true, render: (item: any) => item.countedUnopened !== null ? <span className="tabular-nums font-medium">{item.countedUnopened}</span> : <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending</Badge> },
    { key: 'varianceUnopened', label: 'Variance', sortable: true, render: (item: any) => {
      const v = item.varianceUnopened;
      if (v === null) return <span className="text-muted-foreground">—</span>;
      if (v === 0) return <span className="tabular-nums text-muted-foreground">0</span>;
      return (
        <div className="flex items-center gap-1.5">
          <VarianceSeverity variance={v} expected={item.expectedUnopened} />
          <span className={`tabular-nums font-medium ${v < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{v > 0 ? `+${v}` : v}</span>
        </div>
      );
    }},
  ];

  // Timeline steps for session lifecycle
  const timelineSteps = [
    { label: 'Created', date: check.createdAt, active: true },
    { label: 'Started', date: check.startedAt, active: !!check.startedAt },
    { label: 'Completed', date: check.completedAt, active: !!check.completedAt },
    { label: 'Approved', date: check.approvedAt, active: !!check.approvedAt },
    { label: 'Synced', date: check.status === 'synced' ? check.approvedAt : null, active: check.status === 'synced' },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/checks')} className="gap-2 -mb-2"><ArrowLeft className="w-4 h-4" />Back to Sessions</Button>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{check.title}</h1>
            <Badge className={`${cfg.color} border-0`}>{cfg.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{check.storeName}</span><span>·</span><span>Created by {check.createdBy}</span><span>·</span><span>{new Date(check.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.status === 'draft' && <Button size="sm" className="gap-2"><Play className="w-4 h-4" />Start Session</Button>}
          {check.status === 'in_progress' && <Button size="sm" className="gap-2"><CheckCircle2 className="w-4 h-4" />Complete</Button>}
          {check.status === 'pending_review' && (<><Button size="sm" variant="outline" className="gap-2 text-destructive"><ThumbsDown className="w-4 h-4" />Reject</Button><Button size="sm" className="gap-2"><ThumbsUp className="w-4 h-4" />Approve</Button></>)}
          {check.status === 'approved' && <Button size="sm" className="gap-2"><Send className="w-4 h-4" />Send to Syrve</Button>}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Items</p>
            <p className="text-2xl font-bold mt-1">{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Counted</p>
            <p className="text-2xl font-bold mt-1 text-emerald-500">{totalCounted}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Remaining</p>
            <p className="text-2xl font-bold mt-1">{totalItems - totalCounted}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Variances</p>
            <p className={`text-2xl font-bold mt-1 ${totalVariance > 0 ? 'text-amber-500' : 'text-foreground'}`}>{totalVariance}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Progress</p>
            <div className="mt-2">
              <Progress value={progressPct} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 tabular-nums">{progressPct}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview" className="gap-2"><Eye className="w-4 h-4" />Overview</TabsTrigger>
          <TabsTrigger value="counting" className="gap-2"><ScanLine className="w-4 h-4" />Counting</TabsTrigger>
          <TabsTrigger value="review" className="gap-2"><AlertTriangle className="w-4 h-4" />Variances</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Clock className="w-4 h-4" />History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Session Timeline */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4">Session Timeline</h3>
              <div className="flex items-center justify-between">
                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-0 flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {idx + 1}
                      </div>
                      <p className={`text-[10px] mt-1 ${step.active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.date && <p className="text-[9px] text-muted-foreground">{new Date(step.date).toLocaleDateString()}</p>}
                    </div>
                    {idx < timelineSteps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 ${timelineSteps[idx + 1].active ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Variance Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Surplus</p>
                <p className="text-xl font-bold text-emerald-500 mt-1">+{surplusTotal}</p>
                <p className="text-[10px] text-muted-foreground">{surplusItems.length} items</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Shortage</p>
                <p className="text-xl font-bold text-destructive mt-1">{shortageTotal}</p>
                <p className="text-[10px] text-muted-foreground">{shortageItems.length} items</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Net Variance</p>
                <p className={`text-xl font-bold mt-1 ${netVariance < 0 ? 'text-destructive' : netVariance > 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                  {netVariance > 0 ? `+${netVariance}` : netVariance}
                </p>
                <p className="text-[10px] text-muted-foreground">total units</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Counters placeholder */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Active Counters</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                  <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">MS</div>
                  <span className="text-sm">Maria Silva</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Counting Tab */}
        <TabsContent value="counting" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex gap-1">
              {(['all', 'counted', 'not_counted'] as const).map(f => (
                <Button
                  key={f}
                  variant={countFilter === f ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setCountFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'counted' ? 'Counted' : 'Not Counted'}
                </Button>
              ))}
            </div>
          </div>
          <SimpleDataTable data={filteredItems} columns={countingColumns} keyField="id" emptyMessage="No items found" />
        </TabsContent>

        {/* Variances Tab */}
        <TabsContent value="review" className="space-y-4">
          {/* Variance Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="rounded-xl border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Surplus</p>
                <p className="text-lg font-bold text-emerald-500">+{surplusTotal}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-destructive/20">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Shortage</p>
                <p className="text-lg font-bold text-destructive">{shortageTotal}</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl border-border/60">
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted-foreground">Net</p>
                <p className={`text-lg font-bold ${netVariance < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{netVariance > 0 ? `+${netVariance}` : netVariance}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Button variant={varianceOnly ? 'default' : 'outline'} size="sm" onClick={() => setVarianceOnly(!varianceOnly)} className="gap-2"><AlertTriangle className="w-4 h-4" />Only Variances</Button>
          </div>
          <SimpleDataTable
            data={filteredItems.filter(i => !varianceOnly || ((i.varianceUnopened !== 0 && i.varianceUnopened !== null) || (i.varianceOpen !== 0 && i.varianceOpen !== null)))}
            columns={[
              ...countingColumns,
              { key: 'actions', label: '', sortable: false, render: (item: any) => (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="View Details"><Eye className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Add Note"><MessageSquare className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" title="Recount"><RotateCcw className="w-3 h-3" /></Button>
                </div>
              )}
            ]}
            keyField="id"
            emptyMessage="No variances found"
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="activity" className="space-y-4">
          {/* Session Lifecycle Timeline */}
          <Card className="rounded-xl border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 overflow-x-auto">
                {timelineSteps.map((step, idx) => (
                  <div key={step.label} className="flex items-center gap-2 shrink-0">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step.active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className={`text-xs ${step.active ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                      {step.date && <p className="text-[9px] text-muted-foreground">{new Date(step.date).toLocaleString()}</p>}
                    </div>
                    {idx < timelineSteps.length - 1 && <div className={`w-8 h-px ${timelineSteps[idx + 1].active ? 'bg-primary' : 'bg-muted'}`} />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <div className="space-y-1">
            {mockActivityLog.map((entry) => {
              const iconMap: Record<string, React.ElementType> = { count: ClipboardList, status_change: Play, ai_scan: Bot, adjustment: AlertTriangle, note: MessageSquare };
              const colorMap: Record<string, string> = { count: 'bg-primary/10 text-primary', status_change: 'bg-amber-500/10 text-amber-500', ai_scan: 'bg-emerald-500/10 text-emerald-500', adjustment: 'bg-destructive/10 text-destructive', note: 'bg-muted text-muted-foreground' };
              const Icon = iconMap[entry.type] || Clock;
              const color = colorMap[entry.type] || 'bg-muted text-muted-foreground';
              return (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className={`mt-0.5 p-1.5 rounded-md ${color}`}><Icon className="w-3.5 h-3.5" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{entry.description}</p>
                    {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">{entry.userName}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
