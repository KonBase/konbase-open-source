import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/profile/ProfilePage';
import Settings from './pages/settings/Settings';
import ErrorPage from './pages/ErrorPage';
import Home from './pages/Index';
import NotFound from './pages/NotFound';

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
import SetupWizard from './pages/setup/SetupWizard';

// Layouts
import RootLayout from './layouts/RootLayout';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Core application with comprehensive routing
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Home /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "settings", element: <Settings /> },
      
      // Admin routes
      { path: "admin", element: <AdminPanel /> },
      
      // Association routes
      { path: "associations", element: <AssociationsList /> },
      { path: "association/profile", element: <AssociationProfile /> },
      { path: "association/members", element: <AssociationMembers /> },
      { path: "association/:id", element: <AssociationDetails /> },
      
      // Convention routes
      { path: "conventions", element: <ConventionsList /> },
      { path: "conventions/archive", element: <ConventionArchive /> },
      { path: "conventions/templates", element: <ConventionTemplates /> },
      { path: "convention/:id", element: <ConventionDetails /> },
      { path: "convention/:id/equipment", element: <ConventionEquipment /> },
      { path: "convention/:id/locations", element: <ConventionLocations /> },
      { path: "convention/:id/logs", element: <ConventionLogs /> },
      { path: "convention/:id/requirements", element: <ConventionRequirements /> },
      { path: "convention/:id/consumables", element: <ConventionConsumables /> },
      
      // Inventory routes
      { path: "inventory", element: <InventoryList /> },
      { path: "inventory/items", element: <InventoryItems /> },
      { path: "inventory/categories", element: <ItemCategories /> },
      { path: "inventory/locations", element: <ItemLocations /> },
      { path: "inventory/storage", element: <StorageLocations /> },
      { path: "inventory/documents", element: <WarrantiesDocuments /> },
      { path: "inventory/sets", element: <EquipmentSets /> },
      { path: "inventory/import-export", element: <ImportExport /> },
      
      // Reports routes
      { path: "reports", element: <ReportsList /> },
      
      // Catch-all route for 404
      { path: "*", element: <NotFound /> }
    ],
  },
  // Authentication routes (outside the main layout)
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },
  
  // Setup wizard route
  { path: "/setup", element: <SetupWizard /> },
]);

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AssociationProvider>
              <RouterProvider router={router} />
              <Toaster />
            </AssociationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
