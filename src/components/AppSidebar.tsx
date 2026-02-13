import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import {
  LayoutDashboard, Wine, Package, History, BarChart3, ClipboardCheck,
  LogOut, Settings, User, Plus, ScanLine, Truck, FolderTree
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import type { ModuleKey } from '@/data/referenceData';
import { useAppSetting } from '@/hooks/useAppSettings';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavItemDef {
  label: string;
  icon: React.ElementType;
  path: string;
  module: ModuleKey;
}

interface NavGroup {
  title?: string;
  items: NavItemDef[];
  comingSoon?: boolean;
}

const navGroups: NavGroup[] = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', module: 'dashboard' },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Wine Inventory', icon: Wine, path: '/catalog', module: 'catalog' },
      { label: 'Inventarisation Check', icon: ClipboardCheck, path: '/stock', module: 'stock' },
    ],
  },
  {
    title: 'Syrve Data',
    items: [
      { label: 'Products', icon: Package, path: '/products', module: 'catalog' },
      { label: 'Categories', icon: FolderTree, path: '/categories', module: 'catalog' },
    ],
  },
  {
    items: [
      { label: 'History & Logs', icon: History, path: '/history', module: 'history' },
    ],
  },
  {
    title: 'Reports',
    comingSoon: true,
    items: [
      { label: 'Reports', icon: BarChart3, path: '/reports', module: 'reports' },
    ],
  },
  {
    title: 'Suppliers / Orders',
    comingSoon: true,
    items: [],
  },
  {
    items: [
      { label: 'Settings', icon: Settings, path: '/settings', module: 'settings' },
    ],
  },
];

export default function AppSidebar() {
  const { user, logout } = useAuthStore();
  const role = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { data: hideScannerDesktop } = useAppSetting('inventory_hide_scanner_desktop', false);

  const shouldHideScanner = !isMobile && hideScannerDesktop === true;

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const filterItems = (items: NavItemDef[]) =>
    items.filter(item => {
      if (!role) return false;
      // Hide "Start Count" on desktop when setting enabled
      if (shouldHideScanner && item.path === '/count') return false;
      // Admin sees everything, staff sees non-restricted
      if (role.id === 'admin' || role.id === 'super_admin') return true;
      const restricted: ModuleKey[] = ['settings' as ModuleKey, 'users' as ModuleKey];
      return !restricted.includes(item.module);
    });

  return (
    <>
      {/* Mobile top header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg wine-gradient flex items-center justify-center">
            <Wine className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-heading text-base font-semibold text-foreground">Parra</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-1.5" />
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user?.displayName?.charAt(0)}
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-sidebar z-50 border-r border-sidebar-border flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl wine-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <Wine className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-lg font-semibold text-foreground">Parra</h1>
              <p className="text-xs text-muted-foreground">by Trusker Solutions</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navGroups.map((group, gi) => {
            const visibleItems = filterItems(group.items);
            // Hide group if it has items but none are visible (except coming soon placeholders)
            if (group.items.length > 0 && visibleItems.length === 0) return null;

            return (
              <div key={gi}>
                {/* Group separator line (not before first group) */}
                {gi > 0 && <div className="my-2 mx-2 border-t border-sidebar-border/60" />}

                {/* Group title */}
                {group.title && (
                  <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </span>
                    {group.comingSoon && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                        Soon
                      </span>
                    )}
                  </div>
                )}

                {/* Coming soon placeholder with no items */}
                {group.comingSoon && group.items.length === 0 && (
                  <div className="px-3 py-2 flex items-center gap-3 text-muted-foreground/50">
                    <Truck className="w-5 h-5" />
                    <span className="text-sm">Coming soon</span>
                  </div>
                )}

                {/* Nav items */}
                {visibleItems.map(item => (
                  <button
                    key={item.path}
                    onClick={() => !group.comingSoon && navigate(item.path)}
                    className={`nav-item w-full ${isActive(item.path) ? 'active' : ''} ${
                      group.comingSoon ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={group.comingSoon}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => navigate('/profile')} className="flex items-center gap-3 flex-1 min-w-0 rounded-lg p-2 -mx-2 hover:bg-sidebar-accent transition-colors">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-wine-burgundy flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
                {user?.displayName?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground truncate">{user?.displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{role?.name}</p>
              </div>
            </button>
            <ThemeToggle />
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="nav-item w-full text-destructive hover:bg-destructive/10">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
