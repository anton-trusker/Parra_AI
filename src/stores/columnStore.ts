import { create } from 'zustand';

interface ColumnStoreState {
  stockColumns: string[];
  catalogColumns: string[];
  historyColumns: string[];
  sessionColumns: string[];
  stockFilters: string[];
  historyFilters: string[];
  catalogFilters: string[];
  columnWidths: Record<string, number>;
  setStockColumns: (cols: string[]) => void;
  setCatalogColumns: (cols: string[]) => void;
  setHistoryColumns: (cols: string[]) => void;
  setSessionColumns: (cols: string[]) => void;
  setStockFilters: (filters: string[]) => void;
  setHistoryFilters: (filters: string[]) => void;
  setCatalogFilters: (filters: string[]) => void;
  setColumnWidth: (key: string, width: number) => void;
}

export const useColumnStore = create<ColumnStoreState>((set) => ({
  stockColumns: ['wine', 'vintage', 'type', 'size', 'region', 'closed', 'open', 'total', 'par', 'status', 'value', 'location'],
  catalogColumns: ['wine', 'producer', 'vintage', 'type', 'volume', 'country', 'stock', 'status', 'price'],
  historyColumns: ['timestamp', 'user', 'wine', 'method', 'session', 'closed', 'open', 'total', 'confidence'],
  sessionColumns: ['name', 'type', 'status', 'createdBy', 'date', 'duration', 'progress', 'variances'],
  stockFilters: ['status', 'type', 'country', 'region', 'location', 'stockRange'],
  historyFilters: ['method', 'dateRange', 'user', 'session'],
  catalogFilters: ['type', 'country', 'region', 'stock', 'sort'],
  columnWidths: {},
  setStockColumns: (cols) => set({ stockColumns: cols }),
  setCatalogColumns: (cols) => set({ catalogColumns: cols }),
  setHistoryColumns: (cols) => set({ historyColumns: cols }),
  setSessionColumns: (cols) => set({ sessionColumns: cols }),
  setStockFilters: (filters) => set({ stockFilters: filters }),
  setHistoryFilters: (filters) => set({ historyFilters: filters }),
  setCatalogFilters: (filters) => set({ catalogFilters: filters }),
  setColumnWidth: (key, width) => set(state => ({ columnWidths: { ...state.columnWidths, [key]: width } })),
}));
