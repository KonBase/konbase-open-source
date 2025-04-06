import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Settings, Shield, Building2, ArrowLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDropdown } from '@/components/notification/NotificationsDropdown';
import { AssociationSelector } from '@/components/admin/AssociationSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useAssociation } from '@/contexts/AssociationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import LogoutButton from '../auth/LogoutButton';
import { MobileNav } from '@/components/ui/MobileNav';

export function Header() {
  const { user, isAdmin } = useAuth();
  const { currentAssociation } = useAssociation();
  const location = useLocation();
  const { profile } = useUserProfile();
  
  const showBackToDashboard = location.pathname !== '/dashboard' && 
                             !location.pathname.startsWith('/settings') && 
                             !location.pathname.startsWith('/profile');

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="md:hidden mr-2">
          <MobileNav />
        </div>
        
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
          <div className="hidden md:block">
            <AssociationSelector />
          </div>
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          {/* Theme toggle - hide on mobile as it's in the mobile menu */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
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
              {/* Only show Admin Panel option if user has system_admin or super_admin role */}
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
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
