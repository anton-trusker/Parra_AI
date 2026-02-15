import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./components/AuthProvider";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ImportInventory from "./pages/ImportInventory";
import InventoryCount from "./pages/InventoryCount";
import CurrentStock from "./pages/CurrentStock";
import InventoryHistory from "./pages/InventoryHistory";
import SessionReview from "./pages/SessionReview";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import AppSettings from "./pages/AppSettings";
import GeneralSettings from "./pages/GeneralSettings";
import RolesPermissions from "./pages/RolesPermissions";
import Profile from "./pages/Profile";
import SyrveSettings from "./pages/SyrveSettings";
import SyrveSyncPage from "./pages/SyrveSyncPage";
import SyrveTestingPage from "./pages/SyrveTestingPage";
import BusinessSettings from "./pages/BusinessSettings";
import InventorySettings from "./pages/InventorySettings";
import AiSettings from "./pages/AiSettings";
import ProductCatalog from "./pages/ProductCatalog";
import ProductDetail from "./pages/ProductDetail";
import CategoriesPage from "./pages/CategoriesPage";
import NotFound from "./pages/NotFound";
import { useThemeStore } from "./stores/themeStore";

const queryClient = new QueryClient();

function ThemeApplicator({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeApplicator>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<ProductCatalog />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/count" element={<InventoryCount />} />
                <Route path="/stock" element={<CurrentStock />} />
                <Route path="/history" element={<InventoryHistory />} />
                <Route path="/sessions" element={<Navigate to="/stock" replace />} />
                <Route path="/users" element={<UserManagement />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<AppSettings />} />
                <Route path="/settings/general" element={<GeneralSettings />} />
                <Route path="/settings/roles" element={<RolesPermissions />} />
                <Route path="/settings/syrve" element={<SyrveSettings />} />
                <Route path="/settings/syrve/sync" element={<SyrveSyncPage />} />
                <Route path="/settings/syrve/testing" element={<SyrveTestingPage />} />
                <Route path="/settings/business" element={<BusinessSettings />} />
                <Route path="/settings/inventory" element={<InventorySettings />} />
                <Route path="/settings/ai" element={<AiSettings />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeApplicator>
  </QueryClientProvider>
);

export default App;
