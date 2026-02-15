export type AiScanStatus = 'confirmed' | 'pending' | 'rejected' | 'error';

export interface MockAiScan {
  id: string;
  timestamp: string;
  productId: string | null;
  productName: string | null;
  detectedName: string;
  detectedCategory: string;
  quantity: number;
  confidence: number;
  status: AiScanStatus;
  userName: string;
  storeName: string;
  checkId: string | null;
  modelUsed: string;
  processingTimeMs: number;
  imageUrl: string | null;
}

export const aiScanStatusConfig: Record<AiScanStatus, { label: string; color: string }> = {
  confirmed: { label: 'Confirmed', color: 'bg-emerald-500/15 text-emerald-400' },
  pending: { label: 'Pending', color: 'bg-amber-500/15 text-amber-400' },
  rejected: { label: 'Rejected', color: 'bg-destructive/15 text-destructive' },
  error: { label: 'Error', color: 'bg-red-500/15 text-red-400' },
};

export const mockAiScans: MockAiScan[] = [
  { id: 'ai-001', timestamp: '2026-02-15T08:12:00Z', productId: 'p-1', productName: 'Quinta do Vesuvio Vintage Port 2018', detectedName: 'Quinta do Vesuvio Port', detectedCategory: 'Port Wine', quantity: 3, confidence: 0.96, status: 'confirmed', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-004', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1240, imageUrl: null },
  { id: 'ai-002', timestamp: '2026-02-15T08:10:00Z', productId: 'p-2', productName: 'Pêra-Manca Tinto 2019', detectedName: 'Pera Manca Red 2019', detectedCategory: 'Red Wine', quantity: 6, confidence: 0.92, status: 'confirmed', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-004', modelUsed: 'gemini-2.5-flash', processingTimeMs: 980, imageUrl: null },
  { id: 'ai-003', timestamp: '2026-02-15T08:08:00Z', productId: null, productName: null, detectedName: 'Unknown Label — Partially Obscured', detectedCategory: 'Unknown', quantity: 1, confidence: 0.31, status: 'pending', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-004', modelUsed: 'gemini-2.5-flash', processingTimeMs: 2100, imageUrl: null },
  { id: 'ai-004', timestamp: '2026-02-14T11:45:00Z', productId: 'p-3', productName: 'Barca Velha 2011', detectedName: 'Barca Velha 2011', detectedCategory: 'Red Wine', quantity: 2, confidence: 0.99, status: 'confirmed', userName: 'Ana Rodrigues', storeName: 'Beach Club Cascais', checkId: 'chk-003', modelUsed: 'gemini-2.5-pro', processingTimeMs: 1580, imageUrl: null },
  { id: 'ai-005', timestamp: '2026-02-14T11:40:00Z', productId: 'p-4', productName: 'Quinta do Crasto Reserva 2020', detectedName: 'Q. Crasto Reserva', detectedCategory: 'Red Wine', quantity: 4, confidence: 0.87, status: 'confirmed', userName: 'Ana Rodrigues', storeName: 'Beach Club Cascais', checkId: 'chk-003', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1100, imageUrl: null },
  { id: 'ai-006', timestamp: '2026-02-14T11:35:00Z', productId: null, productName: null, detectedName: 'Espumante — Label Torn', detectedCategory: 'Sparkling', quantity: 1, confidence: 0.45, status: 'rejected', userName: 'Ana Rodrigues', storeName: 'Beach Club Cascais', checkId: 'chk-003', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1800, imageUrl: null },
  { id: 'ai-007', timestamp: '2026-02-12T10:20:00Z', productId: 'p-5', productName: 'Niepoort Redoma Branco 2021', detectedName: 'Niepoort Redoma White', detectedCategory: 'White Wine', quantity: 5, confidence: 0.94, status: 'confirmed', userName: 'Pedro Almeida', storeName: 'Wine Bar Downtown', checkId: 'chk-002', modelUsed: 'gemini-2.5-flash', processingTimeMs: 890, imageUrl: null },
  { id: 'ai-008', timestamp: '2026-02-12T10:15:00Z', productId: 'p-6', productName: 'Luis Pato Vinha Formal 2015', detectedName: 'Luis Pato Vinha Formal', detectedCategory: 'Red Wine', quantity: 2, confidence: 0.91, status: 'confirmed', userName: 'Pedro Almeida', storeName: 'Wine Bar Downtown', checkId: 'chk-002', modelUsed: 'gemini-2.5-flash', processingTimeMs: 950, imageUrl: null },
  { id: 'ai-009', timestamp: '2026-02-10T13:00:00Z', productId: 'p-7', productName: 'Soalheiro Alvarinho 2022', detectedName: 'Soalheiro Alvarinho', detectedCategory: 'White Wine', quantity: 8, confidence: 0.88, status: 'confirmed', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-001', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1050, imageUrl: null },
  { id: 'ai-010', timestamp: '2026-02-10T12:50:00Z', productId: null, productName: null, detectedName: 'Processing Error', detectedCategory: 'N/A', quantity: 0, confidence: 0, status: 'error', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-001', modelUsed: 'gemini-2.5-flash', processingTimeMs: 5000, imageUrl: null },
  { id: 'ai-011', timestamp: '2026-02-10T12:45:00Z', productId: 'p-8', productName: 'Mouchão Tonel 3-4 2017', detectedName: 'Mouchao Tonel 3-4', detectedCategory: 'Red Wine', quantity: 3, confidence: 0.85, status: 'confirmed', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-001', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1300, imageUrl: null },
  { id: 'ai-012', timestamp: '2026-02-10T12:30:00Z', productId: 'p-9', productName: 'Taylor\'s Vintage Port 2016', detectedName: 'Taylors Vintage 2016', detectedCategory: 'Port Wine', quantity: 4, confidence: 0.93, status: 'confirmed', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-001', modelUsed: 'gemini-2.5-pro', processingTimeMs: 1450, imageUrl: null },
  { id: 'ai-013', timestamp: '2026-02-10T12:20:00Z', productId: 'p-10', productName: 'Quinta da Pellada Primus 2018', detectedName: 'Pellada Primus', detectedCategory: 'Red Wine', quantity: 1, confidence: 0.78, status: 'pending', userName: 'Maria Silva', storeName: 'Main Restaurant', checkId: 'chk-001', modelUsed: 'gemini-2.5-flash', processingTimeMs: 1650, imageUrl: null },
  { id: 'ai-014', timestamp: '2026-02-08T15:00:00Z', productId: 'p-11', productName: 'Dow\'s Vintage Port 2017', detectedName: 'Dows Vintage Port', detectedCategory: 'Port Wine', quantity: 6, confidence: 0.97, status: 'confirmed', userName: 'Pedro Almeida', storeName: 'Wine Bar Downtown', checkId: null, modelUsed: 'gemini-2.5-pro', processingTimeMs: 1100, imageUrl: null },
  { id: 'ai-015', timestamp: '2026-02-05T09:30:00Z', productId: 'p-12', productName: 'Chryseia 2019', detectedName: 'Chryseia Douro 2019', detectedCategory: 'Red Wine', quantity: 2, confidence: 0.95, status: 'confirmed', userName: 'João Costa', storeName: 'Main Restaurant', checkId: null, modelUsed: 'gemini-2.5-flash', processingTimeMs: 920, imageUrl: null },
];
