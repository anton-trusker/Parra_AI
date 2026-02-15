import { ShoppingCart, Clock, TrendingUp, Store } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

const futureFeatures = [
  { title: 'Real-time order tracking', desc: 'Monitor live orders from all POS terminals and delivery channels' },
  { title: 'Sales analytics', desc: 'Product-level sales breakdowns, peak hours analysis, and revenue trends' },
  { title: 'Inventory impact', desc: 'Automatic stock deduction and consumption tracking per order' },
  { title: 'Multi-channel support', desc: 'Aggregated orders from dine-in, takeaway, and delivery platforms' },
];

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Orders" subtitle="Order management and sales tracking" icon={ShoppingCart} />

      <Tabs defaultValue="live" className="space-y-4">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="live" disabled className="gap-2 opacity-60"><Clock className="w-4 h-4" />Live Orders</TabsTrigger>
          <TabsTrigger value="history" disabled className="gap-2 opacity-60"><ShoppingCart className="w-4 h-4" />Historical Orders</TabsTrigger>
          <TabsTrigger value="sales" disabled className="gap-2 opacity-60"><TrendingUp className="w-4 h-4" />Sales by Product</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <EmptyState
            icon={ShoppingCart}
            title="Orders Coming Soon"
            description="Real-time order tracking and sales analytics will be available once the Syrve order sync integration is enabled."
          />
        </TabsContent>
      </Tabs>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Planned Features</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {futureFeatures.map(f => (
            <Card key={f.title} className="rounded-xl border-border/60 opacity-60">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
