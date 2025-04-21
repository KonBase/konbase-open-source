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
import { useEffect, useState } from 'react'; // Added useState

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

function App() {
  // Define role permissions for different routes
  const memberRoles: UserRoleType[] = ['member', 'manager', 'admin', 'system_admin', 'super_admin', 'guest'];
  const managerRoles: UserRoleType[] = ['manager', 'admin', 'system_admin', 'super_admin'];
  const adminRoles: UserRoleType[] = ['admin', 'system_admin', 'super_admin'];
  const systemAdminRoles: UserRoleType[] = ['system_admin', 'super_admin'];
  const superAdminRoles: UserRoleType[] = ['super_admin'];
  // Define roles allowed to access association setup
  const associationSetupRoles: UserRoleType[] = ['admin', 'guest']; 

  // Use hooks from react-router-dom
  const navigate = useNavigate();
  const location = useLocation();
  // Use state to track configuration status to avoid potential SSR issues if used
  const [setupCompleted, setSetupCompleted] = useState(false);

  useEffect(() => {
    // Check configuration status on mount
    const configured = isConfigured();
    setSetupCompleted(configured);

    // If not configured via .env, we might want to show an error or specific page.
    // For now, we assume .env is the only method, and AuthContext/Supabase init will handle connection errors.
    // Removed the redirect to /setup logic.

  }, []); // Run only once on mount

  // Render nothing or a loading indicator until configuration status is checked
  // This prevents rendering routes that might depend on a configured client prematurely
  // if (!setupCompleted && !['/login', '/register', '/forgot-password', '/reset-password'].some(path => location.pathname.startsWith(path))) {
  //   // Optionally, render a dedicated "Configuration Error" page or a simple message
  //   return <div>Checking configuration...</div>; // Or a loading spinner
  // }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
          <AuthProvider>
            <AssociationProvider>
              {/* SessionRecovery should ideally check internally if client is valid */}
              <SessionRecovery /> 
              <Routes>
                {/* Auth routes remain accessible */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Remove the dedicated /setup route */}
                {/* <Route path="/setup" element={<SetupWizard />} /> */}

                {/* Main application routes under RootLayout */}
                {/* Render RootLayout; AuthGuard inside will handle auth status */}
                {/* If Supabase isn't configured via .env, components relying on it will likely fail, 
                    which should be handled gracefully (e.g., in AuthContext or specific components) */}
                <Route path="/" element={<RootLayout />}>
                   <Route index element={<Navigate to="/dashboard" replace />} />

                   {/* Dashboard */}
                   <Route path="dashboard" element={
                     <AuthGuard requiredRoles={memberRoles}>
                       <Dashboard />
                     </AuthGuard>
                   } />
                   
                   {/* Association Setup (Join/Create) - accessible via AuthGuard */}
                   <Route path="setup/association" element={
                     <AuthGuard requiredRoles={associationSetupRoles}> 
                       <AssociationSetup />
                     </AuthGuard>
                   } />

                   {/* Profile & Settings */}
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
                     <AuthGuard requiredRoles={managerRoles}> {/* Example: Manager+ */}
                       <ItemCategories />
                     </AuthGuard>
                   } />
                   <Route path="inventory/locations" element={
                     <AuthGuard requiredRoles={managerRoles}> {/* Example: Manager+ */}
                       <ItemLocations />
                     </AuthGuard>
                   } />
                   <Route path="inventory/storage" element={
                     <AuthGuard requiredRoles={managerRoles}> {/* Example: Manager+ */}
                       <StorageLocations />
                     </AuthGuard>
                   } />
                   <Route path="inventory/warranties" element={
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
                     <AuthGuard requiredRoles={adminRoles}> {/* Example: Admin+ */}
                       <ImportExport />
                     </AuthGuard>
                   } />

                   {/* Reports routes requiring manager role or higher */}
                   <Route path="reports" element={
                     <AuthGuard requiredRoles={managerRoles}> {/* Example: Manager+ */}
                       <ReportsList />
                     </AuthGuard>
                   } />

                   {/* Error Handling Routes within Layout */}
                   <Route path="unauthorized" element={<Unauthorized />} />
                   <Route path="*" element={<NotFound />} /> 
                </Route>

                {/* Top-level Catch-all for 404 (if no other route matches) */}
                 <Route path="*" element={<NotFound />} /> 
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
