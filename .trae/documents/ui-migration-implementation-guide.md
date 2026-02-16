# UI Migration Implementation Guide

## Technical Changes Required

### 1. Database View Integration

The `v_stock_summary` view provides aggregated stock data with the following structure:
- `product_id` - Product identifier
- `name`, `sku`, `code` - Product details
- `category_id`, `category_name` - Category information
- `total_stock` - Sum of all warehouse stock
- `total_value` - Total inventory value
- `main_unit_id` - Primary measurement unit
- `purchase_price`, `sale_price` - Pricing information

### 2. Hook Modifications

#### Update useProducts Hook
```typescript
// Add stock data to product queries
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    categories(name),
    v_stock_summary!inner(
      total_stock,
      total_value
    )
  `)
  // ... existing filters
```

#### Create useStockSummary Hook
```typescript
export function useStockSummary(productIds?: string[]) {
  return useQuery({
    queryKey: ['stock_summary', productIds],
    queryFn: async () => {
      let query = supabase.from('v_stock_summary').select('*');
      
      if (productIds?.length) {
        query = query.in('product_id', productIds);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!productIds?.length,
  });
}
```

### 3. Component Updates

#### StockStatusBadge Component
```typescript
function StockStatusBadge({ stock }: { stock: number | null }) {
  const s = stock ?? 0;
  const getStatus = () => {
    if (s <= 0) return { text: 'Out', class: 'bg-destructive/15 text-destructive' };
    if (s < 5) return { text: 'Low', class: 'bg-amber-500/15 text-amber-600' };
    return { text: 'In Stock', class: 'bg-emerald-500/15 text-emerald-600' };
  };
  
  const status = getStatus();
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${status.class}`}>
      {status.text}
    </span>
  );
}
```

#### DataTable Stock Column
```typescript
{
  key: 'stock',
  label: 'Stock',
  align: 'right' as const,
  render: (p: Product) => (
    <div className="flex items-center justify-end gap-2">
      <span className="text-sm font-medium">{p.total_stock ?? 0}</span>
      <StockStatusBadge stock={p.total_stock} />
    </div>
  )
}
```

### 4. Store/Warehouse Selection

#### Add Warehouse Filter
```typescript
const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

// In component
<Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="All Warehouses" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Warehouses</SelectItem>
    {warehouses.map(w => (
      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Filter Products by Warehouse
```typescript
const filteredProducts = useMemo(() => {
  let result = products;
  
  if (selectedWarehouse && selectedWarehouse !== 'all') {
    // Filter products that have stock in selected warehouse
    result = result.filter(p => {
      const warehouseStock = p.stock_levels?.find(sl => sl.store_id === selectedWarehouse);
      return warehouseStock && warehouseStock.quantity > 0;
    });
  }
  
  return result;
}, [products, selectedWarehouse]);
```

### 5. Stock Level Details

#### Warehouse Stock Breakdown
```typescript
function WarehouseStockBreakdown({ product }: { product: Product }) {
  if (!product.stock_levels?.length) return null;
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Stock by Warehouse</h4>
      {product.stock_levels.map(level => (
        <div key={level.store_id} className="flex justify-between items-center py-1">
          <span className="text-sm text-muted-foreground">
            {level.store_name || level.store_id}
          </span>
          <span className="text-sm font-medium">
            {level.quantity} {level.measurement_units?.short_name}
          </span>
        </div>
      ))}
    </div>
  );
}
```

## Implementation Priority

1. **High Priority** (Week 1)
   - Update useProducts hook to use v_stock_summary
   - Replace current_stock with total_stock in main UI
   - Update StockStatusBadge component
   - Test basic functionality

2. **Medium Priority** (Week 2)
   - Add warehouse selection filter
   - Implement stock_levels detailed view
   - Update ProductDetail page
   - Add warehouse stock breakdown

3. **Low Priority** (Week 3)
   - Performance optimization
   - Advanced filtering options
   - Stock value calculations
   - Export functionality updates

## Code Quality Considerations

### Type Safety
```typescript
interface StockSummary {
  product_id: string;
  name: string;
  sku: string | null;
  code: string | null;
  category_name: string | null;
  total_stock: number;
  total_value: number;
  main_unit_id: string | null;
}

interface ProductWithStock extends Product {
  total_stock?: number;
  total_value?: number;
  stock_levels?: StockLevel[];
}
```

### Error Handling
```typescript
const { data, error } = await query;
if (error) {
  console.error('Failed to fetch stock summary:', error);
  toast.error('Unable to load stock information');
  return [];
}
return data || [];
```

### Loading States
```typescript
const { data: products, isLoading: productsLoading } = useProducts();
const { data: stockSummary, isLoading: stockLoading } = useStockSummary();

const isLoading = productsLoading || stockLoading;

if (isLoading) {
  return <Skeleton className="h-[400px] w-full" />;
}
```

## Testing Strategy

### Unit Tests
- Test stock calculation logic
- Test warehouse filtering
- Test stock status badge rendering
- Test data transformation functions

### Integration Tests
- Test v_stock_summary view performance
- Test stock_levels data integrity
- Test multi-warehouse scenarios
- Test stock value calculations

### User Acceptance Tests
- Verify stock display accuracy
- Test warehouse selection functionality
- Validate stock filtering behavior
- Confirm mobile responsiveness