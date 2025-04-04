
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './components/ui/theme-provider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import ProfilePage from './pages/profile/ProfilePage';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/error/Unauthorized';
import SetupWizard from './pages/setup/SetupWizard';
import AdminPanel from './pages/admin/AdminPanel';
import AssociationsList from './pages/association/AssociationsList';
import AssociationDetails from './pages/association/AssociationDetails';
import InventoryList from './pages/inventory/InventoryList';
import ConventionsList from './pages/conventions/ConventionsList';
import ReportsList from './pages/reports/ReportsList';

// Layouts
import MainLayout from './components/layout/MainLayout';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import GuestGuard from './components/guards/GuestGuard';
import { RoleGuard } from './components/auth/RoleGuard';

// Providers
import { Toaster } from './components/ui/toaster';

const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
      <AuthProvider>
        <AssociationProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              
              {/* Guest routes (redirect to dashboard if authenticated) */}
              <Route element={<GuestGuard><Outlet /></GuestGuard>}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              
              {/* Special routes */}
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected routes */}
              <Route element={<AuthGuard><Outlet /></AuthGuard>}>
                {/* Setup route */}
                <Route path="/setup" element={<SetupWizard />} />
                
                {/* Routes with main layout */}
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  <Route path="/inventory" element={<InventoryList />} />
                  <Route path="/conventions" element={<ConventionsList />} />
                  <Route path="/reports" element={<ReportsList />} />
                  
                  <Route path="/associations" element={<AssociationsList />} />
                  <Route path="/associations/:id" element={<AssociationDetails />} />
                  
                  {/* Admin routes */}
                  <Route element={
                    <RoleGuard allowedRoles={['admin', 'super_admin']} fallbackPath="/unauthorized">
                      <Outlet />
                    </RoleGuard>
                  }>
                    <Route path="/admin" element={<AdminPanel />} />
                  </Route>
                </Route>
              </Route>
              
              {/* Error pages */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AssociationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
