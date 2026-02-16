import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/ui/enhanced-sidebar';
import MobileBottomNav from './MobileBottomNav';
import TopBar from './TopBar';
import { CompactThemeProvider } from '@/components/ui/compact-theme';

export default function AppLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <CompactThemeProvider defaultCompact={false} persistKey="parra-compact-theme">
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block h-full shrink-0 z-30">
          <Sidebar className="h-full border-r" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-muted/5">
          <TopBar />
          
          <main className="flex-1 overflow-auto p-4 lg:p-6 pb-24 lg:pb-8 scroll-smooth">
            <div className="max-w-[1600px] mx-auto w-full animate-fade-in">
              <Outlet />
            </div>
          </main>
        </div>
        
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileBottomNav />
        </div>
      </div>
    </CompactThemeProvider>
  );
}
