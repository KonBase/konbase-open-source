import { BrowserRouter as Router, Routes, Route, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';
import { useEffect } from 'react';
import { processOAuthRedirect } from './utils/oauth-utils';
import { useToast } from './hooks/use-toast';
import { supabase } from './lib/supabase';

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

// Association Pages
import AssociationProfile from './pages/association/AssociationProfile';
import AssociationMembers from './pages/association/AssociationMembers';
import AssociationsList from './pages/association/AssociationsList';

// Inventory Pages
import InventoryList from './pages/inventory/InventoryList';
import ItemCategories from './pages/inventory/ItemCategories';
import ItemLocations from './pages/inventory/ItemLocations';
import EquipmentSets from './pages/inventory/EquipmentSets';
import WarrantiesDocuments from './pages/inventory/WarrantiesDocuments';
import ImportExport from './pages/inventory/ImportExport';

// Convention Pages
import ConventionsList from './pages/conventions/ConventionsList';
import ConventionDetails from './pages/conventions/ConventionDetails';
import ConventionRequirements from './pages/conventions/ConventionRequirements';
import ConventionLogs from './pages/conventions/ConventionLogs';
import ConventionArchive from './pages/conventions/ConventionArchive';
import ConventionTemplates from './pages/conventions/ConventionTemplates';

// Report Pages
import ReportsList from './pages/reports/ReportsList';

// Communication Pages
import ChatPage from './pages/chat/ChatPage';

// Layouts
import MainLayout from './components/layout/MainLayout';
import MainLayoutWrapper from './components/layout/MainLayoutWrapper';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import GuestGuard from './components/guards/GuestGuard';
import { RoleGuard } from './components/auth/RoleGuard';

// OAuth Handler component to process redirects
const OAuthRedirectHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const handleOAuthRedirect = async () => {
      // Only process OAuth redirects if we have a hash in the URL
      if (window.location.hash && window.location.hash.includes('access_token')) {
        const { success, error } = await processOAuthRedirect();
        
        if (success) {
          toast({
            title: 'Authentication successful',
            description: 'You have been successfully authenticated.',
          });
          
          // Navigate to dashboard after successful authentication
          navigate('/dashboard', { replace: true });
        } else {
          console.error('OAuth redirect handling failed:', error);
          toast({
            variant: 'destructive',
            title: 'Authentication failed',
            description: 'Could not complete the authentication process. Please try again.',
          });
          navigate('/login', { replace: true });
        }
      }
    };

    handleOAuthRedirect();
  }, [navigate, toast, location]);

  return null;
};

// Core application with simplified routing
const App = () => {
  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
          <AuthProvider>
            <AssociationProvider>
              <OAuthRedirectHandler />
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
                  
                  {/* Association routes */}
                  <Route path="/association">
                    <Route path="profile" element={<AssociationProfile />} />
                    <Route path="members" element={<AssociationMembers />} />
                    <Route path="list" element={<AssociationsList />} />
                  </Route>
                  
                  {/* Inventory routes */}
                  <Route path="/inventory">
                    <Route path="items" element={<InventoryList />} />
                    <Route path="categories" element={<ItemCategories />} />
                    <Route path="locations" element={<ItemLocations />} />
                    <Route path="sets" element={<EquipmentSets />} />
                    <Route path="warranties" element={<WarrantiesDocuments />} />
                    <Route path="import-export" element={<ImportExport />} />
                  </Route>
                  
                  {/* Convention routes */}
                  <Route path="/conventions">
                    <Route index element={<ConventionsList />} />
                    <Route path=":id" element={<ConventionDetails />} />
                    <Route path="requirements" element={<ConventionRequirements />} />
                    <Route path="logs" element={<ConventionLogs />} />
                    <Route path="archive" element={<ConventionArchive />} />
                  </Route>
                  
                  {/* Templates route */}
                  <Route path="/templates" element={<ConventionTemplates />} />
                  
                  {/* Reports route */}
                  <Route path="/reports" element={<ReportsList />} />
                  
                  {/* Communication routes */}
                  <Route path="/chat" element={<ChatPage />} />
                  
                  {/* Admin routes - Restricted to system_admin and super_admin only */}
                  <Route element={
                    <RoleGuard allowedRoles={['system_admin', 'super_admin']} fallbackPath="/unauthorized">
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
              <Toaster />
            </AssociationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
};

export default App;
