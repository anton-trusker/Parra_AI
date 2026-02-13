import { useAuthStore, useUserRole } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Wine, Clock, BarChart3, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const role = useUserRole();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const stats = [
    { label: 'Total Counts', value: '47', icon: Wine },
    { label: 'This Week', value: '12', icon: BarChart3 },
    { label: 'Avg/Day', value: '3.2', icon: Clock },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="wine-glass-effect rounded-2xl p-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center mb-4">
          <span className="text-3xl font-heading font-bold text-primary-foreground">
            {user?.displayName?.charAt(0)}
          </span>
        </div>
        <h1 className="text-2xl font-heading font-bold">{user?.displayName}</h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className="wine-badge bg-primary/15 text-primary">
            <Shield className="w-3 h-3 mr-1" />
            {role?.name ?? 'Unknown'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="stat-card text-center">
            <s.icon className="w-5 h-5 mx-auto mb-2 text-accent" />
            <p className="text-xl font-bold font-heading">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className="wine-glass-effect rounded-2xl p-6 space-y-4">
        <h2 className="font-heading text-lg font-semibold">Account Details</h2>
        <Separator className="bg-border" />
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium">{user?.displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Mail className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
              <Shield className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium capitalize">{role?.name ?? 'Unknown'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {isAdmin && (
          <Button variant="outline" className="w-full h-12 border-border justify-start gap-3" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4" /> App Settings
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full h-12 border-border justify-start gap-3 text-destructive hover:bg-destructive/10"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>
    </div>
  );
}
