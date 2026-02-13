import { useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Link, Navigate } from 'react-router-dom';
import {
  Settings,
  Database,
  Bell,
  Shield,
  SlidersHorizontal,
  Users,
  Server
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AppSettings() {
  const { user } = useAuthStore();

  // Basic role check - detailed check is done in App.tsx routes
  // But good to redirect if somehow landed here
  // Note: user.roleId is 'role_admin' or 'role_staff'
  if (user?.roleId !== 'role_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const sections = [
    {
      icon: Server,
      title: 'Syrve Integration',
      desc: 'Connect to Syrve Server, sync products, and configure inventory settings.',
      href: '/settings/syrve'
    },
    {
      icon: SlidersHorizontal,
      title: 'General',
      desc: 'Manage locations, glass dimensions, bottle volumes, and measurement units',
      href: '/settings/general'
    },
    {
      icon: Shield,
      title: 'Roles & Permissions',
      desc: 'Create custom roles and configure granular access rights',
      href: '/settings/roles'
    },
    {
      icon: Users,
      title: 'User Management',
      desc: 'Add, edit, and manage user accounts and role assignments',
      href: '/users'
    },
    {
      icon: Database,
      title: 'Database',
      desc: 'Manage wine catalog backups and data import/export',
      // href: '/settings/database' (Future)
    },
    {
      icon: Bell,
      title: 'Notifications',
      desc: 'Configure low stock alerts and notification preferences',
      // href: '/settings/notifications' (Future)
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your inventory system and integrations.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Content = (
            <Card className="h-full hover:bg-accent/50 transition-all cursor-pointer hover:shadow-md border-border/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <s.icon className="h-5 w-5" />
                  </div>
                  {s.title}
                </CardTitle>
                <CardDescription className="pt-1">
                  {s.desc}
                </CardDescription>
              </CardHeader>
            </Card>
          );

          return s.href ? (
            <Link key={s.title} to={s.href} className="block h-full">
              {Content}
            </Link>
          ) : (
            <div key={s.title} className="opacity-60 cursor-not-allowed h-full">
              {Content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
