import React, { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';

export interface SimpleColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface SimpleDataTableProps<T> {
  data: T[];
  columns: SimpleColumn<T>[];
  keyField: keyof T & string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  paginated?: boolean;
  defaultPageSize?: number;
}

const DEFAULT_PAGE_SIZE = 50;

type SortDir = 'asc' | 'desc' | null;

export default function SimpleDataTable<T extends Record<string, any>>({
  data, columns, keyField, emptyMessage = 'No data', onRowClick, paginated = true, defaultPageSize = DEFAULT_PAGE_SIZE,
}: SimpleDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = typeof av === 'number' ? av - (bv as number) : String(av).localeCompare(String(bv));
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [data, sortKey, sortDir]);

  const totalPages = paginated ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
  const paged = paginated ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="space-y-0">
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b-2 border-border/50">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap h-11',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    col.align === 'right' && 'text-right',
                    col.align === 'center' && 'text-center',
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn('flex items-center gap-1.5', col.align === 'right' && 'justify-end')}>
                    {col.label}
                    {col.sortable && (
                      <span className={cn('transition-opacity', sortKey === col.key ? 'opacity-100' : 'opacity-0 group-hover:opacity-30')}>
                        {sortKey === col.key
                          ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)
                          : <ArrowUpDown className="w-3 h-3 opacity-30" />
                        }
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-16 text-muted-foreground">{emptyMessage}</TableCell>
              </TableRow>
            ) : paged.map((item, idx) => (
              <TableRow
                key={String(item[keyField])}
                className={cn(
                  'transition-colors duration-150',
                  idx % 2 === 1 && 'bg-muted/15',
                  onRowClick && 'cursor-pointer hover:bg-primary/5',
                  !onRowClick && 'hover:bg-muted/30'
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={cn('py-3', col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {paginated && sorted.length > 0 && (
        <div className="flex items-center justify-between py-3 text-sm">
          <span className="text-muted-foreground text-xs">
            Showing <span className="font-medium text-foreground">{page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)}</span> of <span className="font-medium text-foreground">{sorted.length}</span>
          </span>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(0); }}>
              <SelectTrigger className="w-[72px] h-8 text-xs border-border/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-xs tabular-nums text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
