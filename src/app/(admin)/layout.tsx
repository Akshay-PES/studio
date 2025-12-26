
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const departmentNames: { [key: string]: string } = {
    "std-1": "1st Standard",
    "std-2": "2nd Standard",
    "std-3": "3rd Standard",
    "std-4": "4th Standard",
    "std-5": "5th Standard",
    "std-6": "6th Standard",
    "std-7": "7th Standard",
    "std-8": "8th Standard",
    "std-9": "9th Standard",
    "std-10": "10th Standard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; 
    }

    // Redirect if user is not a valid department admin or is missing critical data
    if (!currentUser || !userProfile || userProfile.role?.toLowerCase() !== 'department_admin' || !userProfile.departmentId) {
      router.push('/login?error=unauthorized_or_missing_data');
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading || !currentUser || !userProfile || !userProfile.departmentId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  // At this point, userProfile and userProfile.departmentId are guaranteed to exist.
  const departmentIdKey = userProfile.departmentId.toLowerCase();
  const departmentName = departmentNames[departmentIdKey] || userProfile.departmentId.toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
          Jnanodaya school - {departmentName} Admin
        </Link>
        <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {currentUser.email}
            </span>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard?department=${userProfile.departmentId}`}>View Public Calendar</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 bg-background">
        {children}
      </main>
      <footer className="p-4 text-center border-t text-muted-foreground text-sm">
        Jnanodaya school Admin Panel &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
