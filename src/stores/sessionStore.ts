import { create } from 'zustand';
import { mockSessions, mockInventoryItems, InventorySession, InventoryItem, SessionStatus } from '@/data/mockWines';

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
  sessions: InventorySession[];
  items: InventoryItem[];
  auditLog: AuditEntry[];
  approveSession: (id: string, notes: string, userId: string, userName: string) => void;
  flagSession: (id: string, reason: string, userId: string, userName: string) => void;
  getSessionItems: (sessionId: string) => InventoryItem[];
  getSessionAudit: (sessionId: string) => AuditEntry[];
}

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  sessions: [...mockSessions],
  items: [...mockInventoryItems],
  auditLog: [],

  approveSession: (id, notes, userId, userName) => set((s) => ({
    sessions: s.sessions.map(sess =>
      sess.id === id ? { ...sess, status: 'approved' as SessionStatus, approvedBy: userId, approvedAt: new Date().toISOString(), approvalNotes: notes } : sess
    ),
    auditLog: [...s.auditLog, {
      id: `audit_${Date.now()}`,
      sessionId: id,
      action: 'approved',
      userId,
      userName,
      notes,
      timestamp: new Date().toISOString(),
    }],
  })),

  flagSession: (id, reason, userId, userName) => set((s) => ({
    sessions: s.sessions.map(sess =>
      sess.id === id ? { ...sess, status: 'flagged' as SessionStatus, approvalNotes: reason } : sess
    ),
    auditLog: [...s.auditLog, {
      id: `audit_${Date.now()}`,
      sessionId: id,
      action: 'flagged',
      userId,
      userName,
      notes: reason,
      timestamp: new Date().toISOString(),
    }],
  })),

  getSessionItems: (sessionId) => get().items.filter(i => i.sessionId === sessionId),
  getSessionAudit: (sessionId) => get().auditLog.filter(a => a.sessionId === sessionId),
}));
