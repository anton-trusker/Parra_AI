import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  ChevronRight,
  ChevronLeft,
  Store,
  Package2,
  UserCircle,
  ChevronDown,
  ClipboardList,
  BarChart3,
  RefreshCw,
  BrainCircuit,
  Upload,
  Layers
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Current Stock',
    href: '/stock',
    icon: Package2,
  },
  {
    title: 'Inventory Checks',
    href: '/inventory',
    icon: ClipboardList,
    children: [
      { title: 'Checks', href: '/inventory/checks', icon: ClipboardList },
      { title: 'History', href: '/inventory/history', icon: Clock },
    ],
  },
  {
    title: 'Products',
    href: '/products',
    icon: Package,
    children: [
      { title: 'Catalog', href: '/products/catalog', icon: Package },
      { title: 'Categories', href: '/categories', icon: Layers },
      { title: 'Stock Levels', href: '/stock-levels', icon: BarChart3 },
    ],
  },
  {
    title: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Syrve Integration',
    href: '/syrve',
    icon: RefreshCw,
    children: [
      { title: 'Sync', href: '/syrve/sync', icon: RefreshCw },
      { title: 'Settings', href: '/syrve/settings', icon: Settings },
      { title: 'Testing', href: '/syrve/testing', icon: Activity },
    ],
  },
  {
    title: 'AI Intelligence',
    href: '/ai',
    icon: BrainCircuit,
    children: [
      { title: 'Scans', href: '/ai/scans', icon: BrainCircuit },
      { title: 'Settings', href: '/ai/settings', icon: Settings },
    ],
  },
  {
    title: 'Import',
    href: '/import',
    icon: Upload,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { title: 'General', href: '/settings/general', icon: Settings },
      { title: 'Business', href: '/settings/business', icon: Store },
      { title: 'Inventory', href: '/settings/inventory', icon: Package },
      { title: 'Billing', href: '/settings/billing', icon: CreditCard },
      { title: 'Users', href: '/settings/users', icon: Users },
      { title: 'Roles', href: '/settings/roles', icon: Shield },
    ],
  },
];

// Additional icons needed for submenus
import { Clock, Activity, CreditCard, Shield } from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const location = useLocation();
  const { user } = useAuthStore();

  // Auto-expand based on current route
  useEffect(() => {
    const activeParent = navigationItems.find(item => 
      item.children?.some(child => location.pathname.startsWith(child.href))
    );
    if (activeParent) {
      setExpandedItems(prev => new Set(prev).add(activeParent.title));
    }
  }, [location.pathname]);

  const toggleItem = (title: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(title)) {
      newExpanded.delete(title);
    } else {
      newExpanded.add(title);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/dashboard') return true;
    if (href !== '/dashboard' && location.pathname.startsWith(href)) return true;
    return false;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.title);
    const active = isActive(item.href);
    const isChildActive = item.children?.some(child => isActive(child.href));

    if (hasChildren) {
      return (
        <Collapsible key={item.href} open={isExpanded} onOpenChange={() => toggleItem(item.title)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start text-left font-normal h-9 px-3 mb-1',
                'hover:bg-accent hover:text-accent-foreground',
                'data-[state=open]:bg-accent/50',
                (active || isChildActive) && 'text-primary font-medium',
                isCollapsed && 'justify-center px-2'
              )}
            >
              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                <item.icon className={cn("h-4 w-4 shrink-0", (active || isChildActive) ? "text-primary" : "text-muted-foreground")} />
                {!isCollapsed && (
                  <>
                    <span className="text-sm truncate">{item.title}</span>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 ml-auto transition-transform text-muted-foreground/70',
                      isExpanded && 'rotate-180'
                    )} />
                  </>
                )}
              </div>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4 space-y-1 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            {!isCollapsed && item.children!.map((child) => renderNavItem(child, level + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.href} to={item.href} className="block mb-1">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left font-normal h-9 px-3',
            'hover:bg-accent hover:text-accent-foreground',
            active && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-medium',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <item.icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
            {!isCollapsed && (
              <span className="text-sm truncate">{item.title}</span>
            )}
          </div>
        </Button>
      </Link>
    );
  };

  return (
    <div className={cn(
      'flex flex-col h-full bg-card border-r border-border transition-all duration-300 ease-in-out z-20',
      isCollapsed ? 'w-[60px]' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className={cn(
        'flex items-center h-14 border-b border-border px-3',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-bold truncate">Inventory Hub</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="px-3 space-y-1">
          {navigationItems.map((item) => renderNavItem(item))}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="p-3 border-t border-border mt-auto">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-left font-normal h-12 px-2',
            'hover:bg-accent hover:text-accent-foreground',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-medium truncate w-full">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{user?.role || 'User'}</span>
              </div>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
}
