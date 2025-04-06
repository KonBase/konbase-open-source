
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function RootLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col">
        {isAuthenticated && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
