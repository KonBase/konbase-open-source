import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";
import { NotificationsDropdown } from '@/components/notification/NotificationsDropdown';
import { AssociationSelector } from '@/components/admin/AssociationSelector';
import { useAuth } from '@/contexts/auth';
import { useAssociation } from '@/contexts/AssociationContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMobileDetect } from '@/hooks/useMobileDetect';
import UserMenu from './shared/UserMenu';
import MobileMenuButton from './shared/MobileMenuButton';
import { MobileNav } from '@/components/ui/MobileNav';
import { GlobalSearch } from '@/components/search/GlobalSearch';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { currentAssociation } = useAssociation();
  const location = useLocation();
  const { profile } = useUserProfile();
  const { isMobile } = useMobileDetect();
  const navigate = useNavigate();
  
  // Check if user has admin or super_admin role
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'system_admin';
  
  // Show back button on all pages except dashboard
  const showBackButton = location.pathname !== '/dashboard';

  const handleBackNavigation = () => {
    // Go back in browser history
    window.history.back();
  };

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center">
          <MobileNav />
          
          {currentAssociation && (
            <div className="flex items-center gap-2 flex-1">
              {showBackButton && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBackNavigation}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="hidden md:flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="font-medium truncate max-w-[200px]">{currentAssociation.name}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Global Search Bar - only show when an association is selected */}
        {currentAssociation && (
          <div className="flex-1 px-4">
            <GlobalSearch className="max-w-[600px] mx-auto" />
          </div>
        )}
        
        <div className="flex justify-end items-center gap-2 sm:gap-4">
          {/* Association Selector - hide on small screens */}
          <div className="hidden md:block">
            <AssociationSelector />
          </div>
          
          {/* Notifications */}
          <NotificationsDropdown />
          
          {/* Theme toggle - hide on mobile as it's in the mobile menu */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          
          {/* User menu */}
          <UserMenu 
            userName={userName}
            userEmail={userEmail}
            userImage={profile?.profile_image}
            isAdmin={isAdmin}
          />
        </div>
      </div>
    </header>
  );
}
