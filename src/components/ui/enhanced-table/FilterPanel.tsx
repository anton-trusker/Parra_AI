import { useState } from 'react';
import { Filter, X, Plus, Save, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TableFilter } from './types';
import { TableColumn } from './types';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface FilterRowProps {
  filter: TableFilter;
  columns: TableColumn[];
  onChange: (filter: TableFilter) => void;
  onRemove: () => void;
}

function FilterRow({ filter, columns, onChange, onRemove }: FilterRowProps) {
  const column = columns.find(col => col.id === filter.columnId);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
      <Select
        value={filter.columnId}
        onValueChange={(value) => onChange({ ...filter, columnId: value })}
      >
        <SelectTrigger className="h-8 w-32">
          <SelectValue placeholder="Column" />
        </SelectTrigger>
        <SelectContent>
          {columns.filter(col => col.filterable).map(col => (
            <SelectItem key={col.id} value={col.id}>{col.title}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filter.operator}
        onValueChange={(value: TableFilter['operator']) => onChange({ ...filter, operator: value })}
      >
        <SelectTrigger className="h-8 w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals">=</SelectItem>
          <SelectItem value="contains">contains</SelectItem>
          <SelectItem value="greater">&gt;</SelectItem>
          <SelectItem value="less">&lt;</SelectItem>
          <SelectItem value="between">between</SelectItem>
          <SelectItem value="in">in</SelectItem>
        </SelectContent>
      </Select>

      <Input
        value={Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
        onChange={(e) => onChange({ ...filter, value: e.target.value })}
        placeholder="Value"
        className="h-8 flex-1"
      />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface FilterPanelProps {
  columns: TableColumn[];
  filters: TableFilter[];
  onFiltersChange: (filters: TableFilter[]) => void;
  presets?: FilterPreset[];
  onPresetSave?: (name: string, filters: TableFilter[]) => void;
  onPresetLoad?: (preset: FilterPreset) => void;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: TableFilter[];
}

export function FilterPanel({ columns, filters, onFiltersChange, presets = [], onPresetSave, onPresetLoad }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const addFilter = () => {
    const newFilter: TableFilter = {
      columnId: columns.find(col => col.filterable)?.id || '',
      operator: 'contains',
      value: '',
      logic: 'AND',
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, filter: TableFilter) => {
    const newFilters = [...filters];
    newFilters[index] = filter;
    onFiltersChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onFiltersChange(newFilters);
  };

  const clearAll = () => {
    onFiltersChange([]);
  };

  const handleSavePreset = () => {
    if (presetName.trim() && onPresetSave) {
      onPresetSave(presetName.trim(), filters);
      setPresetName('');
    }
  };

  const activeFilterCount = filters.length;

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 relative">
            <Filter className="h-3 w-3 mr-1" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1 min-w-5">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Advanced Filters</h4>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6"
                  onClick={() => setShowPresets(!showPresets)}
                >
                  <FolderOpen className="h-3 w-3 mr-1" />
                  Presets
                </Button>
                {filters.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6" onClick={clearAll}>
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {showPresets && (
              <div className="space-y-2 p-2 bg-muted/30 rounded-md">
                <div className="text-xs font-medium text-muted-foreground">Filter Presets</div>
                {presets.map(preset => (
                  <Button
                    key={preset.id}
                    variant="outline"
                    size="sm"
                    className="h-6 w-full justify-start text-xs"
                    onClick={() => {
                      onPresetLoad?.(preset);
                      setIsOpen(false);
                    }}
                  >
                    {preset.name}
                  </Button>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Preset name"
                    className="h-6 text-xs flex-1"
                  />
                  <Button size="sm" className="h-6" onClick={handleSavePreset}>
                    <Save className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {filters.map((filter, index) => (
                <FilterRow
                  key={index}
                  filter={filter}
                  columns={columns}
                  onChange={(updatedFilter) => updateFilter(index, updatedFilter)}
                  onRemove={() => removeFilter(index)}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-full"
              onClick={addFilter}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Filter
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {filters.map((filter, index) => {
            const column = columns.find(col => col.id === filter.columnId);
            return (
              <Badge key={index} variant="secondary" className="text-xs h-6">
                {column?.title}: {filter.operator} {String(filter.value)}
                <button
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}