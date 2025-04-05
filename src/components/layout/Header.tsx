
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, User, Settings, Shield, LogOut, Building2, ArrowLeft } from 'lucide-react';
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
import { useAssociation } from '@/contexts/AssociationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatModule } from '@/components/chat/ChatModule';
import LogoutButton from '../auth/LogoutButton';

export function Header() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentAssociation } = useAssociation();
  const location = useLocation();
  
  // Extract user display values with fallbacks
  const userName = user?.name || profile?.name || 'User';
  const userEmail = user?.email || profile?.email || '';
  const userInitial = userName && userName.length > 0 ? userName.charAt(0).toUpperCase() : 'U';
  
  // Check if we're on a page that's not the dashboard
  const showBackToDashboard = location.pathname !== '/dashboard' && location.pathname !== '/';
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
            {/* Removed "EventNexus" text */}
          </Link>
        </div>
        
        {/* Association info with back button */}
        {currentAssociation && (
          <div className="flex items-center gap-2 flex-1">
            {showBackToDashboard && (
              <Button variant="ghost" size="icon" asChild className="mr-2">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <div className="hidden md:flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="font-medium">{currentAssociation.name}</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-end items-center gap-4">
          {/* Association Selector */}
          <AssociationSelector />
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          {/* Chat */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" title="Chat">
                <MessageCircle className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Association Chat</SheetTitle>
              </SheetHeader>
              <ChatModule />
            </SheetContent>
          </Sheet>
          
          {/* Theme toggle */}
          <ThemeToggle />
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogoutButton variant="ghost" size="sm" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
