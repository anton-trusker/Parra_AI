import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/hooks/useErrorBoundary';
import AppLayout from '@/components/AppLayout';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import CurrentStock from '@/pages/CurrentStock';
import InventoryChecksPage from '@/pages/InventoryChecksPage';
import InventoryCheckDetail from '@/pages/InventoryCheckDetail';
import InventoryCount from '@/pages/InventoryCount';
import InventoryHistory from '@/pages/InventoryHistory';
import ProductCatalog from '@/pages/ProductCatalog';
import ProductDetail from '@/pages/ProductDetail';
import CategoriesPage from '@/pages/CategoriesPage';
import StockPage from '@/pages/StockPage';
import OrdersPage from '@/pages/OrdersPage';
import Reports from '@/pages/Reports';
import SyrveSyncPage from '@/pages/SyrveSyncPage';
import SyrveSettings from '@/pages/SyrveSettings';
import SyrveTestingPage from '@/pages/SyrveTestingPage';
import AiScansPage from '@/pages/AiScansPage';
import AiSettings from '@/pages/AiSettings';
import UserManagement from '@/pages/UserManagement';
import RolesPermissions from '@/pages/RolesPermissions';
import BusinessSettings from '@/pages/BusinessSettings';
import AppSettings from '@/pages/AppSettings';
import GeneralSettings from '@/pages/GeneralSettings';
import BillingSettings from '@/pages/BillingSettings';
import InventorySettings from '@/pages/InventorySettings';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import ImportInventory from '@/pages/ImportInventory';
import SessionReview from '@/pages/SessionReview';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <AuthProvider>
          <ErrorBoundary>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Index />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="stock" element={<CurrentStock />} />
                  <Route path="inventory">
                    <Route index element={<InventoryChecksPage />} />
                    <Route path="checks" element={<InventoryChecksPage />} />
                    <Route path="check/:id" element={<InventoryCheckDetail />} />
                    <Route path="count/:id" element={<InventoryCount />} />
                    <Route path="history" element={<InventoryHistory />} />
                    <Route path="review/:id" element={<SessionReview />} />
                  </Route>
                  <Route path="products">
                    <Route index element={<ProductCatalog />} />
                    <Route path="catalog" element={<ProductCatalog />} />
                    <Route path=":id" element={<ProductDetail />} />
                  </Route>
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="stock-levels" element={<StockPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="syrve">
                    <Route path="sync" element={<SyrveSyncPage />} />
                    <Route path="settings" element={<SyrveSettings />} />
                    <Route path="testing" element={<SyrveTestingPage />} />
                  </Route>
                  <Route path="ai">
                    <Route path="scans" element={<AiScansPage />} />
                    <Route path="settings" element={<AiSettings />} />
                  </Route>
                  <Route path="import" element={<ImportInventory />} />
                  <Route path="settings">
                    <Route index element={<AppSettings />} />
                    <Route path="general" element={<GeneralSettings />} />
                    <Route path="business" element={<BusinessSettings />} />
                    <Route path="inventory" element={<InventorySettings />} />
                    <Route path="billing" element={<BillingSettings />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="roles" element={<RolesPermissions />} />
                  </Route>
                  <Route path="profile" element={<Profile />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </ErrorBoundary>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
