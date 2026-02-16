import React from 'react';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  RotateCcw,
  Save,
  Eye,
  EyeOff,
  Layout,
  Palette,
  Sliders
} from 'lucide-react';
import { TablePreferences } from '@/hooks/useTablePreferences';
import { cn } from '@/lib/utils';

interface TablePreferencesPanelProps {
  preferences: TablePreferences;
  onUpdatePreferences: (updates: Partial<TablePreferences>) => void;
  onResetPreferences: () => void;
  availableColumns: string[];
  columnLabels?: Record<string, string>;
  className?: string;
}

export function TablePreferencesPanel({
  preferences,
  onUpdatePreferences,
  onResetPreferences,
  availableColumns,
  columnLabels = {},
  className
}: TablePreferencesPanelProps) {
  const toggleColumnVisibility = (columnId: string) => {
    const newVisibility = {
      ...preferences.column_visibility,
      [columnId]: !preferences.column_visibility[columnId],
    };
    onUpdatePreferences({ column_visibility: newVisibility });
  };

  const toggleCompactMode = () => {
    onUpdatePreferences({ compact_mode: !preferences.compact_mode });
  };

  const toggleZebraStriping = () => {
    onUpdatePreferences({ zebra_striping: !preferences.zebra_striping });
  };

  const updatePageSize = (size: number) => {
    onUpdatePreferences({ page_size: size });
  };

  const visibleColumns = Object.entries(preferences.column_visibility)
    .filter(([_, visible]) => visible)
    .map(([columnId]) => columnId);

  const hiddenColumns = Object.entries(preferences.column_visibility)
    .filter(([_, visible]) => !visible)
    .map(([columnId]) => columnId);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn('h-8', className)}>
          <Settings className="h-3.5 w-3.5 mr-2" />
          Preferences
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Table Preferences
          </SheetTitle>
          <SheetDescription>
            Customize how data is displayed in this table
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Display Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Display Settings</h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="text-xs">
                  Compact Mode
                </Label>
                <Switch
                  id="compact-mode"
                  checked={preferences.compact_mode}
                  onCheckedChange={toggleCompactMode}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="zebra-striping" className="text-xs">
                  Zebra Striping
                </Label>
                <Switch
                  id="zebra-striping"
                  checked={preferences.zebra_striping}
                  onCheckedChange={toggleZebraStriping}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-size" className="text-xs">
                  Rows per page
                </Label>
                <div className="flex gap-1">
                  {[10, 20, 50, 100].map((size) => (
                    <Button
                      key={size}
                      variant={preferences.page_size === size ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => updatePageSize(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Column Visibility */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Column Visibility</h3>
              <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                {visibleColumns.length}/{availableColumns.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {availableColumns.map((columnId) => {
                const isVisible = preferences.column_visibility[columnId] !== false;
                const label = columnLabels[columnId] || columnId;

                return (
                  <div
                    key={columnId}
                    className="flex items-center justify-between py-1 px-2 rounded hover:bg-accent/50"
                  >
                    <Label 
                      htmlFor={`column-${columnId}`} 
                      className="text-xs cursor-pointer flex-1"
                    >
                      {label}
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={() => toggleColumnVisibility(columnId)}
                    >
                      {isVisible ? (
                        <Eye className="h-3 w-3" />
                      ) : (
                        <EyeOff className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column Order Preview */}
          {preferences.column_order.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Column Order</h3>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current order: {preferences.column_order.map(col => columnLabels[col] || col).join(' → ')}
                </div>
              </div>
            </>
          )}

          {/* Current Settings Summary */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">Current Settings</h3>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>Compact mode: {preferences.compact_mode ? 'On' : 'Off'}</div>
              <div>Zebra striping: {preferences.zebra_striping ? 'On' : 'Off'}</div>
              <div>Rows per page: {preferences.page_size}</div>
              <div>Visible columns: {visibleColumns.length}</div>
              {preferences.sort_config && (
                <div>Sort: {columnLabels[preferences.sort_config.column] || preferences.sort_config.column} ({preferences.sort_config.direction})</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <Separator />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetPreferences}
              className="flex-1"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-2" />
              Reset
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              disabled={!preferences.id}
            >
              <Save className="h-3.5 w-3.5 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}