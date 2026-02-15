import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Plus, Eye, Copy, XCircle, Send, MoreHorizontal, Search, Play, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import SimpleDataTable from '@/components/SimpleDataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { mockInventoryChecks, checkStatusConfig, type CheckStatus } from '@/data/mockInventoryChecks';
import EmptyState from '@/components/EmptyState';

export default function InventoryChecksPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = mockInventoryChecks.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (storeFilter !== 'all' && c.storeId !== storeFilter) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stores = [...new Set(mockInventoryChecks.map((c) => c.storeName))];

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const getStatusActions = (item: any) => {
    switch (item.status) {
      case 'draft':
        return (
          <>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Play className="w-4 h-4 mr-2" />Start</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive"><XCircle className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
          </>
        );
      case 'in_progress':
        return (
          <>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Play className="w-4 h-4 mr-2" />Join Counting</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
          </>
        );
      case 'pending_review':
        return (
          <>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />Review</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
          </>
        );
      case 'approved':
        return (
          <>
            <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />View</DropdownMenuItem>
            <DropdownMenuItem><FileText className="w-4 h-4 mr-2" />Export</DropdownMenuItem>
            <DropdownMenuItem><Send className="w-4 h-4 mr-2" />Send to Syrve</DropdownMenuItem>
          </>
        );
      default:
        return (
          <DropdownMenuItem onClick={() => navigate(`/inventory/checks/${item.id}`)}><Eye className="w-4 h-4 mr-2" />View Details</DropdownMenuItem>
        );
    }
  };

  const columns = [
    { key: 'title', label: 'Title', sortable: true, render: (item: any) => (
      <button onClick={() => navigate(`/inventory/checks/${item.id}`)} className="text-left font-medium text-foreground hover:text-primary transition-colors">{item.title}</button>
    )},
    { key: 'storeName', label: 'Store', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (item: any) => {
      const cfg = checkStatusConfig[item.status as CheckStatus];
      return <Badge className={`${cfg.color} border-0 text-xs`}>{cfg.label}</Badge>;
    }},
    { key: 'createdBy', label: 'Created By', sortable: true, render: (item: any) => (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{getInitials(item.createdBy)}</AvatarFallback>
        </Avatar>
        <span className="text-sm">{item.createdBy}</span>
      </div>
    )},
    { key: 'startedAt', label: 'Started', sortable: true, render: (item: any) => item.startedAt ? <span className="text-xs text-muted-foreground">{new Date(item.startedAt).toLocaleDateString()}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: 'progress', label: 'Progress', sortable: false, render: (item: any) => {
      const pct = item.totalItems > 0 ? Math.round((item.countedItems / item.totalItems) * 100) : 0;
      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={pct} className="h-1.5 flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">{pct}%</span>
        </div>
      );
    }},
    { key: 'actions', label: '', sortable: false, render: (item: any) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {getStatusActions(item)}
          <DropdownMenuItem><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
          {['draft', 'in_progress'].includes(item.status) && <DropdownMenuItem className="text-destructive"><XCircle className="w-4 h-4 mr-2" />Cancel</DropdownMenuItem>}
        </DropdownMenuContent>
      </DropdownMenu>
    )},
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Sessions"
        subtitle="Manage stock counting sessions across all locations"
        icon={ClipboardCheck}
        actions={<Button size="sm" className="gap-2" onClick={() => navigate('/count')}><Plus className="w-4 h-4" />New Session</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search sessions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-8 text-sm" />
        </div>
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No sessions found"
          description="Create a new session to start counting inventory"
          actionLabel="New Session"
          onAction={() => navigate('/count')}
        />
      ) : (
        <SimpleDataTable data={filtered} columns={columns} keyField="id" emptyMessage="No sessions found" />
      )}
    </div>
  );
}
