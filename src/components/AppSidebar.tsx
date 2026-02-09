import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import {
  LayoutDashboard, Wine, Package, Users, History, BarChart3, ClipboardCheck,
  LogOut, Settings, User
} from 'lucide-react';
import type { ModuleKey } from '@/data/referenceData';

interface NavItemDef {
  label: string;
  icon: React.ElementType;
  path: string;
  module: ModuleKey;
}

const allNav: NavItemDef[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', module: 'dashboard' },
  { label: 'Inventory', icon: Package, path: '/stock', module: 'stock' },
  { label: 'Wine Catalog', icon: Wine, path: '/catalog', module: 'catalog' },
  { label: 'User Management', icon: Users, path: '/users', module: 'users' },
  { label: 'History & Audit', icon: History, path: '/history', module: 'history' },
  { label: 'Session Review', icon: ClipboardCheck, path: '/sessions', module: 'sessions' },
  { label: 'Reports', icon: BarChart3, path: '/reports', module: 'reports' },
  { label: 'Settings', icon: Settings, path: '/settings', module: 'settings' },
];

export default function AppSidebar() {
  const { user, logout } = useAuthStore();
  const role = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const nav = allNav.filter((item) => {
    if (!role) return false;
    return role.permissions[item.module] !== 'none';
  });

  return (
    <>
      {/* Mobile top header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg wine-gradient flex items-center justify-center">
            <Wine className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-base font-semibold text-foreground">Cellar</h1>
        </div>
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-xs font-bold text-primary-foreground">
          {user?.name?.charAt(0)}
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-sidebar z-50 border-r border-sidebar-border flex-col">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl wine-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <Wine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-foreground">Cellar</h1>
              <p className="text-xs text-muted-foreground">Wine Inventory</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item w-full ${location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 mb-3 w-full rounded-lg p-2 -mx-2 hover:bg-sidebar-accent transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{role?.name}</p>
            </div>
          </button>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="nav-item w-full text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
