import { useState } from 'react';
import { mockUsers, MockUser } from '@/data/mockWines';
import { useRolesConfig } from '@/hooks/useRolesConfig';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormDialogProps {
  user?: MockUser | null;
  open: boolean;
  onClose: () => void;
}

export default function UserFormDialog({ user, open, onClose }: UserFormDialogProps) {
  const { data: roles = [] } = useRolesConfig();
  const isEdit = !!user;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    roleId: user?.role === 'admin' ? 'role_admin' : 'role_staff',
    status: user?.status || 'active',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    notes: user?.notes || '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = () => {
    if (!form.name || !form.email) {
      toast.error('Name and Email are required');
      return;
    }
    if (!isEdit && !form.password) {
      toast.error('Password is required for new users');
      return;
    }
    toast.success(isEdit ? 'User updated' : 'User created');
    onClose();
  };

  if (!open) return null;

  const pwStrength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const pwColors = ['', 'bg-destructive', 'bg-wine-warning', 'bg-wine-success'];
  const pwLabels = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading text-xl font-semibold">{isEdit ? 'Edit User' : 'Create User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5 text-muted-foreground" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="bg-secondary border-border" /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} className="bg-secondary border-border" /></div>
          </div>

          <div className="space-y-1.5">
            <Label>{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</Label>
            <Input type="password" value={form.password} onChange={e => update('password', e.target.value)} className="bg-secondary border-border" />
            {form.password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= pwStrength ? pwColors[pwStrength] : 'bg-secondary'}`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{pwLabels[pwStrength]}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.roleId} onValueChange={v => update('roleId', v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color || '#6b7280' }} />
                        {r.role_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="bg-secondary border-border" /></div>
            <div className="space-y-1.5"><Label>Job Title</Label><Input value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} className="bg-secondary border-border" /></div>
          </div>

          <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={e => update('department', e.target.value)} className="bg-secondary border-border" /></div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} className="bg-secondary border-border" rows={2} /></div>

          {isEdit && user && (
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
              <p>Total Counts: {user.totalCounts}</p>
              <p>Last Login: {new Date(user.lastLogin).toLocaleString()}</p>
              {user.createdAt && <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-5 border-t border-border">
          {isEdit ? (
            <Button variant="outline" size="sm" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => { toast.info('Delete feature coming soon'); }}>
              <Trash2 className="w-4 h-4 mr-1" /> Delete User
            </Button>
          ) : <div />}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="border-border">Cancel</Button>
            <Button onClick={handleSave} className="wine-gradient text-primary-foreground hover:opacity-90">
              <Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
