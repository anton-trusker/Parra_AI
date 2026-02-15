import { ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
            actionLabel="Learn More"
            onAction={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
