
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import LogoutButton from '@/components/auth/LogoutButton';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, User, Settings, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationsDropdown } from '@/components/notification/NotificationsDropdown';
import { AssociationSelector } from '@/components/admin/AssociationSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatModule } from '@/components/chat/ChatModule';

export function Header() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  
  // Extract user display values with fallbacks
  const userName = user?.name || profile?.name || 'User';
  const userEmail = user?.email || profile?.email || '';
  const userInitial = userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <img 
              src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
              alt="KonBase Logo" 
              className="h-8 w-8" 
            />
            <span className="hidden font-bold sm:inline-block">KonBase</span>
          </Link>
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <AssociationSelector />
          
          <div className="flex items-center space-x-1">
            {/* Chat Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MessageCircle className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[500px] p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>Association Chat</SheetTitle>
                </SheetHeader>
                <div className="h-[calc(100vh-80px)]">
                  <ChatModule />
                </div>
              </SheetContent>
            </Sheet>
            
            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">{userInitial}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {(profile?.role === 'system_admin' || profile?.role === 'super_admin') && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
