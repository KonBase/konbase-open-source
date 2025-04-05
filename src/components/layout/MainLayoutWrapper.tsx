
import { Outlet } from 'react-router-dom';
import Footer from './Footer';

const MainLayoutWrapper = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-grow">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

export default MainLayoutWrapper;
