export interface TableColumn<T = any> {
  id: string;
  title: string;
  dataIndex: string;
  width?: number;
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableFilter {
  columnId: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between' | 'in';
  value: string | number | (string | number)[];
  logic?: 'AND' | 'OR';
}

export interface TableSort {
  columnId: string;
  direction: 'asc' | 'desc';
}

export interface TablePreferences {
  columns: TableColumn[];
  filters: TableFilter[];
  sort: TableSort | null;
  pageSize: number;
  compactMode: boolean;
  showZebraStriping: boolean;
}

export interface EnhancedTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  onRowClick?: (record: T, index: number) => void;
  onSelectionChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
  rowKey?: string | ((record: T) => string);
  className?: string;
  preferences?: TablePreferences;
  onPreferencesChange?: (preferences: TablePreferences) => void;
  showColumnConfig?: boolean;
  showFilterPanel?: boolean;
  compact?: boolean;
  virtualized?: boolean;
  height?: number;
}