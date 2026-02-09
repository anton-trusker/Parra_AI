import { Settings2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover';

export interface ColumnDef {
  key: string;
  label: string;
  defaultVisible?: boolean;
}

interface ColumnManagerProps {
  columns: ColumnDef[];
  visibleColumns: string[];
  onChange: (visible: string[]) => void;
}

export default function ColumnManager({ columns, visibleColumns, onChange }: ColumnManagerProps) {
  const toggle = (key: string) => {
    if (visibleColumns.includes(key)) {
      if (visibleColumns.length <= 2) return;
      onChange(visibleColumns.filter(k => k !== key));
    } else {
      onChange([...visibleColumns, key]);
    }
  };

  const moveUp = (key: string) => {
    const idx = visibleColumns.indexOf(key);
    if (idx <= 0) return;
    const next = [...visibleColumns];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };

  const moveDown = (key: string) => {
    const idx = visibleColumns.indexOf(key);
    if (idx < 0 || idx >= visibleColumns.length - 1) return;
    const next = [...visibleColumns];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onChange(next);
  };

  // Show visible columns first (in order), then hidden ones
  const orderedColumns = [
    ...visibleColumns.map(k => columns.find(c => c.key === k)).filter(Boolean) as ColumnDef[],
    ...columns.filter(c => !visibleColumns.includes(c.key)),
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-11 w-11 border-border" title="Manage columns">
          <Settings2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 bg-popover border-border">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Columns & Order</p>
        <div className="space-y-0.5 max-h-80 overflow-y-auto">
          {orderedColumns.map(col => {
            const isVisible = visibleColumns.includes(col.key);
            const idx = visibleColumns.indexOf(col.key);
            return (
              <div
                key={col.key}
                className="flex items-center gap-1 hover:bg-secondary/50 rounded-md p-1.5 transition-colors group"
              >
                <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={() => toggle(col.key)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm truncate">{col.label}</span>
                </label>
                {isVisible && (
                  <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => moveUp(col.key)}
                      disabled={idx === 0}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveDown(col.key)}
                      disabled={idx === visibleColumns.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
