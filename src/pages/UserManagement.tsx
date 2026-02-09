import { useState, useMemo } from 'react';
import { mockUsers, MockUser } from '@/data/mockWines';
import { useAuthStore } from '@/stores/authStore';
import { Navigate } from 'react-router-dom';
import { Plus, UserCheck, UserX, Shield, User, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserFormDialog from '@/components/UserFormDialog';

export default function UserManagement() {
  const { user } = useAuthStore();
  const [searchQ, setSearchQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<MockUser | null>(null);

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const filtered = mockUsers.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'login') return b.lastLogin.localeCompare(a.lastLogin);
    if (sortBy === 'counts') return b.totalCounts - a.totalCounts;
    return 0;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} users</p>
        </div>
        <Button size="sm" className="wine-gradient text-primary-foreground hover:opacity-90" onClick={() => { setEditingUser(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Create User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search name or email..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="pl-10 h-11 bg-card border-border" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[130px] h-11 bg-card border-border">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[130px] h-11 bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[140px] h-11 bg-card border-border">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="login">Last Login</SelectItem>
            <SelectItem value="counts">Most Active</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3">
        {filtered.map(u => {
          const isActive = u.status === 'active';
          return (
            <div key={u.id} className="wine-glass-effect rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-full bg-primary/15 flex items-center justify-center text-base font-heading font-semibold text-accent">
                  {u.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{u.name}</p>
                    <span className="wine-badge bg-secondary text-secondary-foreground text-[10px]">
                      {u.role === 'admin' ? <Shield className="w-3 h-3 mr-0.5" /> : <User className="w-3 h-3 mr-0.5" />}
                      {u.role}
                    </span>
                    {isActive ? (
                      <span className="wine-badge stock-healthy text-[10px]"><UserCheck className="w-3 h-3 mr-0.5" />Active</span>
                    ) : (
                      <span className="wine-badge stock-out text-[10px]"><UserX className="w-3 h-3 mr-0.5" />Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {u.totalCounts} counts • {u.jobTitle || u.role} • Last login: {new Date(u.lastLogin).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="border-border h-8 text-xs" onClick={() => { setEditingUser(u); setDialogOpen(true); }}>Edit</Button>
                    <Button variant="outline" size="sm" className="border-border h-8 text-xs text-destructive hover:bg-destructive/10">
                      {isActive ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <UserFormDialog open={dialogOpen} user={editingUser} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
