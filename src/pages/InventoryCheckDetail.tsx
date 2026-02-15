import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Play, CheckCircle2, ThumbsUp, ThumbsDown, Send, Search, ScanLine, ClipboardList, AlertTriangle, MessageSquare, Bot, Clock
} from 'lucide-react';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockInventoryChecks, checkStatusConfig } from '@/data/mockInventoryChecks';
import { mockCheckItems, mockActivityLog } from '@/data/mockCheckDetail';

const methodIcons: Record<string, React.ElementType> = { manual: ClipboardList, barcode: ScanLine, ai_scan: Bot };

export default function InventoryCheckDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [varianceOnly, setVarianceOnly] = useState(false);

  const check = mockInventoryChecks.find((c) => c.id === id);
  if (!check) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/checks')} className="gap-2"><ArrowLeft className="w-4 h-4" />Back</Button>
        <p className="text-muted-foreground">Check not found.</p>
      </div>
    );
  }

  const cfg = checkStatusConfig[check.status];
  const filteredItems = mockCheckItems.filter((item) => {
    if (searchQuery && !item.productName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (varianceOnly && (item.varianceUnopened === 0 || item.varianceUnopened === null) && (item.varianceOpen === 0 || item.varianceOpen === null)) return false;
    return true;
  });

  const countingColumns = [
    { key: 'productName', label: 'Product', sortable: true, render: (item: any) => <span className="font-medium text-foreground">{item.productName}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (item: any) => <Badge variant="outline" className="text-xs">{item.category}</Badge> },
    { key: 'countMethod', label: 'Method', sortable: true, render: (item: any) => { const Icon = methodIcons[item.countMethod] || ClipboardList; return <div className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-xs capitalize">{item.countMethod.replace('_', ' ')}</span></div>; }},
    { key: 'expectedUnopened', label: 'Exp.', sortable: true, render: (item: any) => <span className="tabular-nums">{item.expectedUnopened}</span> },
    { key: 'countedUnopened', label: 'Counted', sortable: true, render: (item: any) => item.countedUnopened !== null ? <span className="tabular-nums">{item.countedUnopened}</span> : <span className="text-muted-foreground">—</span> },
    { key: 'expectedOpen', label: 'Exp. Open', sortable: true, render: (item: any) => <span className="tabular-nums">{item.expectedOpen}</span> },
    { key: 'countedOpen', label: 'Cnt. Open', sortable: true, render: (item: any) => item.countedOpen !== null ? <span className="tabular-nums">{item.countedOpen}</span> : <span className="text-muted-foreground">—</span> },
    { key: 'varianceUnopened', label: 'Var.', sortable: true, render: (item: any) => {
      const v = item.varianceUnopened;
      if (v === null) return <span className="text-muted-foreground">—</span>;
      if (v === 0) return <span className="tabular-nums text-muted-foreground">0</span>;
      return <span className={`tabular-nums font-medium ${v < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{v > 0 ? `+${v}` : v}</span>;
    }},
  ];

  const totalCounted = mockCheckItems.filter((i) => i.countedUnopened !== null).length;
  const totalVariance = mockCheckItems.filter((i) => (i.varianceUnopened && i.varianceUnopened !== 0) || (i.varianceOpen && i.varianceOpen !== 0)).length;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/inventory/checks')} className="gap-2 -mb-2"><ArrowLeft className="w-4 h-4" />Back to Checks</Button>
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
          {check.status === 'draft' && <Button size="sm" className="gap-2"><Play className="w-4 h-4" />Start Check</Button>}
          {check.status === 'in_progress' && <Button size="sm" className="gap-2"><CheckCircle2 className="w-4 h-4" />Complete</Button>}
          {check.status === 'pending_review' && (<><Button size="sm" variant="outline" className="gap-2 text-destructive"><ThumbsDown className="w-4 h-4" />Reject</Button><Button size="sm" className="gap-2"><ThumbsUp className="w-4 h-4" />Approve</Button></>)}
          {check.status === 'approved' && <Button size="sm" className="gap-2"><Send className="w-4 h-4" />Send to Syrve</Button>}
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Items', value: mockCheckItems.length },
          { label: 'Counted', value: totalCounted },
          { label: 'Variances', value: totalVariance, alert: totalVariance > 0 },
          { label: 'Progress', value: `${Math.round((totalCounted / mockCheckItems.length) * 100)}%` },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.alert ? 'text-amber-500' : 'text-foreground'}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Tabs defaultValue="counting" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="counting" className="gap-2"><ScanLine className="w-4 h-4" />Counting</TabsTrigger>
          <TabsTrigger value="review" className="gap-2"><AlertTriangle className="w-4 h-4" />Review & Variances</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Clock className="w-4 h-4" />Activity Log</TabsTrigger>
        </TabsList>
        <TabsContent value="counting" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9" />
            </div>
          </div>
          <SimpleDataTable data={filteredItems} columns={countingColumns} keyField="id" emptyMessage="No items found" />
        </TabsContent>
        <TabsContent value="review" className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant={varianceOnly ? 'default' : 'outline'} size="sm" onClick={() => setVarianceOnly(!varianceOnly)} className="gap-2"><AlertTriangle className="w-4 h-4" />Only Variances</Button>
          </div>
          <SimpleDataTable data={filteredItems} columns={countingColumns} keyField="id" emptyMessage="No variances found" />
        </TabsContent>
        <TabsContent value="activity" className="space-y-2">
          {mockActivityLog.map((entry) => {
            const iconMap: Record<string, React.ElementType> = { count: ClipboardList, status_change: Play, ai_scan: Bot, adjustment: AlertTriangle, note: MessageSquare };
            const Icon = iconMap[entry.type] || Clock;
            return (
              <div key={entry.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="mt-0.5 p-1.5 rounded-md bg-muted"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{entry.description}</p>
                  {entry.details && <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
