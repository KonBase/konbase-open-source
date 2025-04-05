
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { User, LogOut, Settings, LayoutDashboard, Github, MessageCircle } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import LogoutButton from '../auth/LogoutButton';

const HomeHeader = () => {
  const navigate = useNavigate();
  const { user, signOut, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Extract user display values with fallbacks
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName && userName.length > 0 ? userName.charAt(0) : 'U';

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account."
      });
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  const handleDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <header className="w-full border-b bg-konbase-blue text-konbase-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
              alt="KonBase Logo" 
              className="h-10 w-10" 
            />
            <h1 className="text-2xl font-bold text-konbase-yellow">KonBase</h1>
          </Link>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/#features" className="text-konbase-white hover:text-konbase-yellow px-4 py-2 transition-colors">
                  Features
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/#about" className="text-konbase-white hover:text-konbase-yellow px-4 py-2 transition-colors">
                  About
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="text-konbase-white bg-transparent hover:bg-konbase-blue-800/40 hover:text-konbase-yellow">Community</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid gap-3 p-4 w-[400px] bg-white dark:bg-gray-800 text-foreground">
                    <a 
                      href="https://github.com/ShiroLuxferre/KonBase" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    >
                      <Github className="h-5 w-5 dark:text-konbase-yellow" />
                      <div>
                        <div className="font-medium">GitHub</div>
                        <div className="text-sm text-muted-foreground">Contribute to the code</div>
                      </div>
                    </a>
                    <a 
                      href="https://discord.gg/konbase" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
                    >
                      <MessageCircle className="h-5 w-5 dark:text-konbase-yellow" />
                      <div>
                        <div className="font-medium">Discord</div>
                        <div className="text-sm text-muted-foreground">Join the community</div>
                      </div>
                    </a>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDashboard}
                className="text-konbase-white bg-transparent border-konbase-white/30 hover:bg-konbase-blue-800/40 hover:text-konbase-yellow"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>

              <ThemeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-konbase-light-blue/20 flex items-center justify-center">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={userName} 
                          className="w-8 h-8 rounded-full" 
                        />
                      ) : (
                        <span className="font-medium text-konbase-white">{userInitial}</span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex flex-col items-center p-4 border-b">
                    <div className="w-12 h-12 rounded-full bg-konbase-light-blue/20 flex items-center justify-center mb-2">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={userName} 
                          className="w-12 h-12 rounded-full" 
                        />
                      ) : (
                        <span className="text-lg font-medium text-konbase-blue">{userInitial}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{userName}</p>
                      <p className="text-xs text-muted-foreground">{userEmail}</p>
                    </div>
                  </div>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button 
                variant="ghost" 
                onClick={handleLogin}
                className="text-konbase-white hover:text-konbase-yellow hover:bg-konbase-blue-800/40"
              >
                Login
              </Button>
              <Button 
                onClick={handleRegister}
                className="bg-konbase-yellow text-konbase-blue hover:bg-konbase-yellow/90"
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default HomeHeader;
