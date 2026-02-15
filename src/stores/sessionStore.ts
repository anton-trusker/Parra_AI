import { create } from 'zustand';

export interface AuditEntry {
  id: string;
  sessionId: string;
  action: 'approved' | 'flagged' | 'reopened';
  userId: string;
  userName: string;
  notes: string;
  timestamp: string;
}

interface SessionStoreState {
  auditLog: AuditEntry[];
  addAuditEntry: (entry: AuditEntry) => void;
  getSessionAudit: (sessionId: string) => AuditEntry[];
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  auditLog: [],

  addAuditEntry: (entry) => set((s) => ({
    auditLog: [...s.auditLog, entry],
  })),

  getSessionAudit: (sessionId) => get().auditLog.filter(a => a.sessionId === sessionId),
}));
