
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProfilePage from './pages/profile/ProfilePage';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/error/Unauthorized';
import AdminPanel from './pages/admin/AdminPanel';

// Layouts
import MainLayout from './components/layout/MainLayout';
import MainLayoutWrapper from './components/layout/MainLayoutWrapper';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import GuestGuard from './components/guards/GuestGuard';
import { RoleGuard } from './components/auth/RoleGuard';

// Core application with simplified routing
const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
        <AuthProvider>
          <AssociationProvider>
            <Router>
              <Routes>
                {/* Public routes with Footer */}
                <Route path="/" element={<MainLayoutWrapper />}>
                  <Route index element={<Index />} />
                </Route>
                
                {/* Guest routes (redirect to dashboard if authenticated) */}
                <Route element={<MainLayoutWrapper />}>
                  <Route element={<GuestGuard><Outlet /></GuestGuard>}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                  </Route>
                  
                  {/* Special routes */}
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>
                
                {/* Protected routes with main layout */}
                <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Admin routes */}
                  <Route element={
                    <RoleGuard allowedRoles={['admin', 'system_admin', 'super_admin']} fallbackPath="/unauthorized">
                      <Outlet />
                    </RoleGuard>
                  }>
                    <Route path="/admin" element={<AdminPanel />} />
                  </Route>
                </Route>
                
                {/* Error pages */}
                <Route element={<MainLayoutWrapper />}>
                  <Route path="/unauthorized" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Router>
            <Toaster />
          </AssociationProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
