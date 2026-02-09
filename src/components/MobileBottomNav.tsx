import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
  LayoutDashboard, Wine, Package, History, BarChart3, Settings, Users, MoreHorizontal, ClipboardCheck
} from 'lucide-react';
import { useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger
} from '@/components/ui/sheet';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const adminPrimaryNav: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Count', icon: Wine, path: '/count' },
  { label: 'Stock', icon: Package, path: '/stock' },
  { label: 'Catalog', icon: Wine, path: '/catalog' },
];

const adminMoreNav: NavItem[] = [
  { label: 'User Management', icon: Users, path: '/users' },
  { label: 'History & Audit', icon: History, path: '/history' },
  { label: 'Session Review', icon: ClipboardCheck, path: '/sessions' },
  { label: 'Reports', icon: BarChart3, path: '/reports' },
  { label: 'Settings', icon: Settings, path: '/settings' },
];

const staffPrimaryNav: NavItem[] = [
  { label: 'Home', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Count', icon: Wine, path: '/count' },
  { label: 'History', icon: History, path: '/history' },
];

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  const primaryNav = isAdmin ? adminPrimaryNav : staffPrimaryNav;
  const moreNav = isAdmin ? adminMoreNav : [];
  const hasMore = moreNav.length > 0;

  const isActive = (path: string) => location.pathname === path;
  const isMoreActive = moreNav.some(item => isActive(item.path));

  const handleNav = (path: string) => {
    navigate(path);
    setMoreOpen(false);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border">
      {/* Safe area for iOS */}
      <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {primaryNav.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNav(item.path)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] transition-colors ${
              isActive(item.path)
                ? 'text-[hsl(var(--wine-gold))]'
                : 'text-[hsl(var(--sidebar-foreground))]'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}

        {hasMore && (
          <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg min-w-[64px] transition-colors ${
                  isMoreActive
                    ? 'text-[hsl(var(--wine-gold))]'
                    : 'text-[hsl(var(--sidebar-foreground))]'
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
                        ? 'bg-[hsl(var(--wine-red)/0.15)] text-[hsl(var(--wine-gold))]'
                        : 'text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]'
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
