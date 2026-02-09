import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Wine, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Reports() {
  const { user } = useAuthStore();
  if (user?.roleId !== 'role_admin') return <Navigate to="/dashboard" replace />;

  const reportTypes = [
    { icon: BarChart3, title: 'Stock Summary', desc: 'Current stock levels across all wines', color: 'text-primary' },
    { icon: TrendingUp, title: 'Inventory Trends', desc: 'Stock movement patterns over time', color: 'text-accent' },
    { icon: Wine, title: 'Consumption Report', desc: 'Wine consumption analysis by period', color: 'text-wine-gold' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-heading font-bold">Analytics & Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map(r => (
          <div key={r.title} className="wine-glass-effect rounded-xl p-6">
            <r.icon className={`w-10 h-10 mb-4 ${r.color}`} />
            <h3 className="font-heading text-lg font-semibold mb-1">{r.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{r.desc}</p>
            <Button variant="outline" size="sm" className="border-border">
              <Download className="w-4 h-4 mr-2" /> Generate
            </Button>
          </div>
        ))}
      </div>
      <div className="wine-glass-effect rounded-xl p-12 text-center">
        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="font-heading text-xl font-semibold mb-2">Reports Coming Soon</h2>
        <p className="text-muted-foreground">Connect your backend to enable real-time analytics and reporting</p>
      </div>
    </div>
  );
}
