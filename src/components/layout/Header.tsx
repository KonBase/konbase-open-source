
import { useState } from 'react';
import { Bell, Menu, MessageSquare, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const [notifications] = useState<{ id: string; title: string; read: boolean }[]>([
    { id: '1', title: 'New equipment request', read: false },
    { id: '2', title: 'Equipment return due', read: false },
    { id: '3', title: 'Upcoming convention', read: true },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Extract user display values with fallbacks
  const userName = user?.name || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName && userName.length > 0 ? userName.charAt(0) : 'U';

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-[200px] lg:w-[300px] pl-8"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="flex justify-between items-center p-2 border-b">
              <h4 className="font-medium">Notifications</h4>
              <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>
            {notifications.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="p-3 cursor-pointer">
                    <div className="flex items-start gap-2">
                      {!notification.read && (
                        <div className="mt-1.5 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            )}
            <div className="p-2 border-t text-center">
              <Button variant="ghost" size="sm" className="w-full">View all</Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon">
          <MessageSquare className="h-5 w-5" />
        </Button>

        {user && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={userName} className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="font-medium text-primary">{userInitial}</span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col items-center p-4 border-b">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={userName} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-lg font-medium text-primary">{userInitial}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </div>
                </div>
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Account Settings</DropdownMenuItem>
                <DropdownMenuItem>Support</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
