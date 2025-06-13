
// This will be a simple layout for the admin section.
// For a real application, you might want a different header, navigation, etc.
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
        <Link href="/admin/dashboard" className="text-lg font-semibold text-primary">
          AcademiaSync - Admin Panel
        </Link>
        <div>
          {/* Placeholder for admin user info / logout */}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">View Public Calendar</Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 bg-background">
        {children}
      </main>
      <footer className="p-4 text-center border-t text-muted-foreground text-sm">
        Admin Panel Footer
      </footer>
    </div>
  );
}
