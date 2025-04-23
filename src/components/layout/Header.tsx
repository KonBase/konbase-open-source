import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { currentAssociation } = useAssociation();
  const location = useLocation();
  const { profile } = useUserProfile();
  const { isMobile } = useMobileDetect();
  
  // Check if user has admin or super_admin role
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'system_admin';
  
  const showBackToDashboard = location.pathname !== '/dashboard' && 
                             !location.pathname.startsWith('/settings') && 
                             !location.pathname.startsWith('/profile');

  const userName = profile?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center">
          <MobileNav />
          
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
                <span className="font-medium truncate max-w-[200px]">{currentAssociation.name}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
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
};
