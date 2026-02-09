import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockWines, Wine } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Search, Plus, Filter, LayoutGrid, Table2, Wine as WineIcon, ImageOff, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function StockBadge({ wine }: { wine: Wine }) {
  const total = wine.stockUnopened + wine.stockOpened;
  if (total === 0) return <span className="wine-badge stock-out">Out of Stock</span>;
  if (total < wine.minStockLevel) return <span className="wine-badge stock-low">Low Stock</span>;
  return <span className="wine-badge stock-healthy">In Stock</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Red: 'bg-wine-red/20 text-wine-red-light',
    White: 'bg-wine-gold/20 text-wine-gold',
    Rosé: 'bg-pink-500/20 text-pink-400',
    Sparkling: 'bg-sky-500/20 text-sky-400',
    Fortified: 'bg-amber-600/20 text-amber-500',
    Dessert: 'bg-orange-500/20 text-orange-400',
  };
  return <span className={`wine-badge ${colors[type] || 'bg-secondary text-secondary-foreground'}`}>{type}</span>;
}

function WineCard({ wine, onClick, hideStock }: { wine: Wine; onClick: () => void; hideStock?: boolean }) {
  return (
    <div onClick={onClick} className="wine-glass-effect rounded-xl overflow-hidden group transition-all duration-300 hover:border-wine-gold/30 cursor-pointer">
      <div className="h-40 bg-secondary flex items-center justify-center relative overflow-hidden">
        {wine.hasImage ? (
          <div className="w-full h-full bg-gradient-to-b from-wine-burgundy/40 to-card flex items-center justify-center">
            <WineIcon className="w-12 h-12 text-wine-gold/40" />
          </div>
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImageOff className="w-8 h-8 mb-1" />
            <span className="text-xs">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <TypeBadge type={wine.type} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-base truncate">{wine.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{wine.producer}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <span>{wine.vintage || 'NV'}</span>
          <span>•</span>
          <span>{wine.volume}ml</span>
          <span>•</span>
          <span>{wine.region}</span>
        </div>
        {!hideStock && (
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-xs text-muted-foreground">{wine.stockUnopened}U + {wine.stockOpened}O</span>
            </div>
            <StockBadge wine={wine} />
          </div>
        )}
      </div>
    </div>
  );
}

type SortOption = 'name-asc' | 'name-desc' | 'producer' | 'vintage' | 'stock' | 'updated';

export default function WineCatalog() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [showFilters, setShowFilters] = useState(false);

  const countries = useMemo(() => [...new Set(mockWines.filter(w => w.isActive).map(w => w.country))].sort(), []);

  const filtered = useMemo(() => {
    let wines = mockWines.filter(w => {
      if (!w.isActive) return false;
      if (typeFilter !== 'all' && w.type !== typeFilter) return false;
      if (countryFilter !== 'all' && w.country !== countryFilter) return false;
      if (stockFilter !== 'all') {
        const total = w.stockUnopened + w.stockOpened;
        if (stockFilter === 'in-stock' && (total === 0 || total < w.minStockLevel)) return false;
        if (stockFilter === 'low' && (total >= w.minStockLevel || total === 0)) return false;
        if (stockFilter === 'out' && total > 0) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return w.name.toLowerCase().includes(q) ||
          w.producer.toLowerCase().includes(q) ||
          w.region.toLowerCase().includes(q) ||
          w.grapeVarieties.some(g => g.toLowerCase().includes(q));
      }
      return true;
    });

    // Sort
    wines.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'name-desc': return b.name.localeCompare(a.name);
        case 'producer': return a.producer.localeCompare(b.producer);
        case 'vintage': return (b.vintage || 0) - (a.vintage || 0);
        case 'stock': return (b.stockUnopened + b.stockOpened) - (a.stockUnopened + a.stockOpened);
        case 'updated': return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        default: return 0;
      }
    });

    return wines;
  }, [search, typeFilter, countryFilter, stockFilter, sortBy]);

  // Hide stock from staff
  const hideStock = !isAdmin;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Wine Catalog</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} wines</p>
        </div>
        {isAdmin && (
          <Button className="wine-gradient text-primary-foreground hover:opacity-90" onClick={() => navigate('/catalog/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Wine
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search wine, producer, region, grape..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-card border-border"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 bg-card border-border">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Red">Red</SelectItem>
              <SelectItem value="White">White</SelectItem>
              <SelectItem value="Rosé">Rosé</SelectItem>
              <SelectItem value="Sparkling">Sparkling</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-11 w-11 border-border" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView('cards')} className={`p-2.5 ${view === 'cards' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}>
              <LayoutGrid className="w-5 h-5" />
            </button>
            <button onClick={() => setView('table')} className={`p-2.5 ${view === 'table' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}>
              <Table2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-3 animate-fade-in">
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border text-sm">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border text-sm">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[160px] h-10 bg-card border-border text-sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="producer">Producer</SelectItem>
                <SelectItem value="vintage">Vintage (newest)</SelectItem>
                <SelectItem value="stock">Stock Level</SelectItem>
                <SelectItem value="updated">Last Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Cards View */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(wine => (
            <WineCard key={wine.id} wine={wine} hideStock={hideStock} onClick={() => navigate(`/catalog/${wine.id}`)} />
          ))}
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="wine-glass-effect rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Wine</th>
                  <th className="text-left p-4 font-medium">Producer</th>
                  <th className="text-left p-4 font-medium">Vintage</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Volume</th>
                  {!hideStock && <th className="text-left p-4 font-medium">Stock</th>}
                  {!hideStock && <th className="text-left p-4 font-medium">Status</th>}
                  {isAdmin && <th className="text-left p-4 font-medium">Price</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(wine => (
                  <tr key={wine.id} onClick={() => navigate(`/catalog/${wine.id}`)} className="border-b border-border/50 hover:bg-wine-surface-hover transition-colors cursor-pointer">
                    <td className="p-4 font-medium">{wine.name}</td>
                    <td className="p-4 text-muted-foreground">{wine.producer}</td>
                    <td className="p-4">{wine.vintage || 'NV'}</td>
                    <td className="p-4"><TypeBadge type={wine.type} /></td>
                    <td className="p-4 text-muted-foreground">{wine.volume}ml</td>
                    {!hideStock && <td className="p-4">{wine.stockUnopened}U + {wine.stockOpened}O</td>}
                    {!hideStock && <td className="p-4"><StockBadge wine={wine} /></td>}
                    {isAdmin && <td className="p-4 text-accent">${wine.price}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
