import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Import useNavigate and useLocation
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { SessionRecovery } from '@/components/SessionRecovery';
import AuthGuard from './components/guards/AuthGuard';
import { UserRoleType } from '@/types/user';
import { isConfigured } from '@/lib/config-store';
import { useEffect } from 'react';

// Pages
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/profile/ProfilePage';
import Settings from './pages/settings/Settings';
import ErrorPage from './pages/ErrorPage';

import NotFound from './pages/NotFound';
import Unauthorized from './pages/error/Unauthorized';

// Admin pages
import AdminPanel from './pages/admin/AdminPanel';

// Association pages
import AssociationProfile from './pages/association/AssociationProfile';
import AssociationMembers from './pages/association/AssociationMembers';
import AssociationDetails from './pages/association/AssociationDetails';
import AssociationsList from './pages/association/AssociationsList';

// Convention pages
import ConventionsList from './pages/conventions/ConventionsList';
import ConventionDetails from './pages/conventions/ConventionDetails';
import ConventionArchive from './pages/conventions/ConventionArchive';
import ConventionEquipment from './pages/conventions/ConventionEquipment';
import ConventionLocations from './pages/conventions/ConventionLocations';
import ConventionLogs from './pages/conventions/ConventionLogs';
import ConventionRequirements from './pages/conventions/ConventionRequirements';
import ConventionConsumables from './pages/conventions/ConventionConsumables';
import ConventionTemplates from './pages/conventions/ConventionTemplates';

// Inventory pages
import InventoryList from './pages/inventory/InventoryList';
import InventoryItems from './pages/inventory/InventoryItems';
import ItemCategories from './pages/inventory/ItemCategories';
import ItemLocations from './pages/inventory/ItemLocations';
import StorageLocations from './pages/inventory/StorageLocations';
import WarrantiesDocuments from './pages/inventory/WarrantiesDocuments';
import EquipmentSets from './pages/inventory/EquipmentSets';
import ImportExport from './pages/inventory/ImportExport';

// Reports
import ReportsList from './pages/reports/ReportsList';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Setup pages
import FirstTimeSetup from './pages/setup/FirstTimeSetup';

// Layouts
import RootLayout from './layouts/RootLayout';

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  // Define role permissions for different routes
  const memberRoles: UserRoleType[] = ['member', 'manager', 'admin', 'system_admin', 'super_admin'];
  const managerRoles: UserRoleType[] = ['manager', 'admin', 'system_admin', 'super_admin'];
  const adminRoles: UserRoleType[] = ['admin', 'system_admin', 'super_admin'];
  const systemAdminRoles: UserRoleType[] = ['system_admin', 'super_admin'];
  const superAdminRoles: UserRoleType[] = ['super_admin'];

  // Use hooks from react-router-dom
  const navigate = useNavigate();
  const location = useLocation();
  const setupCompleted = isConfigured();

  useEffect(() => {
    const isAuthOrSetupPath = ['/setup', '/login', '/register', '/forgot-password', '/reset-password'].some(path => location.pathname.startsWith(path));

    // If setup is not completed and we are not on an allowed path, redirect using navigate
    if (!setupCompleted && !isAuthOrSetupPath) {
      navigate('/setup', { replace: true }); // Use navigate for client-side redirect
    }
    // Add location.pathname to dependency array to re-run check if path changes
  }, [setupCompleted, navigate, location.pathname]);

  // Conditionally render based on setupCompleted ONLY for the root path initially
  // The useEffect handles redirection for other paths if needed.
  // This prevents rendering protected routes before the redirect effect runs.
  if (!setupCompleted && location.pathname === '/') {
     return <Navigate to="/setup" replace />;
  }


  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
          <AuthProvider>
            <AssociationProvider>
              {/* SessionRecovery might need config, so ensure it runs after potential redirect */}
              {setupCompleted && <SessionRecovery />}
              <Routes>
                {/* Update Setup route */}
                <Route path="/setup" element={<FirstTimeSetup />} />

                {/* Keep Auth routes accessible */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Conditionally render RootLayout only if setup is complete OR if on an auth/setup path initially handled by useEffect */}
                {/* The main routing logic now assumes setup is potentially complete or handled */}
                <Route path="/" element={setupCompleted ? <RootLayout /> : null}>
                   {/* Redirect logic based on setup status for index */}
                   {/* If setup is complete, navigate to dashboard, otherwise this route won't match if RootLayout is null */}
                   <Route index element={setupCompleted ? <Navigate to="/dashboard" replace /> : null} />

                   {/* Routes requiring member role or higher */}
                   <Route path="dashboard" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <Dashboard />
                     </AuthGuard>
                   } />
                   <Route path="profile" element={
                     <AuthGuard>
                       <ProfilePage />
                     </AuthGuard>
                   } />
                   <Route path="settings" element={
                     <AuthGuard>
                       <Settings />
                     </AuthGuard>
                   } />

                   {/* Admin routes requiring admin role or higher */}
                   <Route path="admin" element={
                     <AuthGuard requiredRoles={adminRoles}>
                       <AdminPanel />
                     </AuthGuard>
                   } />

                   {/* Association routes requiring member role or higher */}
                   <Route path="associations" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <AssociationsList />
                     </AuthGuard>
                   } />
                   <Route path="association/profile" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <AssociationProfile />
                     </AuthGuard>
                   } />
                   <Route path="association/members" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <AssociationMembers />
                     </AuthGuard>
                   } />
                   <Route path="association/:id" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <AssociationDetails />
                     </AuthGuard>
                   } />

                   {/* Convention routes requiring member role or higher */}
                   <Route path="conventions" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionsList />
                     </AuthGuard>
                   } />
                   <Route path="conventions/archive" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionArchive />
                     </AuthGuard>
                   } />
                   <Route path="conventions/templates" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionTemplates />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionDetails />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id/equipment" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionEquipment />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id/locations" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionLocations />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id/logs" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionLogs />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id/requirements" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionRequirements />
                     </AuthGuard>
                   } />
                   <Route path="convention/:id/consumables" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ConventionConsumables />
                     </AuthGuard>
                   } />

                   {/* Inventory routes requiring member role or higher */}
                   <Route path="inventory" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <InventoryList />
                     </AuthGuard>
                   } />
                   <Route path="inventory/items" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <InventoryItems />
                     </AuthGuard>
                   } />
                   <Route path="inventory/categories" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ItemCategories />
                     </AuthGuard>
                   } />
                   <Route path="inventory/locations" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ItemLocations />
                     </AuthGuard>
                   } />
                   <Route path="inventory/storage" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <StorageLocations />
                     </AuthGuard>
                   } />
                   <Route path="inventory/documents" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <WarrantiesDocuments />
                     </AuthGuard>
                   } />
                   <Route path="inventory/sets" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <EquipmentSets />
                     </AuthGuard>
                   } />
                   <Route path="inventory/import-export" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <ImportExport />
                     </AuthGuard>
                   } />

                   {/* Reports routes requiring manager role or higher */}
                   <Route path="reports" element={
                     <AuthGuard requiredRoles={managerRoles}>
                       <ReportsList />
                     </AuthGuard>
                   } />

                   {/* Error routes */}
                   <Route path="unauthorized" element={<Unauthorized />} />

                   {/* Catch-all route for 404 */}
                   <Route path="*" element={<NotFound />} />
                 </Route>

                 {/* Fallback for when setup is not complete and not on allowed paths (handled by useEffect redirect) */}
                 {/* This might not be strictly necessary due to the useEffect redirect */}
                 {!setupCompleted && <Route path="*" element={<Navigate to="/setup" replace />} />}

              </Routes>
              <Toaster />
            </AssociationProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
