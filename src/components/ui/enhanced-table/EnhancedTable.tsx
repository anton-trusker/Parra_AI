import { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { TableColumn, TableFilter, TableSort, EnhancedTableProps } from './types';
import { ColumnConfig } from './ColumnConfig';
import { FilterPanel } from './FilterPanel';
import { FixedSizeList as List } from 'react-window';
import { cn } from '@/lib/utils';

interface SortableHeaderProps {
  column: TableColumn;
  sortConfig: TableSort | null;
  onSort: (columnId: string) => void;
  compact?: boolean;
}

function SortableHeader({ column, sortConfig, onSort, compact }: SortableHeaderProps) {
  const isSorted = sortConfig?.columnId === column.id;
  const sortDirection = isSorted ? sortConfig.direction : null;

  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-xs font-medium text-muted-foreground select-none",
        compact && "px-2 py-1",
        column.sortable && "cursor-pointer hover:bg-muted/50 transition-colors"
      )}
      onClick={() => column.sortable && onSort(column.id)}
      style={{ width: column.width, minWidth: column.width }}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{column.title}</span>
        {column.sortable && (
          <div className="flex flex-col">
            <ChevronUp
              className={cn(
                "h-2.5 w-2.5",
                sortDirection === 'asc' ? 'text-primary' : 'text-muted-foreground/50'
              )}
            />
            <ChevronDown
              className={cn(
                "h-2.5 w-2.5 -mt-1",
                sortDirection === 'desc' ? 'text-primary' : 'text-muted-foreground/50'
              )}
            />
          </div>
        )}
      </div>
    </th>
  );
}

interface TableRowProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  index: number;
  style: React.CSSProperties;
  onRowClick?: (record: T, index: number) => void;
  compact?: boolean;
  zebraStriping?: boolean;
  getRowKey: (record: T) => string;
}

function TableRowComponent<T>({
  data,
  columns,
  index,
  style,
  onRowClick,
  compact,
  zebraStriping,
  getRowKey,
}: TableRowProps<T>) {
  const record = data[index];
  const rowKey = getRowKey(record);

  return (
    <tr
      key={rowKey}
      style={style}
      className={cn(
        "border-b border-border/50 transition-colors",
        zebraStriping && index % 2 === 0 && "bg-muted/30",
        onRowClick && "cursor-pointer hover:bg-muted/50",
        compact && "text-xs"
      )}
      onClick={() => onRowClick?.(record, index)}
    >
      {columns.map((column) => {
        if (!column.visible) return null;
        
        const cellValue = record[column.dataIndex as keyof T];
        const renderedValue = column.render
          ? column.render(cellValue, record, index)
          : String(cellValue ?? '');

        return (
          <td
            key={column.id}
            className={cn(
              "px-3 py-2 text-xs",
              compact && "px-2 py-1",
              column.align === 'right' && "text-right",
              column.align === 'center' && "text-center"
            )}
            style={{ width: column.width, minWidth: column.width }}
          >
            <div className="truncate">{renderedValue}</div>
          </td>
        );
      })}
    </tr>
  );
}

export function EnhancedTable<T = any>({
  data,
  columns: initialColumns,
  loading = false,
  pagination,
  onRowClick,
  onSelectionChange,
  rowKey = 'id',
  className,
  preferences,
  onPreferencesChange,
  showColumnConfig = true,
  showFilterPanel = true,
  compact = false,
  virtualized = false,
  height = 400,
}: EnhancedTableProps<T>) {
  const [columns, setColumns] = useState(initialColumns);
  const [filters, setFilters] = useState<TableFilter[]>(preferences?.filters || []);
  const [sortConfig, setSortConfig] = useState<TableSort | null>(preferences?.sort || null);
  const [filterPresets, setFilterPresets] = useState<Array<{ id: string; name: string; filters: TableFilter[] }>>([]);

  // Sync with preferences when provided
  useMemo(() => {
    if (preferences) {
      setColumns(preferences.columns);
      setFilters(preferences.filters);
      setSortConfig(preferences.sort);
    }
  }, [preferences]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filteredData = [...data];

    // Apply filters
    filters.forEach(filter => {
      filteredData = filteredData.filter(item => {
        const value = item[filter.columnId as keyof T];
        const filterValue = filter.value;

        switch (filter.operator) {
          case 'equals':
            return String(value) === String(filterValue);
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'greater':
            return Number(value) > Number(filterValue);
          case 'less':
            return Number(value) < Number(filterValue);
          case 'between':
            const [min, max] = Array.isArray(filterValue) ? filterValue : [filterValue, filterValue];
            return Number(value) >= Number(min) && Number(value) <= Number(max);
          case 'in':
            const values = Array.isArray(filterValue) ? filterValue : [filterValue];
            return values.includes(String(value));
          default:
            return true;
        }
      });
    });

    // Apply sorting
    if (sortConfig) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.columnId as keyof T];
        const bValue = b[sortConfig.columnId as keyof T];

        if (sortConfig.direction === 'asc') {
          return String(aValue).localeCompare(String(bValue));
        } else {
          return String(bValue).localeCompare(String(aValue));
        }
      });
    }

    return filteredData;
  }, [data, filters, sortConfig]);

  const handleSort = useCallback((columnId: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.columnId === columnId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const newSortConfig = { columnId, direction };
    setSortConfig(newSortConfig);
    
    if (onPreferencesChange) {
      onPreferencesChange({
        columns,
        filters,
        sort: newSortConfig,
        pageSize: preferences?.pageSize || 20,
        compactMode: preferences?.compactMode || false,
        showZebraStriping: preferences?.showZebraStriping || false,
      });
    }
  }, [sortConfig, columns, filters, preferences, onPreferencesChange]);

  const handleColumnsChange = useCallback((newColumns: TableColumn[]) => {
    setColumns(newColumns);
    if (onPreferencesChange) {
      onPreferencesChange({
        columns: newColumns,
        filters,
        sort: sortConfig,
        pageSize: preferences?.pageSize || 20,
        compactMode: preferences?.compactMode || false,
        showZebraStriping: preferences?.showZebraStriping || false,
      });
    }
  }, [filters, sortConfig, preferences, onPreferencesChange]);

  const handleFiltersChange = useCallback((newFilters: TableFilter[]) => {
    setFilters(newFilters);
    if (onPreferencesChange) {
      onPreferencesChange({
        columns,
        filters: newFilters,
        sort: sortConfig,
        pageSize: preferences?.pageSize || 20,
        compactMode: preferences?.compactMode || false,
        showZebraStriping: preferences?.showZebraStriping || false,
      });
    }
  }, [columns, sortConfig, preferences, onPreferencesChange]);

  const handleSaveFilterPreset = (name: string, filters: TableFilter[]) => {
    const newPreset = {
      id: Date.now().toString(),
      name,
      filters,
    };
    setFilterPresets([...filterPresets, newPreset]);
  };

  const handleLoadFilterPreset = (preset: { id: string; name: string; filters: TableFilter[] }) => {
    handleFiltersChange(preset.filters);
  };

  const visibleColumns = columns.filter(col => col.visible);
  const getRowKey = (record: T): string => {
    if (typeof rowKey === 'string') {
      return String(record[rowKey as keyof T]);
    }
    return rowKey(record);
  };

  // Virtualized row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <TableRowComponent
      data={processedData}
      columns={visibleColumns}
      index={index}
      style={style}
      onRowClick={onRowClick}
      compact={compact}
      zebraStriping={preferences?.showZebraStriping}
      getRowKey={getRowKey}
    />
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showFilterPanel && (
            <FilterPanel
              columns={columns}
              filters={filters}
              onFiltersChange={handleFiltersChange}
              presets={filterPresets}
              onPresetSave={handleSaveFilterPreset}
              onPresetLoad={handleLoadFilterPreset}
            />
          )}
          {showColumnConfig && (
            <ColumnConfig
              columns={columns}
              onColumnsChange={handleColumnsChange}
            />
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {processedData.length} of {data.length} records
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                {visibleColumns.map((column) => (
                  <SortableHeader
                    key={column.id}
                    column={column}
                    sortConfig={sortConfig}
                    onSort={handleSort}
                    compact={compact}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {virtualized ? (
                <List
                  height={height}
                  itemCount={processedData.length}
                  itemSize={compact ? 28 : 36}
                  width="100%"
                >
                  {Row}
                </List>
              ) : (
                processedData.map((record, index) => (
                  <TableRowComponent
                    key={getRowKey(record)}
                    data={processedData}
                    columns={visibleColumns}
                    index={index}
                    style={{}}
                    onRowClick={onRowClick}
                    compact={compact}
                    zebraStriping={preferences?.showZebraStriping}
                    getRowKey={getRowKey}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Showing {Math.min(pagination.pageSize, pagination.total)} of {pagination.total} records
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current === 1}
              onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
            >
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}