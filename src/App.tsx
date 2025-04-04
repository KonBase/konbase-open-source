
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

              {/* Protected routes */}
              <Route element={
                <AuthGuard>
                  <MainLayout />
                </AuthGuard>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* These routes will be implemented later */}
                <Route path="/association/*" element={<div className="p-8">Association Management (Coming Soon)</div>} />
                <Route path="/inventory/*" element={<div className="p-8">Inventory Management (Coming Soon)</div>} />
                <Route path="/conventions/*" element={<div className="p-8">Convention Management (Coming Soon)</div>} />
                <Route path="/reports" element={<div className="p-8">Reports (Coming Soon)</div>} />
                <Route path="/settings" element={<div className="p-8">Settings (Coming Soon)</div>} />
                
                {/* Admin routes with role guard */}
                <Route path="/admin/*" element={
                  <AuthGuard requiredRole="admin">
                    <div className="p-8">Admin Panel (Coming Soon)</div>
                  </AuthGuard>
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
