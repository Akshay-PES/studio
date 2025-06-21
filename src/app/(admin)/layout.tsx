
"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const departmentNames: { [key: string]: string } = {
  mba: "MBA",
  bba: "BBA",
  bcom: "BCom",
  law: "Law",
  psychology: "Psychology",
  eng: "Engineering",
  finearts: "Fine Arts",
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

    if (!currentUser || !userProfile || userProfile.role !== 'department_admin') {
      router.push('/login?error=unauthorized');
    }
  }, [currentUser, userProfile, loading, router]);

  if (loading || !currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-muted-foreground">Verifying admin access...</p>
      </div>
    );
  }

  const departmentName = departmentNames[userProfile.departmentId] || userProfile.departmentId.toUpperCase();

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary">
          AcademiaSync - {departmentName} Admin
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
        AcademiaSync Admin Panel &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
