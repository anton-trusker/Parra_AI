import React, { useState, useCallback, useRef } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => React.ReactNode;
  sortFn?: (a: T, b: T) => number;
  minWidth?: number;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  visibleColumns: string[];
  columnWidths: Record<string, number>;
  onColumnResize: (key: string, width: number) => void;
  onRowClick?: (item: T) => void;
  rowClassName?: (item: T) => string;
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  compact?: boolean;
}

export default function DataTable<T>({
  data,
  columns,
  visibleColumns,
  columnWidths,
  onColumnResize,
  onRowClick,
  rowClassName,
  keyExtractor,
  emptyMessage = 'No data',
  compact = false,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const resizingRef = useRef<{ key: string; startX: number; startW: number } | null>(null);

  const handleSort = (key: string) => {
    const col = columns.find(c => c.key === key);
    if (!col?.sortFn) return;
    if (sortColumn === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key);
      setSortDir('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortColumn) return data;
    const col = columns.find(c => c.key === sortColumn);
    if (!col?.sortFn) return data;
    const sorted = [...data].sort(col.sortFn);
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortColumn, sortDir, columns]);

  // Ordered visible columns
  const orderedCols = visibleColumns
    .map(key => columns.find(c => c.key === key))
    .filter(Boolean) as DataTableColumn<T>[];

  const handleResizeStart = useCallback((e: React.MouseEvent, key: string) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = columnWidths[key] || 150;
    resizingRef.current = { key, startX, startW };

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const newW = Math.max(resizingRef.current.startW + diff, 60);
      onColumnResize(resizingRef.current.key, newW);
    };

    const onUp = () => {
      resizingRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [columnWidths, onColumnResize]);

  const alignClass = (a?: string) => {
    if (a === 'center') return 'text-center';
    if (a === 'right') return 'text-right';
    return 'text-left';
  };

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">{emptyMessage}</div>
    );
  }

  const cellPad = compact ? 'px-2 py-1.5' : 'p-4';
  const headerPad = compact ? 'px-2 py-2' : 'p-4';
  const textSize = compact ? 'text-xs' : 'text-sm';

  const totalWidth = orderedCols.reduce((sum, col) => sum + (columnWidths[col.key] || col.minWidth || (compact ? 100 : 150)), 0);

  return (
    <div className="overflow-x-auto overscroll-x-contain -webkit-overflow-scrolling-touch">
      <table className={cn('w-full', textSize)} style={{ tableLayout: 'fixed', minWidth: Math.max(totalWidth, 600) }}>
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-muted-foreground">
            {orderedCols.map((col, idx) => {
              const w = columnWidths[col.key] || col.minWidth || (compact ? 100 : 150);
              const isSorted = sortColumn === col.key;
              const isSortable = !!col.sortFn;
              return (
                <th
                  key={col.key}
                  className={cn(
                    headerPad, 'font-medium relative group select-none whitespace-nowrap',
                    alignClass(col.align),
                    isSortable && 'cursor-pointer hover:text-foreground transition-colors',
                    idx === 0 && 'sticky left-0 z-20 bg-card'
                  )}
                  style={{ width: w, minWidth: col.minWidth || (compact ? 80 : 100) }}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {isSortable && (
                      <span className="inline-flex opacity-50 group-hover:opacity-100 transition-opacity">
                        {isSorted ? (
                          sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </span>
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-border/40 hover:bg-primary/50 hover:w-1.5 transition-all"
                    onMouseDown={e => handleResizeStart(e, col.key)}
                    onTouchStart={e => {
                      const touch = e.touches[0];
                      handleResizeStart({ preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation(), clientX: touch.clientX } as React.MouseEvent, col.key);
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedData.map(item => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                'border-b border-border/50 hover:bg-muted/50 transition-colors',
                onRowClick && 'cursor-pointer',
                rowClassName?.(item)
              )}
              onClick={() => onRowClick?.(item)}
            >
              {orderedCols.map((col, idx) => {
                const w = columnWidths[col.key] || col.minWidth || (compact ? 100 : 150);
                return (
                  <td
                    key={col.key}
                    className={cn(
                      cellPad, alignClass(col.align),
                      idx === 0 && 'sticky left-0 z-10 bg-card'
                    )}
                    style={{ width: w, maxWidth: w, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {col.render(item)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
