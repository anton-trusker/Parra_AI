import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export default function MultiSelectFilter({ label, options, selected, onChange, className }: MultiSelectFilterProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(q));
  }, [options, search]);

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const clearAll = () => {
    onChange([]);
    setSearch('');
  };

  const isAllSelected = selected.length === 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 h-9 px-3 rounded-md border text-sm transition-colors',
            selected.length > 0
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:text-foreground',
            className
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {selected.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-0 bg-popover border-border">
        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 pl-8 text-xs bg-secondary border-border"
            />
          </div>
        </div>

        {/* Options */}
        <div className="max-h-48 overflow-y-auto p-1.5">
          <label
            className="flex items-center gap-2 cursor-pointer rounded-md p-1.5 hover:bg-secondary/50 transition-colors"
            onClick={clearAll}
          >
            <Checkbox
              checked={isAllSelected}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm font-medium">All {label}</span>
          </label>
          {filtered.map(option => (
            <label
              key={option}
              className="flex items-center gap-2 cursor-pointer rounded-md p-1.5 hover:bg-secondary/50 transition-colors"
            >
              <Checkbox
                checked={selected.includes(option)}
                onCheckedChange={() => toggle(option)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm truncate">{option}</span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No options found</p>
          )}
        </div>

        {/* Footer */}
        {selected.length > 0 && (
          <div className="border-t border-border p-2">
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground" onClick={clearAll}>
              <X className="w-3 h-3 mr-1" /> Clear selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
