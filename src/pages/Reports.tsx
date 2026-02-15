import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, Package, PieChart, CalendarDays, Bot, AlertTriangle, Users } from 'lucide-react';

const reportSections = [
  {
    title: 'Inventory Reports',
    reports: [
      { icon: BarChart3, title: 'Stock Summary', desc: 'Current stock levels across all products and stores', color: 'bg-primary/10 text-primary' },
      { icon: TrendingUp, title: 'Inventory Trends', desc: 'Stock movement patterns and consumption over time', color: 'bg-primary/10 text-primary' },
      { icon: Package, title: 'Consumption Report', desc: 'Product consumption analysis by period and category', color: 'bg-primary/10 text-primary' },
    ],
  },
  {
    title: 'Variance Reports',
    reports: [
      { icon: PieChart, title: 'Variance Analysis', desc: 'Detailed variance breakdown per session and store', color: 'bg-amber-500/10 text-amber-500' },
      { icon: AlertTriangle, title: 'Shrinkage Report', desc: 'Track unaccounted losses and write-offs', color: 'bg-amber-500/10 text-amber-500' },
    ],
  },
  {
    title: 'AI Usage Reports',
    reports: [
      { icon: Bot, title: 'AI Recognition Stats', desc: 'Scan volumes, accuracy rates, and model performance', color: 'bg-emerald-500/10 text-emerald-500' },
      { icon: Bot, title: 'AI Cost Analysis', desc: 'Token usage, costs per scan, and optimization tips', color: 'bg-emerald-500/10 text-emerald-500' },
    ],
  },
  {
    title: 'Operational Reports',
    reports: [
      { icon: Users, title: 'Staff Activity', desc: 'Counting speed, accuracy, and productivity metrics', color: 'bg-secondary text-secondary-foreground' },
      { icon: CalendarDays, title: 'Scheduled Reports', desc: 'Automated reports delivered on a schedule', color: 'bg-secondary text-secondary-foreground' },
    ],
  },
];

export default function Reports() {
  const { user } = useAuthStore();
  if (user?.role !== 'admin' && user?.role !== 'super_admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Analytics & Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">Generate insights from your inventory data</p>
      </div>

      {reportSections.map(section => (
        <div key={section.title}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{section.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.reports.map(r => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-5 opacity-60 cursor-not-allowed">
                <div className={`w-10 h-10 rounded-xl ${r.color} flex items-center justify-center mb-4`}>
                  <r.icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading text-sm font-semibold mb-1">{r.title}</h3>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Reports will be available once sufficient data has been collected.</p>
      </div>
    </div>
  );
}
