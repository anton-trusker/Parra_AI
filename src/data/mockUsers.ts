export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string;
  jobTitle: string;
  department: string;
  notes: string;
  totalCounts: number;
  lastLogin: string;
  createdAt: string;
}

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@parra.app', role: 'admin', status: 'active', phone: '+971 50 123 4567', jobTitle: 'Manager', department: 'Operations', notes: '', totalCounts: 45, lastLogin: new Date().toISOString(), createdAt: '2024-01-01' },
  { id: 'u2', name: 'Staff One', email: 'staff1@parra.app', role: 'staff', status: 'active', phone: '+971 50 234 5678', jobTitle: 'Barista', department: 'Floor', notes: '', totalCounts: 23, lastLogin: new Date(Date.now() - 86400000).toISOString(), createdAt: '2024-03-15' },
  { id: 'u3', name: 'Staff Two', email: 'staff2@parra.app', role: 'staff', status: 'inactive', phone: '', jobTitle: 'Waiter', department: 'Floor', notes: 'On leave', totalCounts: 12, lastLogin: new Date(Date.now() - 604800000).toISOString(), createdAt: '2024-06-01' },
];
