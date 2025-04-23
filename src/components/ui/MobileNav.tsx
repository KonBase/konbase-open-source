import React, { useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { navItems, SidebarItem } from '@/components/layout/navigation/navItems';
import { useAuth } from '@/contexts/auth';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const userInitial = user?.email ? user.email[0].toUpperCase() : '?';

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Render a nav item with its submenu (if any)
  const renderNavItem = (item: SidebarItem) => {
    const active = isActive(item.path);
    
    return (
      <div key={item.path} className="mb-2">
        <Link
          to={item.path}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center justify-between w-full p-2 rounded-md text-sm",
            active ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"
          )}
        >
          <div className="flex items-center gap-2">
            {item.icon}
            <span>{item.title}</span>
          </div>
          {item.submenu && <ChevronRight className="h-4 w-4 opacity-70" />}
        </Link>
        
        {item.submenu && (
          <div className="ml-6 mt-1 space-y-1 border-l pl-3 border-sidebar-border">
            {item.submenu.map(subItem => (
              <Link
                key={subItem.path}
                to={subItem.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md text-sm",
                  isActive(subItem.path) 
                    ? "bg-accent text-accent-foreground font-medium" 
                    : "hover:bg-accent/50"
                )}
              >
                {subItem.icon}
                <span>{subItem.title}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[80vw] max-w-[300px] p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setOpen(false)}>
              <img 
                src="/lovable-uploads/23ec7a1d-12fd-47d9-b8eb-080c0d7c18e5.png" 
                alt="KonBase Logo" 
                className="h-8 w-8" 
              />
              <h1 className="text-xl font-bold text-primary">KonBase</h1>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{userInitial}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium truncate">
                {user?.email || "User"}
              </div>
            </div>
            <ThemeToggle />
          </div>
          
          <ScrollArea className="flex-1 p-4">
            <nav className="flex flex-col">
              {navItems.map(renderNavItem)}
            </nav>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
