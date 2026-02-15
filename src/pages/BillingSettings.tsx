import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Zap, Receipt, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import SimpleDataTable from '@/components/SimpleDataTable';

const mockPlan = {
  name: 'Professional',
  price: '$49/mo',
  nextBilling: '2026-03-15',
  features: ['Unlimited products', 'Up to 5 stores', '500 AI scans/mo', 'Priority support'],
};

const mockAiUsage = { used: 127, limit: 500 };

const mockInvoices = [
  { id: 'inv-001', date: '2026-02-01', amount: '$49.00', status: 'Paid', period: 'Feb 2026' },
  { id: 'inv-002', date: '2026-01-01', amount: '$49.00', status: 'Paid', period: 'Jan 2026' },
  { id: 'inv-003', date: '2025-12-01', amount: '$49.00', status: 'Paid', period: 'Dec 2025' },
  { id: 'inv-004', date: '2025-11-01', amount: '$49.00', status: 'Paid', period: 'Nov 2025' },
];

const invoiceColumns = [
  { key: 'period', label: 'Period', sortable: true },
  { key: 'date', label: 'Date', sortable: true, render: (item: any) => <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span> },
  { key: 'amount', label: 'Amount', sortable: false },
  { key: 'status', label: 'Status', sortable: false, render: (item: any) => <Badge variant="secondary" className="text-xs">{item.status}</Badge> },
];

export default function BillingSettings() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">Billing</span>
      </div>

      <h1 className="text-2xl lg:text-3xl font-heading font-bold">Billing & Usage</h1>

      {/* Current Plan */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">{mockPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{mockPlan.price}</p>
              </div>
            </div>
            <Badge className="bg-primary/15 text-primary border-0">Active</Badge>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {mockPlan.features.map(f => (
              <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-sm text-muted-foreground">Next billing: {new Date(mockPlan.nextBilling).toLocaleDateString()}</span>
            <Button variant="outline" size="sm" disabled>Upgrade Plan</Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Usage */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">AI Usage This Month</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Scans used</span>
              <span className="font-medium tabular-nums">{mockAiUsage.used} / {mockAiUsage.limit}</span>
            </div>
            <Progress value={(mockAiUsage.used / mockAiUsage.limit) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">{mockAiUsage.limit - mockAiUsage.used} scans remaining this billing period</p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-sm">Payment Method</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">VISA</div>
              <span className="text-sm">•••• •••• •••• 4242</span>
            </div>
            <Button variant="ghost" size="sm" disabled>Update</Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="rounded-xl border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-heading font-semibold text-sm">Invoice History</h3>
          </div>
          <SimpleDataTable data={mockInvoices} columns={invoiceColumns} keyField="id" emptyMessage="No invoices" />
        </CardContent>
      </Card>
    </div>
  );
}
