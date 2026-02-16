import React, { useState, useEffect } from 'react';
import { EnhancedTable } from './EnhancedTable';
import { TablePreferencesPanel } from './TablePreferencesPanel';
import { useTablePreferences } from '@/hooks/useTablePreferences';
import { TableColumn, TablePreferences as TablePrefs } from './types';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedTableWithPreferencesProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  tableName: string;
  loading?: boolean;
  pagination?: any;
  onRowClick?: (record: T, index: number) => void;
  onSelectionChange?: (selectedKeys: React.Key[]) => void;
  rowKey?: string | ((record: T) => string);
  className?: string;
  virtualized?: boolean;
  height?: number;
  showPreferencesPanel?: boolean;
  defaultPreferences?: Partial<TablePrefs>;
  columnLabels?: Record<string, string>;
}

export function EnhancedTableWithPreferences<T = any>({
  data,
  columns: initialColumns,
  tableName,
  loading = false,
  pagination,
  onRowClick,
  onSelectionChange,
  rowKey = 'id',
  className,
  virtualized = false,
  height = 400,
  showPreferencesPanel = true,
  defaultPreferences,
  columnLabels = {},
}: EnhancedTableWithPreferencesProps<T>) {
  const {
    preferences,
    isLoading: preferencesLoading,
    updatePreferences,
    updateColumnVisibility,
    updateColumnOrder,
    updateCompactMode,
    updateZebraStriping,
    updatePageSize,
    resetPreferences,
  } = useTablePreferences({
    tableName,
    defaultPreferences: {
      column_visibility: initialColumns.reduce((acc, col) => ({
        ...acc,
        [col.id]: col.visible !== false,
      }), {}),
      column_order: initialColumns.map(col => col.id),
      page_size: 20,
      compact_mode: false,
      zebra_striping: false,
      ...defaultPreferences,
    },
  });

  const [columns, setColumns] = useState(initialColumns);
  const [showPreferences, setShowPreferences] = useState(false);

  // Apply preferences to columns
  useEffect(() => {
    if (preferences && !preferencesLoading) {
      const updatedColumns = initialColumns.map(col => ({
        ...col,
        visible: preferences.column_visibility[col.id] !== false,
      }));
      
      // Apply column order if available
      if (preferences.column_order.length > 0) {
        const orderedColumns = preferences.column_order
          .map(id => updatedColumns.find(col => col.id === id))
          .filter(Boolean) as TableColumn<T>[];
        
        // Add any missing columns at the end
        const remainingColumns = updatedColumns.filter(col => 
          !preferences.column_order.includes(col.id)
        );
        
        setColumns([...orderedColumns, ...remainingColumns]);
      } else {
        setColumns(updatedColumns);
      }
    }
  }, [preferences, preferencesLoading, initialColumns]);

  const handleColumnsChange = (newColumns: TableColumn<T>[]) => {
    setColumns(newColumns);
    
    // Update preferences
    const newVisibility = newColumns.reduce((acc, col) => ({
      ...acc,
      [col.id]: col.visible !== false,
    }), {});
    
    const newOrder = newColumns.map(col => col.id);
    
    updatePreferences({
      column_visibility: newVisibility,
      column_order: newOrder,
    });
  };

  const handlePreferencesChange = (newPrefs: Partial<TablePrefs>) => {
    updatePreferences({
      compact_mode: newPrefs.compactMode,
      zebra_striping: newPrefs.showZebraStriping,
      page_size: newPrefs.pageSize,
    });
  };

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showPreferencesPanel && (
            <TablePreferencesPanel
              preferences={preferences}
              onUpdatePreferences={updatePreferences}
              onResetPreferences={resetPreferences}
              availableColumns={initialColumns.map(col => col.id)}
              columnLabels={columnLabels}
            />
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateCompactMode(!preferences.compact_mode)}
            className={cn(
              'h-8',
              preferences.compact_mode && 'bg-accent text-accent-foreground'
            )}
          >
            {preferences.compact_mode ? 'Normal' : 'Compact'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateZebraStriping(!preferences.zebra_striping)}
            className={cn(
              'h-8',
              preferences.zebra_striping && 'bg-accent text-accent-foreground'
            )}
          >
            {preferences.zebra_striping ? 'No Stripes' : 'Zebra Stripes'}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{data.length} records</span>
          <span>•</span>
          <span>{columns.filter(col => col.visible).length} columns</span>
          <span>•</span>
          <span>{preferences.page_size} per page</span>
        </div>
      </div>

      {/* Enhanced Table */}
      <EnhancedTable
        data={data}
        columns={columns}
        loading={loading}
        pagination={pagination}
        onRowClick={onRowClick}
        onSelectionChange={onSelectionChange}
        rowKey={rowKey}
        className={className}
        virtualized={virtualized}
        height={height}
        compact={preferences.compact_mode}
        preferences={{
          columns,
          filters: [],
          sort: null,
          pageSize: preferences.page_size,
          compactMode: preferences.compact_mode,
          showZebraStriping: preferences.zebra_striping,
        }}
        onPreferencesChange={handlePreferencesChange}
        showColumnConfig={true}
        showFilterPanel={true}
      />
    </div>
  );
}