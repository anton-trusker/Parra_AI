import { useState, useMemo } from 'react';
import { mockWines } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Search, Download, Filter, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type SortOption = 'name' | 'stock' | 'value' | 'location';

export default function CurrentStock() {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [showFilters, setShowFilters] = useState(false);

  const totalValue = mockWines.reduce((s, w) => s + (w.stockUnopened + w.stockOpened) * w.price, 0);

  const locations = useMemo(() => [...new Set(mockWines.filter(w => w.isActive && w.cellarSection).map(w => w.cellarSection!))].sort(), []);

  const filtered = useMemo(() => {
    let wines = mockWines.filter(w => {
      if (!w.isActive) return false;
      const total = w.stockUnopened + w.stockOpened;
      if (statusFilter === 'in-stock' && total < w.minStockLevel) return false;
      if (statusFilter === 'low' && (total >= w.minStockLevel || total === 0)) return false;
      if (statusFilter === 'out' && total > 0) return false;
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (locationFilter !== 'all' && w.cellarSection !== locationFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) || w.producer.toLowerCase().includes(q);
      }
      return true;
    });

    wines.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'stock': return (b.stockUnopened + b.stockOpened) - (a.stockUnopened + a.stockOpened);
        case 'value': return ((b.stockUnopened + b.stockOpened) * b.price) - ((a.stockUnopened + a.stockOpened) * a.price);
        case 'location': return (a.location || '').localeCompare(b.location || '');
        default: return 0;
      }
    });

    return wines;
  }, [search, statusFilter, typeFilter, locationFilter, sortBy]);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const getRowBg = (total: number, min: number) => {
    if (total === 0) return 'bg-destructive/5';
    if (total < min) return 'bg-[hsl(var(--wine-warning)/0.05)]';
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Current Stock</h1>
          <p className="text-muted-foreground mt-1">
            Total Value: <span className="text-accent font-semibold">${totalValue.toLocaleString()}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-border" onClick={() => toast.info('Export coming soon')}>
          <Download className="w-4 h-4 mr-2" /> Export
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search wine..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-11 bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="in-stock">In Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-11 w-11 border-border" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 animate-fade-in">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-10 bg-card border-border text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {['Red', 'White', 'Rosé', 'Sparkling'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border text-sm"><SelectValue placeholder="Location" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-10 bg-card border-border text-sm"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="stock">Stock Level</SelectItem>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filtered.map(w => {
          const total = w.stockUnopened + w.stockOpened;
          const value = total * w.price;
          let statusCls = 'stock-healthy';
          let statusLabel = '✓ In Stock';
          if (total === 0) { statusCls = 'stock-out'; statusLabel = '✗ Out'; }
          else if (total < w.minStockLevel) { statusCls = 'stock-low'; statusLabel = '⚠ Low'; }
          return (
            <div key={w.id} className={`wine-glass-effect rounded-xl p-4 ${getRowBg(total, w.minStockLevel)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.producer} • {w.vintage || 'NV'} • {w.volume}ml</p>
                </div>
                <span className={`wine-badge ${statusCls} ml-2 whitespace-nowrap`}>{statusLabel}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-3">
                <div className="text-center"><p className="text-xs text-muted-foreground">Closed</p><p className="font-semibold">{w.stockUnopened}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Open</p><p className="font-semibold">{w.stockOpened}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-foreground">{total}</p></div>
                <div className="text-center"><p className="text-xs text-muted-foreground">Value</p><p className="font-semibold text-accent">${value.toLocaleString()}</p></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>Par: {w.minStockLevel}</span>
                <span>{w.location}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block wine-glass-effect rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-4 font-medium">Wine</th>
                <th className="text-left p-4 font-medium">Vintage</th>
                <th className="text-left p-4 font-medium">Size</th>
                <th className="text-center p-4 font-medium">Closed</th>
                <th className="text-center p-4 font-medium">Open</th>
                <th className="text-center p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Par</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Value</th>
                <th className="text-left p-4 font-medium">Location</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => {
                const total = w.stockUnopened + w.stockOpened;
                const value = total * w.price;
                let statusCls = 'stock-healthy';
                let statusLabel = '✓ In Stock';
                if (total === 0) { statusCls = 'stock-out'; statusLabel = '✗ Out'; }
                else if (total < w.minStockLevel) { statusCls = 'stock-low'; statusLabel = '⚠ Low'; }
                return (
                  <tr key={w.id} className={`border-b border-border/50 hover:bg-wine-surface-hover transition-colors ${getRowBg(total, w.minStockLevel)}`}>
                    <td className="p-4"><p className="font-medium">{w.name}</p><p className="text-xs text-muted-foreground">{w.producer}</p></td>
                    <td className="p-4">{w.vintage || 'NV'}</td>
                    <td className="p-4 text-muted-foreground">{w.volume}ml</td>
                    <td className="p-4 text-center font-medium">{w.stockUnopened}</td>
                    <td className="p-4 text-center text-muted-foreground">{w.stockOpened}</td>
                    <td className="p-4 text-center font-semibold">{total}</td>
                    <td className="p-4 text-center text-muted-foreground">{w.minStockLevel}</td>
                    <td className="p-4"><span className={`wine-badge ${statusCls}`}>{statusLabel}</span></td>
                    <td className="p-4 text-right text-accent">${value.toLocaleString()}</td>
                    <td className="p-4 text-xs text-muted-foreground">{w.location}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
