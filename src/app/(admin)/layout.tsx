
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
// import Image from 'next/image'; // Logo removed
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
// import { ShieldCheck } from 'lucide-react'; // ShieldCheck no longer used

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log("AdminLayout: useEffect triggered. Loading:", loading, "CurrentUser:", currentUser?.email, "IsAdmin:", isAdmin);

    if (loading) {
      console.log("AdminLayout: Still loading auth state. Waiting...");
      return; // Wait until loading is false before making decisions
    }

    if (!currentUser) {
      console.log("AdminLayout: No currentUser. Redirecting to login.");
      router.push('/login?redirect=/admin/dashboard');
    } else if (!isAdmin) {
      console.log("AdminLayout: CurrentUser exists, but NOT admin. Redirecting to dashboard with error. User email:", currentUser.email);
      router.push('/dashboard?error=unauthorized');
    } else {
      console.log("AdminLayout: Admin access GRANTED for user:", currentUser.email);
      // User is authenticated and is an admin, allow access.
    }
  }, [currentUser, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Loading admin section...</p>
      </div>
    );
  }

  // This part will only be reached if loading is false.
  // The useEffect above will handle redirection if currentUser is null or !isAdmin.
  // So, if we reach here and currentUser is null or !isAdmin, it means redirection is about to happen
  // or has just been triggered. We show a fallback UI.
  if (!currentUser || !isAdmin) {
    // This is a fallback display while redirection initiated by useEffect is in progress,
    // or if somehow the redirection doesn't happen immediately.
    console.log("AdminLayout: Fallback UI - Access Denied or Not Logged In (currentUser:", currentUser?.email, "isAdmin:", isAdmin, ")");
    return (
       <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground mb-4">Verifying access...</p>
        {/* Optionally show a login button if detection is truly stuck, but useEffect should handle it */}
        {/* <Button asChild><Link href="/login?redirect=/admin/dashboard">Go to Login</Link></Button> */}
      </div>
    );
  }

  // If authenticated and admin, render the admin layout
  console.log("AdminLayout: Rendering admin content for user:", currentUser.email);
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
          {/* <Image src="/pes-logo.png" alt="PES University Logo" width={67} height={24} /> */}
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
