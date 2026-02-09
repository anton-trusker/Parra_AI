import { create } from 'zustand';

interface ColumnStoreState {
  stockColumns: string[];
  catalogColumns: string[];
  historyColumns: string[];
  stockFilters: string[];
  historyFilters: string[];
  catalogFilters: string[];
  setStockColumns: (cols: string[]) => void;
  setCatalogColumns: (cols: string[]) => void;
  setHistoryColumns: (cols: string[]) => void;
  setStockFilters: (filters: string[]) => void;
  setHistoryFilters: (filters: string[]) => void;
  setCatalogFilters: (filters: string[]) => void;
}

export const useColumnStore = create<ColumnStoreState>((set) => ({
  stockColumns: ['wine', 'vintage', 'type', 'size', 'region', 'closed', 'open', 'total', 'par', 'status', 'value', 'location'],
  catalogColumns: ['wine', 'producer', 'vintage', 'type', 'volume', 'country', 'stock', 'status', 'price'],
  historyColumns: ['timestamp', 'user', 'wine', 'method', 'session', 'closed', 'open', 'total', 'confidence'],
  stockFilters: ['status', 'type', 'country', 'region', 'location', 'stockRange'],
  historyFilters: ['method', 'dateRange', 'user', 'session'],
  catalogFilters: ['type', 'country', 'region', 'stock', 'sort'],
  setStockColumns: (cols) => set({ stockColumns: cols }),
  setCatalogColumns: (cols) => set({ catalogColumns: cols }),
  setHistoryColumns: (cols) => set({ historyColumns: cols }),
  setStockFilters: (filters) => set({ stockFilters: filters }),
  setHistoryFilters: (filters) => set({ historyFilters: filters }),
  setCatalogFilters: (filters) => set({ catalogFilters: filters }),
}));
