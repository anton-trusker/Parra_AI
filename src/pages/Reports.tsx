import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, Download, PieChart, CalendarDays } from 'lucide-react';
import EmptyState from '@/components/EmptyState';

export default function Reports() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  const reportTypes = [
    { icon: BarChart3, title: 'Stock Summary', desc: 'Current stock levels across all products', color: 'bg-primary/10 text-primary' },
    { icon: TrendingUp, title: 'Inventory Trends', desc: 'Stock movement patterns over time', color: 'bg-accent/10 text-accent' },
    { icon: Package, title: 'Consumption Report', desc: 'Product consumption analysis by period', color: 'bg-[hsl(var(--wine-success))]/10 text-[hsl(var(--wine-success))]' },
    { icon: PieChart, title: 'Variance Analysis', desc: 'Detailed variance breakdown per session', color: 'bg-[hsl(var(--wine-warning))]/10 text-[hsl(var(--wine-warning))]' },
    { icon: CalendarDays, title: 'Scheduled Reports', desc: 'Automated reports on a schedule', color: 'bg-secondary text-secondary-foreground' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Generate insights from your inventory data</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {reportTypes.map(r => (
          <div key={r.title} className="rounded-xl border border-border bg-card p-5 opacity-60 cursor-not-allowed">
            <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center mb-4`}>
              <r.icon className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-sm font-semibold mb-1">{r.title}</h3>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </div>

      <EmptyState
        icon={BarChart3}
        title="Reports Coming Soon"
        description="Connect your data sources to enable real-time analytics and reporting dashboards."
      />
    </div>
  );
}
