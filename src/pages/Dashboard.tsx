import { useAuthStore } from '@/stores/authStore';
import { mockWines, mockMovements } from '@/data/mockWines';
import { useNavigate } from 'react-router-dom';
import {
  Wine, Package, AlertTriangle, Users, Clock, Scan, Search, Camera,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

function StatCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="stat-card text-left w-full">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color || 'bg-primary/15 text-primary'}`}>
          <Icon className="w-5 h-5" />
        </div>
        {onClick && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
      </div>
      <p className="text-2xl font-bold font-heading">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </button>
  );
}

function MethodBadge({ method }: { method: string }) {
  const config: Record<string, { label: string; icon: any; cls: string }> = {
    manual: { label: 'Search', icon: Search, cls: 'bg-secondary text-secondary-foreground' },
    barcode: { label: 'Barcode', icon: Scan, cls: 'bg-primary/15 text-primary' },
    image_ai: { label: 'Image AI', icon: Camera, cls: 'bg-accent/15 text-accent' },
  };
  const c = config[method] || config.manual;
  return (
    <span className={`wine-badge ${c.cls}`}>
      <c.icon className="w-3 h-3 mr-1" />
      {c.label}
    </span>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const totalWines = mockWines.filter(w => w.isActive).length;
  const totalStock = mockWines.reduce((s, w) => s + w.stockUnopened + w.stockOpened, 0);
  const lowStock = mockWines.filter(w => (w.stockUnopened + w.stockOpened) > 0 && (w.stockUnopened + w.stockOpened) < w.minStockLevel).length;
  const outOfStock = mockWines.filter(w => (w.stockUnopened + w.stockOpened) === 0).length;
  const totalValue = mockWines.reduce((s, w) => s + (w.stockUnopened + w.stockOpened) * w.price, 0);

  const movements = isAdmin ? mockMovements : mockMovements.filter(m => m.userId === user?.id);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">
          {isAdmin ? 'Admin Dashboard' : `Welcome, ${user?.displayName?.split(' ')[0]}!`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'Complete overview of your wine inventory' : 'Ready to count inventory'}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <StatCard icon={Wine} label="Wines in Catalog" value={totalWines} onClick={() => navigate('/catalog')} />
        {isAdmin && (
          <>
            <StatCard icon={Package} label="Total Bottles" value={totalStock.toLocaleString()} sub={`Value: $${totalValue.toLocaleString()}`} onClick={() => navigate('/stock')} />
            <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock} sub={`${outOfStock} out of stock`} color="bg-wine-warning/15 text-wine-warning" onClick={() => navigate('/stock')} />
            <StatCard icon={Users} label="Active Staff" value={3} color="bg-wine-success/15 text-wine-success" onClick={() => navigate('/users')} />
          </>
        )}
        {!isAdmin && (
          <StatCard icon={TrendingUp} label="My Counts Today" value={movements.length} />
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={() => navigate('/count')}
          className="h-16 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
        >
          <Wine className="w-5 h-5 mr-2" />
          Start Inventory Count
        </Button>
        {isAdmin && (
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/stock')}
              className="h-16 text-lg font-semibold border-border hover:bg-card"
            >
              <Package className="w-5 h-5 mr-2" />
              View Current Stock
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/catalog')}
              className="h-16 text-lg font-semibold border-border hover:bg-card"
            >
              <Wine className="w-5 h-5 mr-2" />
              Manage Catalog
            </Button>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold">Recent Activity</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')} className="text-accent">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="space-y-3">
          {movements.slice(0, 5).map((m) => (
            <div key={m.id} className="wine-glass-effect rounded-lg p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-accent">
                {m.userName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {isAdmin && <span className="text-accent">{m.userName}</span>}
                  {isAdmin && ' counted '}
                  {!isAdmin && 'You counted '}
                  <span className="text-foreground">{m.wineName}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <MethodBadge method={m.method} />
                  <span className="text-xs text-muted-foreground">
                    {m.unopened + m.opened} bottles
                  </span>
                  {m.confidence && (
                    <span className="text-xs text-accent">{m.confidence}% match</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3 inline mr-1" />
                {timeAgo(m.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
