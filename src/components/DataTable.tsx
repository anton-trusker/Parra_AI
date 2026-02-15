import React, { useState, useCallback, useRef, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DataTableColumn<T> {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => React.ReactNode;
  headerRender?: () => React.ReactNode;
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
  paginated?: boolean;
  defaultPageSize?: number;
}

export default function DataTable<T>({
  data, columns, visibleColumns, columnWidths, onColumnResize, onRowClick, rowClassName,
  keyExtractor, emptyMessage = 'No data', compact = false, paginated = true, defaultPageSize = 25,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);
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
    setPage(0);
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;
    const col = columns.find(c => c.key === sortColumn);
    if (!col?.sortFn) return data;
    const sorted = [...data].sort(col.sortFn);
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  }, [data, sortColumn, sortDir, columns]);

  const totalPages = paginated ? Math.max(1, Math.ceil(sortedData.length / pageSize)) : 1;
  const paginatedData = paginated ? sortedData.slice(page * pageSize, (page + 1) * pageSize) : sortedData;
  const showFrom = paginated ? page * pageSize + 1 : 1;
  const showTo = paginated ? Math.min((page + 1) * pageSize, sortedData.length) : sortedData.length;

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
      <div className="text-center py-16 text-muted-foreground text-sm">{emptyMessage}</div>
    );
  }

  const cellPad = compact ? 'px-3 py-2' : 'px-4 py-3';
  const headerPad = compact ? 'px-3 py-3' : 'px-4 py-3.5';
  const textSize = compact ? 'text-xs' : 'text-sm';
  const totalWidth = orderedCols.reduce((sum, col) => sum + (columnWidths[col.key] || col.minWidth || (compact ? 100 : 150)), 0);

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto overscroll-x-contain -webkit-overflow-scrolling-touch">
        <table className={cn('w-full', textSize)} style={{ tableLayout: 'fixed', minWidth: Math.max(totalWidth, 600) }}>
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-border/60 bg-muted/50">
              {orderedCols.map((col, idx) => {
                const w = columnWidths[col.key] || col.minWidth || (compact ? 100 : 150);
                const isSorted = sortColumn === col.key;
                const isSortable = !!col.sortFn;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      headerPad, 'font-semibold relative group select-none whitespace-nowrap text-[11px] uppercase tracking-wider text-muted-foreground',
                      alignClass(col.align),
                      isSortable && 'cursor-pointer hover:text-foreground transition-colors',
                      idx === 0 && 'sticky left-0 z-20 bg-muted/50'
                    )}
                    style={{ width: w, minWidth: col.minWidth || (compact ? 80 : 100) }}
                    onClick={() => !col.headerRender && handleSort(col.key)}
                  >
                    {col.headerRender ? col.headerRender() : (
                      <span className="inline-flex items-center gap-1.5">
                        {col.label}
                        {isSortable && (
                          <span className={cn('inline-flex transition-opacity', isSorted ? 'opacity-100' : 'opacity-0 group-hover:opacity-50')}>
                            {isSorted ? (
                              sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </span>
                    )}
                    <div
                      className="absolute right-0 top-1 bottom-1 w-1 cursor-col-resize bg-transparent hover:bg-primary/40 rounded transition-colors"
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
            {paginatedData.map((item, rowIdx) => (
              <tr
                key={keyExtractor(item)}
                className={cn(
                  'border-b border-border/20 transition-colors duration-150',
                  rowIdx % 2 === 1 && 'bg-muted/15',
                  onRowClick && 'cursor-pointer hover:bg-primary/5',
                  !onRowClick && 'hover:bg-muted/30',
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

      {paginated && sortedData.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/40 bg-muted/10 text-sm">
          <span className="text-muted-foreground text-xs">
            Showing <span className="font-medium text-foreground">{showFrom}–{showTo}</span> of <span className="font-medium text-foreground">{sortedData.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="h-8 w-[72px] text-xs bg-card border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map(n => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(0)}>
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted-foreground px-2.5 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
