import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import WineCatalog from "./pages/WineCatalog";
import WineDetail from "./pages/WineDetail";
import WineForm from "./pages/WineForm";
import InventoryCount from "./pages/InventoryCount";
import CurrentStock from "./pages/CurrentStock";
import InventoryHistory from "./pages/InventoryHistory";
import SessionReview from "./pages/SessionReview";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/catalog" element={<WineCatalog />} />
            <Route path="/catalog/new" element={<WineForm />} />
            <Route path="/catalog/:id" element={<WineDetail />} />
            <Route path="/catalog/:id/edit" element={<WineForm />} />
            <Route path="/count" element={<InventoryCount />} />
            <Route path="/stock" element={<CurrentStock />} />
            <Route path="/history" element={<InventoryHistory />} />
            <Route path="/sessions" element={<SessionReview />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<AppSettings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
