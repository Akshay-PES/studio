
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/admin/dashboard'); // Redirect to login if not authenticated
    } else if (!loading && currentUser && !isAdmin) {
      router.push('/dashboard?error=unauthorized'); // Redirect to public dashboard if not admin
    }
  }, [currentUser, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading admin section...</p>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    // This will be briefly shown before redirection or if redirection fails.
    // The useEffect hook handles the actual redirection.
    return (
       <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground mb-4">Access Denied or Not Logged In.</p>
        <Button asChild><Link href="/login?redirect=/admin/dashboard">Go to Login</Link></Button>
      </div>
    );
  }

  // If authenticated and admin, render the admin layout
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <ShieldCheck className="w-6 h-6"/>
          AcademiaSync - Admin Panel
        </Link>
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:inline">
              Logged in as: {currentUser.email}
            </span>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">View Public Calendar</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 bg-background">
        {children}
      </main>
      <footer className="p-4 text-center border-t text-muted-foreground text-sm">
        AcademiaSync Admin Panel &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
