
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';

const MainLayoutWrapper = () => {
  const location = useLocation();
  
  // Check if we're on the login or register pages
  const hideFooter = location.pathname === '/login' || location.pathname === '/register';
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-grow">
        <Outlet />
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
};

export default MainLayoutWrapper;
