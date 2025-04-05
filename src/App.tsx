
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeProvider';
import { AuthProvider } from './contexts/AuthContext';
import { AssociationProvider } from './contexts/AssociationContext';
import { Toaster } from './components/ui/toaster';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
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
import SetupWizard from './pages/setup/SetupWizard';
import AdminPanel from './pages/admin/AdminPanel';
import AssociationsList from './pages/association/AssociationsList';
import AssociationDetails from './pages/association/AssociationDetails';
import InventoryList from './pages/inventory/InventoryList';
import ConventionsList from './pages/conventions/ConventionsList';
import ReportsList from './pages/reports/ReportsList';

// Association Management
import AssociationProfile from './pages/association/AssociationProfile';
import AssociationMembers from './pages/association/AssociationMembers';
import ItemCategories from './pages/inventory/ItemCategories';
import ItemLocations from './pages/inventory/ItemLocations';
import EquipmentSets from './pages/inventory/EquipmentSets';
import WarrantiesDocuments from './pages/inventory/WarrantiesDocuments';
import ImportExport from './pages/inventory/ImportExport';
import BackupManagement from './pages/settings/BackupManagement';

// Convention Management
import ConventionDetails from './pages/conventions/ConventionDetails';
import ConventionEquipment from './pages/conventions/ConventionEquipment';
import ConventionConsumables from './pages/conventions/ConventionConsumables';
import ConventionLocations from './pages/conventions/ConventionLocations';
import ConventionRequirements from './pages/conventions/ConventionRequirements';
import ConventionLogs from './pages/conventions/ConventionLogs';
import ConventionArchive from './pages/conventions/ConventionArchive';
import ConventionTemplates from './pages/conventions/ConventionTemplates';

// Layouts
import MainLayout from './components/layout/MainLayout';
import MainLayoutWrapper from './components/layout/MainLayoutWrapper';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import GuestGuard from './components/guards/GuestGuard';
import { RoleGuard } from './components/auth/RoleGuard';

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" storageKey="konbase-theme">
        <AuthProvider>
          <AssociationProvider>
            <Router>
              <Routes>
                {/* Public routes with Footer */}
                <Route element={<MainLayoutWrapper />}>
                  <Route path="/" element={<Home />} />
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
                
                {/* Protected routes */}
                <Route element={<AuthGuard><Outlet /></AuthGuard>}>
                  {/* Setup route */}
                  <Route element={<MainLayoutWrapper />}>
                    <Route path="/setup" element={<SetupWizard />} />
                  </Route>
                  
                  {/* Routes with main layout */}
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/settings/backup" element={<BackupManagement />} />
                    
                    {/* Association Management */}
                    <Route path="/association/profile" element={<AssociationProfile />} />
                    <Route path="/association/members" element={<AssociationMembers />} />
                    <Route path="/associations" element={<AssociationsList />} />
                    <Route path="/associations/:id" element={<AssociationDetails />} />
                    
                    {/* Inventory Management */}
                    <Route path="/inventory/items" element={<InventoryList />} />
                    <Route path="/inventory/categories" element={<ItemCategories />} />
                    <Route path="/inventory/locations" element={<ItemLocations />} />
                    <Route path="/inventory/sets" element={<EquipmentSets />} />
                    <Route path="/inventory/warranties" element={<WarrantiesDocuments />} />
                    <Route path="/inventory/import-export" element={<ImportExport />} />
                    
                    {/* Convention Management */}
                    <Route path="/conventions" element={<ConventionsList />} />
                    <Route path="/conventions/:id" element={<ConventionDetails />} />
                    <Route path="/conventions/equipment" element={<ConventionEquipment />} />
                    <Route path="/conventions/consumables" element={<ConventionConsumables />} />
                    <Route path="/conventions/locations" element={<ConventionLocations />} />
                    <Route path="/conventions/requirements" element={<ConventionRequirements />} />
                    <Route path="/conventions/logs" element={<ConventionLogs />} />
                    <Route path="/conventions/archive" element={<ConventionArchive />} />
                    <Route path="/templates" element={<ConventionTemplates />} />
                    
                    {/* Reports */}
                    <Route path="/reports" element={<ReportsList />} />
                    
                    {/* Admin routes */}
                    <Route element={
                      <RoleGuard allowedRoles={['super_admin', 'system_admin', 'admin']} fallbackPath="/unauthorized">
                        <Outlet />
                      </RoleGuard>
                    }>
                      <Route path="/admin" element={<AdminPanel />} />
                    </Route>
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
