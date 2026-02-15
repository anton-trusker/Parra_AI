import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  counts?: Record<string, number>;
}

export default function MultiSelectFilter({ label, options, selected, onChange, className, counts }: MultiSelectFilterProps) {
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

  const selectAll = () => {
    onChange([...options]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-sm font-medium transition-all duration-200',
            selected.length > 0
              ? 'bg-primary/10 text-primary border border-primary/30 shadow-sm'
              : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/30',
            className
          )}
        >
          {label}
          {selected.length > 0 && (
            <span className="min-w-[20px] h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1.5">
              {selected.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0 bg-popover border-border shadow-xl" sideOffset={8}>
        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8 pl-8 text-xs bg-muted/30 border-border/60 focus:bg-card"
            />
          </div>
        </div>

        {/* Options */}
        <div className="max-h-56 overflow-y-auto p-1.5">
          {filtered.map(option => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-left transition-colors',
                  isSelected ? 'bg-primary/8 text-foreground' : 'hover:bg-muted/50 text-foreground'
                )}
                onClick={() => toggle(option)}
              >
                <div className={cn(
                  'flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0',
                  isSelected ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className="text-sm truncate flex-1">{option}</span>
                {counts && counts[option] != null && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">{counts[option]}</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No options found</p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-2 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2" onClick={selectAll}>
            Select all
          </Button>
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground px-2 gap-1" onClick={clearAll}>
              <X className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
