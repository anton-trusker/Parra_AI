import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import {
  LayoutDashboard, Wine, Package, History, BarChart3, Settings, Users, MoreHorizontal, ClipboardCheck, User
} from 'lucide-react';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';
import type { ModuleKey } from '@/data/referenceData';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  module: ModuleKey;
  primary?: boolean;
}

const allNavItems: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard', module: 'dashboard', primary: true },
  { label: 'Inventory', icon: Package, path: '/stock', module: 'stock', primary: true },
  { label: 'Catalog', icon: Wine, path: '/catalog', module: 'catalog', primary: true },
  { label: 'History', icon: History, path: '/history', module: 'history', primary: true },
  { label: 'Users', icon: Users, path: '/users', module: 'users' },
  { label: 'Sessions', icon: ClipboardCheck, path: '/sessions', module: 'sessions' },
  { label: 'Reports', icon: BarChart3, path: '/reports', module: 'reports' },
  { label: 'Settings', icon: Settings, path: '/settings', module: 'settings' },
];

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const role = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const visibleItems = allNavItems.filter((item) => {
    if (!role) return false;
    if (role.id === 'admin') return true;
    const restricted = ['settings', 'users'];
    return !restricted.includes(item.module);
  });

  const primaryNav = visibleItems.filter((i) => i.primary).slice(0, 4);
  const moreNav = [
    ...visibleItems.filter((i) => !i.primary),
    { label: 'Profile', icon: User, path: '/profile', module: 'dashboard' as ModuleKey },
  ];
  const hasMore = moreNav.length > 0;

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNav.some(item => isActive(item.path));

  const handleNav = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-t border-sidebar-border">
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {primaryNav.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] transition-all ${
              isActive(item.path)
                ? 'text-accent'
                : 'text-muted-foreground'
            }`}
          >
            <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'drop-shadow-[0_0_6px_hsl(var(--wine-gold)/0.5)]' : ''}`} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        {hasMore && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] transition-all ${
                  isMoreActive ? 'text-accent' : 'text-muted-foreground'
                }`}
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="text-[10px] font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="bg-sidebar border-sidebar-border rounded-t-2xl">
              <SheetHeader>
                <SheetTitle className="text-foreground">More</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 py-4">
                {moreNav.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary/15 text-accent'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
