import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider, useAuth } from '@/contexts/auth';
import { AssociationProvider } from './contexts/AssociationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { SessionRecovery } from '@/components/SessionRecovery';
import AuthGuard from './components/guards/AuthGuard';
import { RoleGuard } from './components/auth/RoleGuard'; // Use named import for RoleGuard
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
import AuthCallback from './pages/auth/AuthCallback'; // Import the new AuthCallback component
import AssociationSetup from './pages/setup/AssociationSetup';

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

function IndexRedirect() {
  const { user } = useAuth();
  if (user?.role === 'guest') {
    return <Navigate to="/profile" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {

  // Define role permissions for different routes
  const memberRoles: UserRoleType[] = ['member', 'manager', 'admin', 'system_admin', 'super_admin', 'guest'];
  const managerRoles: UserRoleType[] = ['manager', 'admin', 'system_admin', 'super_admin'];
  const adminRoles: UserRoleType[] = ['admin', 'system_admin', 'super_admin'];

  useEffect(() => {
    isConfigured();

  }, []); // Run only once on mount

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
          <AuthProvider>
            <AssociationProvider>
              <SessionRecovery />
              <Routes>
                {/* Public routes accessible without authentication */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} /> {/* Add the OAuth callback route */}
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/error" element={<ErrorPage />} />
                <Route path="/setup" element={<AssociationSetup />} />

                {/* Protected routes wrapped by AuthGuard and RootLayout */}
                <Route element={<AuthGuard><RootLayout /></AuthGuard>}>
                  <Route index element={<IndexRedirect />} />
                  {/* Dashboard */}
                  <Route
                    path="dashboard"
                    element={
                      <RoleGuard allowedRoles={managerRoles || adminRoles}>
                        <Dashboard />
                      </RoleGuard>
                    }
                  />

                  {/* Profile */}
                  <Route path="profile" element={<ProfilePage />} />

                  {/* Settings */}
                  <Route path="settings" element={<Settings />} />
                  {/* Admin Panel (with RoleGuard) */}
                  <Route
                      path="admin/*"
                      element={
                        <RoleGuard allowedRoles={adminRoles}>
                          <AdminPanel />
                        </RoleGuard>
                      }
                  />
                  {/* Association Management (with RoleGuard) */}
                  <Route
                    path="association/*"
                    element={
                      <RoleGuard allowedRoles={managerRoles}> {/* Example: Managers and above */}
                        {/* Define nested routes for association management */}
                        <Routes>
                          <Route index element={<AssociationsList />} />
                          <Route path="profile" element={<AssociationProfile />} />
                          <Route path="members" element={<AssociationMembers />} />
                          <Route path="details/:id" element={<AssociationDetails />} />
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Convention Management (with RoleGuard) */}
                  <Route
                    path="conventions/*"
                    element={
                      <RoleGuard allowedRoles={memberRoles}> {/* Example: Members and above */}
                        {/* Define nested routes for conventions */}
                        <Routes>
                          <Route index element={<ConventionsList />} />
                          <Route path=":id" element={<ConventionDetails />} /> {/* Changed path to use :id */}
                          <Route path="archive" element={<ConventionArchive />} />
                          <Route path=":id/equipment" element={<ConventionEquipment />} /> {/* Nested under :id */}
                          <Route path=":id/locations" element={<ConventionLocations />} /> {/* Nested under :id */}
                          <Route path=":id/logs" element={<ConventionLogs />} /> {/* Nested under :id */}
                          <Route path=":id/requirements" element={<ConventionRequirements />} /> {/* Nested under :id */}
                          <Route path=":id/consumables" element={<ConventionConsumables />} /> {/* Nested under :id */}
                          <Route path="templates" element={<ConventionTemplates />} />
                          {/* Add a route for creating conventions, potentially using a template */}
                          {/* <Route path="create" element={<CreateConventionPage />} /> */}
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Inventory Management (with RoleGuard) */}
                  <Route
                    path="inventory/*"
                    element={
                      <RoleGuard allowedRoles={memberRoles}> {/* Example: Members and above */}
                        {/* Define nested routes for inventory */}
                        <Routes>
                          <Route index element={<InventoryList />} />
                          <Route path="items" element={<InventoryItems />} />
                          <Route path="categories" element={<ItemCategories />} />
                          <Route path="locations" element={<ItemLocations />} />
                          <Route path="storage" element={<StorageLocations />} />
                          <Route path="warranties" element={<WarrantiesDocuments />} />
                          <Route path="sets" element={<EquipmentSets />} />
                          <Route path="import-export" element={<ImportExport />} />
                        </Routes>
                      </RoleGuard>
                    }
                  />

                  {/* Reports (with RoleGuard) */}
                  <Route
                    path="reports/*"
                    element={
                      <RoleGuard allowedRoles={managerRoles}> {/* Example: Managers and above */}
                        <ReportsList />
                      </RoleGuard>
                    }
                  />

                  {/* Catch-all for unmatched protected routes */}
                  <Route path="*" element={<NotFound />} />
                </Route> {/* End of protected routes */}

                {/* Catch-all for unmatched top-level routes */}
                <Route path="*" element={<NotFound />} />

              </Routes>
            </AssociationProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

