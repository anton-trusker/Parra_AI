import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Eye, Copy, XCircle, Send, MoreHorizontal } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { mockInventoryChecks, checkStatusConfig, type CheckStatus } from '@/data/mockInventoryChecks';

export default function InventoryChecksPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');

  const filtered = mockInventoryChecks.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (storeFilter !== 'all' && c.storeId !== storeFilter) return false;
    return true;
  });

  const stores = [...new Set(mockInventoryChecks.map((c) => c.storeName))];

  const columns = [
    { key: 'title', label: 'Title', sortable: true, render: (item: any) => (
      <button onClick={() => navigate(`/inventory/checks/${item.id}`)} className="text-left font-medium text-foreground hover:text-primary transition-colors">{item.title}</button>
    )},
    { key: 'storeName', label: 'Store', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (item: any) => {
      const cfg = checkStatusConfig[item.status as CheckStatus];
      return <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>;
    }},
    { key: 'createdBy', label: 'Created By', sortable: true },
    { key: 'startedAt', label: 'Started', sortable: true, render: (item: any) => item.startedAt ? <span className="text-xs text-muted-foreground">{new Date(item.startedAt).toLocaleDateString()}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'completedAt', label: 'Completed', sortable: true, render: (item: any) => item.completedAt ? <span className="text-xs text-muted-foreground">{new Date(item.completedAt).toLocaleDateString()}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'progress', label: 'Progress', sortable: false, render: (item: any) => {
      const pct = item.totalItems > 0 ? Math.round((item.countedItems / item.totalItems) * 100) : 0;
      return (
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
          <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      );
    }},
    { key: 'actions', label: '', sortable: false, render: (item: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
          <DropdownMenuItem><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
          {item.status === 'approved' && <DropdownMenuItem><Send className="w-4 h-4 mr-2" />Send to Syrve</DropdownMenuItem>}
          {['draft', 'in_progress'].includes(item.status) && <DropdownMenuItem className="text-destructive"><XCircle className="w-4 h-4 mr-2" />Cancel</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory Checks" subtitle="Manage stock counting sessions across all locations" icon={ClipboardCheck} actions={<Button size="sm" className="gap-2"><Plus className="w-4 h-4" />New Check</Button>} />
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-8 text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(checkStatusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={storeFilter} onValueChange={setStoreFilter}>
          <SelectTrigger className="w-[180px] h-8 text-sm"><SelectValue placeholder="All Stores" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stores</SelectItem>
            {stores.map((s) => <SelectItem key={s} value={mockInventoryChecks.find((c) => c.storeName === s)?.storeId ?? s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <SimpleDataTable data={filtered} columns={columns} keyField="id" emptyMessage="No inventory checks found" />
    </div>
  );
}
