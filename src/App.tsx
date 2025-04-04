
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { AssociationProvider } from "./contexts/AssociationContext";

// Layout
import MainLayout from "./components/layout/MainLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Protected Pages
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/error/Unauthorized";
import NotFound from "./pages/NotFound";

// Guards
import AuthGuard from "./components/guards/AuthGuard";
import GuestGuard from "./components/guards/GuestGuard";
import { RoleGuard } from "./components/auth/RoleGuard";

// Create pages - these will be implemented incrementally
import SetupWizard from "./pages/setup/SetupWizard";
import AssociationsList from "./pages/association/AssociationsList";
import AssociationDetails from "./pages/association/AssociationDetails";
import InventoryList from "./pages/inventory/InventoryList";
import ConventionsList from "./pages/conventions/ConventionsList";
import ReportsList from "./pages/reports/ReportsList";
import Settings from "./pages/settings/Settings";
import AdminPanel from "./pages/admin/AdminPanel";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AssociationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Guest routes */}
              <Route 
                path="/login" 
                element={
                  <GuestGuard>
                    <Login />
                  </GuestGuard>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <GuestGuard>
                    <Register />
                  </GuestGuard>
                } 
              />
              
              {/* Setup wizard (for new users) */}
              <Route
                path="/setup"
                element={
                  <AuthGuard>
                    <SetupWizard />
                  </AuthGuard>
                }
              />

              {/* Protected routes */}
              <Route element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Association management */}
                <Route path="/association">
                  <Route index element={<AssociationsList />} />
                  <Route path=":id" element={<AssociationDetails />} />
                </Route>
                
                {/* Inventory management */}
                <Route path="/inventory">
                  <Route index element={<InventoryList />} />
                  {/* Additional inventory routes will be added as needed */}
                </Route>
                
                {/* Convention management */}
                <Route path="/conventions">
                  <Route index element={<ConventionsList />} />
                  {/* Additional convention routes will be added as needed */}
                </Route>
                
                <Route path="/reports" element={<ReportsList />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Admin routes with role guard */}
                <Route path="/admin/*" element={
                  <RoleGuard allowedRoles={["admin", "super_admin"]}>
                    <AdminPanel />
                  </RoleGuard>
                } />
              </Route>

              {/* Error pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AssociationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
