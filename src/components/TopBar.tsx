import { useState } from 'react';
import { Search, Warehouse, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useStores } from '@/hooks/useStores';

export default function TopBar() {
  const [selectedStore, setSelectedStore] = useState('all');
  const { data: stores = [] } = useStores();

  return (
    <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Warehouse className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[220px] h-9 text-sm border-border/50 bg-muted/30">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {stores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-foreground border-border/50 bg-muted/30 h-9 px-4"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="ml-2 hidden sm:inline-flex items-center gap-0.5 rounded border border-border/50 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
          <Command className="w-2.5 h-2.5" /> K
        </kbd>
      </Button>
    </header>
  );
}
