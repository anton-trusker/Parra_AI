import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import AppSidebar from './AppSidebar';
import MobileBottomNav from './MobileBottomNav';
import TopBar from './TopBar';

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
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="lg:ml-64 min-h-screen flex flex-col">
        <TopBar />
        <div className="flex-1 p-4 lg:p-8 pt-16 lg:pt-6 pb-24 lg:pb-8">
          <Outlet />
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
