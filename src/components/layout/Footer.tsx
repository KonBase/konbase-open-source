
import { Link } from 'react-router-dom';
import { Github, MessageCircle, Coffee, Heart } from 'lucide-react';
import { Button } from '../ui/button';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-konbase-blue text-konbase-white py-12 mt-auto">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
                alt="KonBase Logo" 
                className="h-10 w-10" 
              />
              <h3 className="font-bold text-xl text-konbase-yellow">KonBase</h3>
            </div>
            <p className="text-konbase-white/80 mb-4 max-w-md">
              Supply Chain Management for Conventions. An open-source platform helping convention organizers manage their inventory and equipment.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://github.com/ShiroLuxferre/KonBase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
              <a 
                href="https://discord.gg/konbase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
              >
                <MessageCircle className="h-5 w-5" />
                <span className="sr-only">Discord</span>
              </a>
              <a 
                href="https://www.buymeacoffee.com/konbase" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
              >
                <Coffee className="h-5 w-5" />
                <span className="sr-only">Buy Me a Coffee</span>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-4 text-konbase-yellow">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/#features" className="text-konbase-white/80 hover:text-konbase-yellow transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/#about" className="text-konbase-white/80 hover:text-konbase-yellow transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-konbase-white/80 hover:text-konbase-yellow transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-4 text-konbase-yellow">Community</h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/ShiroLuxferre/KonBase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/konbase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a 
                  href="https://www.buymeacoffee.com/konbase" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-konbase-white/80 hover:text-konbase-yellow transition-colors"
                >
                  Sponsor
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-konbase-blue-800/40 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-konbase-white/70 mb-4 md:mb-0">
            &copy; {currentYear} KonBase. All rights reserved.
          </p>
          <p className="text-sm text-konbase-white/70">
            Built with <Heart className="inline h-4 w-4 text-konbase-cherry" /> by the KonBase Community
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
