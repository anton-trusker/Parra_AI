import { useAuthStore } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { Settings, Database, Bell, Shield, SlidersHorizontal, Users } from 'lucide-react';

export default function AppSettings() {
  const { user } = useAuthStore();
  if (user?.roleId !== 'role_admin') return <Navigate to="/dashboard" replace />;

  const sections = [
    { icon: SlidersHorizontal, title: 'General', desc: 'Manage locations, glass dimensions, bottle volumes, and measurement units', href: '/settings/general' },
    { icon: Shield, title: 'Roles & Permissions', desc: 'Create custom roles and configure granular access rights', href: '/settings/roles' },
    { icon: Users, title: 'User Management', desc: 'Add, edit, and manage user accounts and role assignments', href: '/users' },
    { icon: Database, title: 'Database', desc: 'Manage wine catalog backups and data import/export' },
    { icon: Bell, title: 'Notifications', desc: 'Configure low stock alerts and notification preferences' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-heading font-bold">Settings</h1>
      <div className="space-y-3">
        {sections.map(s => {
          const content = (
            <div key={s.title} className="wine-glass-effect rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-accent/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group">
              <div className="w-12 h-12 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            </div>
          );
          return s.href ? <Link key={s.title} to={s.href}>{content}</Link> : <div key={s.title} className="opacity-60">{content}</div>;
        })}
      </div>
    </div>
  );
}
