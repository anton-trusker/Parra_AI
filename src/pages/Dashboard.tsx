import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Package, AlertTriangle, Users, Clock,
  TrendingUp, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isMobile = useIsMobile();
  const { data: hideScannerDesktop } = useAppSetting('inventory_hide_scanner_desktop', false);
  const shouldHideScanner = !isMobile && hideScannerDesktop === true;

  const { data: products = [] } = useProducts();
  const { data: userCount } = useQuery({
    queryKey: ['user_count_dashboard'],
    queryFn: async () => {
      const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
      return count || 0;
    },
  });

  const totalProducts = products.filter(p => p.is_active).length;
  const totalStock = products.reduce((s, p) => s + (Number(p.current_stock) || 0), 0);
  const lowStock = products.filter(p => (Number(p.current_stock) || 0) > 0 && (Number(p.current_stock) || 0) < 5).length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">
          {isAdmin ? 'Admin Dashboard' : `Welcome, ${user?.displayName?.split(' ')[0]}!`}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isAdmin ? 'Complete overview of your inventory' : 'Ready to count inventory'}
        </p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isAdmin ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2'}`}>
        <StatCard icon={Package} label="Products" value={totalProducts} onClick={() => navigate('/products')} />
        {isAdmin && (
          <>
            <StatCard icon={Package} label="Total Stock" value={totalStock.toLocaleString()} onClick={() => navigate('/stock')} />
            <StatCard icon={AlertTriangle} label="Low Stock" value={lowStock} color="bg-wine-warning/15 text-wine-warning" onClick={() => navigate('/stock')} />
            <StatCard icon={Users} label="Active Users" value={userCount ?? '—'} color="bg-wine-success/15 text-wine-success" onClick={() => navigate('/users')} />
          </>
        )}
        {!isAdmin && (
          <StatCard icon={TrendingUp} label="My Counts Today" value={0} />
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!shouldHideScanner && (
          <Button
            onClick={() => navigate('/count')}
            className="h-16 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
          >
            <Package className="w-5 h-5 mr-2" />
            Start Inventory Count
          </Button>
        )}
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
              onClick={() => navigate('/products')}
              className="h-16 text-lg font-semibold border-border hover:bg-card"
            >
              <Package className="w-5 h-5 mr-2" />
              Product Catalog
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
