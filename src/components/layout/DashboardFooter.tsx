
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardFooter = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto py-4 border-t text-sm text-center text-muted-foreground">
      <p>
        Copyright &copy; {currentYear} KonBase | Built with{" "}
        <Heart className="inline h-4 w-4 text-red-500" /> by the{" "}
        <a 
          href="https://github.com/KonBase" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-primary"
        >
          KonBase Community
        </a>
      </p>
    </footer>
  );
};

export default DashboardFooter;
