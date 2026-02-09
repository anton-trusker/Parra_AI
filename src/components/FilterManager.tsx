import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

export interface FilterDef {
  key: string;
  label: string;
}

interface FilterManagerProps {
  filters: FilterDef[];
  visibleFilters: string[];
  onChange: (visible: string[]) => void;
}

export default function FilterManager({ filters, visibleFilters, onChange }: FilterManagerProps) {
  const toggle = (key: string) => {
    if (visibleFilters.includes(key)) {
      onChange(visibleFilters.filter(k => k !== key));
    } else {
      onChange([...visibleFilters, key]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground gap-1.5" title="Configure filters">
          <Settings2 className="w-3.5 h-3.5" />
          Configure
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-3 bg-popover border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Visible Filters</p>
        <div className="space-y-2">
          {filters.map(f => (
            <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 rounded-md p-1.5 -mx-1 transition-colors">
              <Checkbox
                checked={visibleFilters.includes(f.key)}
                onCheckedChange={() => toggle(f.key)}
                className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm">{f.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
