import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, useUserRole } from '@/stores/authStore';
import {
  LayoutDashboard, Package, FolderTree, Warehouse, ClipboardCheck, Bot, History,
  BarChart3, ShoppingCart, Settings, Users, LogOut, User, ChevronDown, Menu, X, ScanLine
} from 'lucide-react';
import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ThemeToggle from '@/components/ThemeToggle';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles?: string[];
  accent?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navGroups: NavGroup[] = [
  {
    label: '',
    defaultOpen: true,
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    ],
  },
  {
    label: 'Inventory',
    defaultOpen: true,
    items: [
      { label: 'Products', icon: Package, path: '/products' },
      { label: 'Categories', icon: FolderTree, path: '/categories' },
      { label: 'By Store', icon: Warehouse, path: '/inventory/by-store' },
      { label: 'Sessions', icon: ClipboardCheck, path: '/inventory/checks' },
      { label: 'Count Now', icon: ScanLine, path: '/count', accent: true },
      { label: 'AI Scans', icon: Bot, path: '/inventory/ai-scans' },
    ],
  },
  {
    label: 'Analytics',
    defaultOpen: false,
    items: [
      { label: 'History & Logs', icon: History, path: '/history' },
      { label: 'Reports', icon: BarChart3, path: '/reports' },
      { label: 'Orders', icon: ShoppingCart, path: '/orders' },
    ],
  },
  {
    label: 'Administration',
    defaultOpen: false,
    items: [
      { label: 'Users', icon: Users, path: '/users', roles: ['admin', 'super_admin'] },
      { label: 'Settings', icon: Settings, path: '/settings', roles: ['admin', 'super_admin'] },
    ],
  },
];

export default function AppSidebar() {
  const { user, logout } = useAuthStore();
  const role = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path + '/'));
  const isGroupActive = (items: NavItem[]) => items.some((i) => isActive(i.path));

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role.id);
  };

  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : (user as any)?.displayName?.charAt(0) ?? 'U';

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground">Parra</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">Inventory Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;

          if (!group.label) {
            return visibleItems.map((item) => (
              <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => { navigate(item.path); setMobileOpen(false); }} />
            ));
          }

          return (
            <Collapsible key={group.label} defaultOpen={group.defaultOpen || isGroupActive(visibleItems)}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2.5 mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group">
                {group.label}
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-0.5 mt-0.5">
                {visibleItems.map((item) => (
                  <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => { navigate(item.path); setMobileOpen(false); }} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3 space-y-2">
        <ThemeToggle />
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="relative">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{(user as any)?.displayName ?? user?.email ?? 'User'}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 capitalize">{(role as any)?.label ?? (role as any)?.name ?? 'user'}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => navigate('/profile')}>
            <User className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive" onClick={() => { logout(); navigate('/login'); }}>
          <LogOut className="w-4 h-4" />Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1">
            {mobileOpen ? <X className="w-5 h-5 text-foreground" /> : <Menu className="w-5 h-5 text-foreground" />}
          </button>
          <h1 className="font-bold text-base text-foreground">Parra</h1>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="p-1.5" />
          <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {initials}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-64 bg-sidebar z-50 border-r border-sidebar-border flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
        active
          ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary -ml-px pl-[11px]'
          : item.accent
            ? 'text-primary/80 hover:bg-primary/8 hover:text-primary font-medium'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${active ? 'text-primary' : item.accent ? 'text-primary/70' : ''}`} />
      <span className="truncate">{item.label}</span>
    </button>
  );
}
