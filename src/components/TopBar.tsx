import { useState } from 'react';
import { Search, Building2, Calendar, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { mockStores } from '@/data/mockStores';

export default function TopBar() {
  const [selectedStore, setSelectedStore] = useState('all');

  return (
    <header className="hidden lg:flex items-center justify-between gap-4 px-8 py-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
      {/* Left: Location switcher */}
      <div className="flex items-center gap-3">
        <Building2 className="w-4 h-4 text-muted-foreground" />
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[200px] h-8 text-sm border-border/50 bg-muted/30">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {mockStores.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right: Search trigger */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2 text-muted-foreground hover:text-foreground border-border/50 bg-muted/30 h-8 px-3"
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
