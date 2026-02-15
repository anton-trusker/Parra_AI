import { useState } from 'react';
import { Bot, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { mockAiScans, aiScanStatusConfig, type AiScanStatus } from '@/data/mockAiScans';

export default function AiScansPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const filtered = mockAiScans.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (storeFilter !== 'all' && s.storeName !== storeFilter) return false;
    return true;
  });

  const stores = [...new Set(mockAiScans.map((s) => s.storeName))];
  const totalScans = mockAiScans.length;
  const confirmed = mockAiScans.filter((s) => s.status === 'confirmed').length;
  const withConfidence = mockAiScans.filter((s) => s.confidence > 0);
  const avgConfidence = withConfidence.length > 0 ? Math.round((withConfidence.reduce((sum, s) => sum + s.confidence, 0) / withConfidence.length) * 100) : 0;
  const avgTime = Math.round(mockAiScans.reduce((sum, s) => sum + s.processingTimeMs, 0) / mockAiScans.length);

  const columns = [
    { key: 'timestamp', label: 'Time', sortable: true, render: (item: any) => <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span> },
    { key: 'detectedName', label: 'Detected Name', sortable: true },
    { key: 'productName', label: 'Matched Product', sortable: true, render: (item: any) => item.productName ? <span className="text-sm font-medium text-foreground">{item.productName}</span> : <span className="text-xs text-muted-foreground italic">No match</span> },
    { key: 'quantity', label: 'Qty', sortable: true, render: (item: any) => <span className="tabular-nums">{item.quantity}</span> },
    { key: 'confidence', label: 'Confidence', sortable: true, render: (item: any) => {
      if (item.confidence === 0) return <span className="text-xs text-muted-foreground">—</span>;
      const pct = Math.round(item.confidence * 100);
      const color = pct >= 90 ? 'text-emerald-500' : pct >= 70 ? 'text-amber-500' : 'text-destructive';
      return <span className={`text-sm tabular-nums font-medium ${color}`}>{pct}%</span>;
    }},
    { key: 'status', label: 'Status', sortable: true, render: (item: any) => { const cfg = aiScanStatusConfig[item.status as AiScanStatus]; return <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>; }},
    { key: 'userName', label: 'User', sortable: true },
    { key: 'storeName', label: 'Store', sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="AI Scans" subtitle="Label recognition history and product matching results" icon={Bot} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Scans', value: totalScans, icon: Bot },
          { label: 'Confirmed', value: `${confirmed}/${totalScans}`, icon: CheckCircle2 },
          { label: 'Avg Confidence', value: `${avgConfidence}%`, icon: AlertTriangle },
          { label: 'Avg Processing', value: `${avgTime}ms`, icon: Clock },
        ].map((s) => (
          <Card key={s.label} className="rounded-xl border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <s.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(aiScanStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="w-[180px] h-8 text-sm"><SelectValue placeholder="All Stores" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <SimpleDataTable data={filtered} columns={columns} keyField="id" emptyMessage="No AI scans found" />
    </div>
  );
}
