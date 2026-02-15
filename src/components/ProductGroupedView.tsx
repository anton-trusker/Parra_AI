import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Package, MoreHorizontal, Eye, Copy, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Product } from '@/hooks/useProducts';

interface ProductGroupedViewProps {
  products: Product[];
  mode: 'category' | 'type' | 'store';
}

function TypeBadge({ type }: { type: string | null }) {
  const colors: Record<string, string> = {
    GOODS: 'bg-emerald-500/20 text-emerald-400',
    DISH: 'bg-amber-500/20 text-amber-400',
    MODIFIER: 'bg-sky-500/20 text-sky-400',
    OUTER: 'bg-purple-500/20 text-purple-400',
    PREPARED: 'bg-orange-500/20 text-orange-400',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[type || ''] || 'bg-secondary text-secondary-foreground'}`}>{type || '—'}</span>;
}

function StockIndicator({ stock }: { stock: number | null }) {
  if (stock === null || stock === undefined) return <span className="text-muted-foreground">—</span>;
  if (stock <= 0) return <span className="text-destructive font-medium">{stock}</span>;
  if (stock < 5) return <span className="text-amber-400 font-medium">{stock}</span>;
  return <span className="text-emerald-400 font-medium">{stock}</span>;
}

function ProductRowActions({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => navigate(`/products/${product.id}`)}><Eye className="w-3.5 h-3.5 mr-2" />View Details</DropdownMenuItem>
        <DropdownMenuItem><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem><History className="w-3.5 h-3.5 mr-2" />View History</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GroupRow({ label, count, totalStock, isExpanded, onToggle }: {
  label: string; count: number; totalStock: number; isExpanded: boolean; onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onToggle}
    >
      {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      <span className="font-medium text-sm">{label}</span>
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 ml-1">
        <Package className="w-3 h-3 mr-0.5" />{count}
      </Badge>
      <span className="ml-auto text-xs text-muted-foreground tabular-nums">Stock: {totalStock}</span>
    </div>
  );
}

function ProductRow({ product }: { product: Product }) {
  const navigate = useNavigate();
  return (
    <div
      className="flex items-center gap-3 px-4 pl-10 py-2 border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
      onClick={() => navigate(`/products/${product.id}`)}
    >
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{product.name}</span>
        <span className="text-xs text-muted-foreground">{product.sku || product.code || ''}</span>
      </div>
      <TypeBadge type={product.product_type} />
      <div className="w-16 text-right">
        <StockIndicator stock={product.current_stock} />
      </div>
      <div className="w-20 text-right text-sm text-accent tabular-nums">
        {product.sale_price?.toFixed(2) ?? '—'}
      </div>
      <ProductRowActions product={product} />
    </div>
  );
}

export default function ProductGroupedView({ products, mode }: ProductGroupedViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const groups = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      let key: string;
      if (mode === 'category') key = p.categories?.name || 'Uncategorized';
      else if (mode === 'type') key = p.product_type || 'Unknown';
      else key = 'All Stores'; // store mode simplified
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [products, mode]);

  // Start all expanded
  const allKeys = useMemo(() => groups.map(([k]) => k), [groups]);

  const toggleGroup = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(allKeys));
  const collapseAll = () => setExpanded(new Set());

  // Default: all expanded
  if (expanded.size === 0 && groups.length > 0 && allKeys.length > 0) {
    // First render: expand all
    setTimeout(() => setExpanded(new Set(allKeys)), 0);
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-2">
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={expandAll}>Expand All</Button>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={collapseAll}>Collapse All</Button>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="flex-1">Product</div>
          <div className="w-20">Type</div>
          <div className="w-16 text-right">Stock</div>
          <div className="w-20 text-right">Price</div>
          <div className="w-7" />
        </div>
        {groups.map(([groupName, groupProducts]) => (
          <div key={groupName}>
            <GroupRow
              label={groupName}
              count={groupProducts.length}
              totalStock={groupProducts.reduce((s, p) => s + (p.current_stock || 0), 0)}
              isExpanded={expanded.has(groupName)}
              onToggle={() => toggleGroup(groupName)}
            />
            {expanded.has(groupName) && groupProducts.map(p => (
              <ProductRow key={p.id} product={p} />
            ))}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No products to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
