
"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Briefcase, Settings, LogOut, UserCircle, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  sidebarTrigger?: React.ReactNode;
}

export default function Header({ sidebarTrigger }: HeaderProps) {
  const { currentUser, userProfile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
  };

  const handleLogin = () => {
    router.push('/login');
  };
  
  const isDepartmentAdmin = userProfile?.role === 'department_admin';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 border-b bg-card shadow-sm sm:px-6">
      <div className="flex items-center gap-2">
        {sidebarTrigger || (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground">
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
                  <span className="font-headline">AcademiaSync</span>
                </Link>
                <Link href="/" className="flex items-center gap-4 px-2.5 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                  <Briefcase className="w-5 h-5" />
                  Calendars
                </Link>
                {isDepartmentAdmin && (
                   <Link href="/admin/dashboard" className="flex items-center gap-4 px-2.5 text-sidebar-foreground hover:text-sidebar-accent-foreground">
                      <Settings className="w-5 h-5" />
                      Admin Panel
                    </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        )}
        <Link href="/" className="hidden md:flex items-center gap-2 text-lg font-semibold text-primary">
          <span className="font-headline text-xl">AcademiaSync</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser && userProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-auto rounded-full px-2">
                <Avatar className="w-7 h-7 mr-2">
                  <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="user avatar" />
                  <AvatarFallback>
                    {userProfile.email ? userProfile.email.charAt(0).toUpperCase() : <UserCircle className="w-5 h-5"/>}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden sm:inline">{userProfile.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                My Account
                {isDepartmentAdmin && userProfile.departmentId && (
                  <span className="text-xs text-primary"> ({userProfile.departmentId.toUpperCase()} Admin)</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isDepartmentAdmin && (
                <Link href="/admin/dashboard">
                  <DropdownMenuItem>Admin Dashboard</DropdownMenuItem>
                </Link>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" onClick={handleLogin}>
            <LogIn className="w-4 h-4 mr-2" />
            Admin Login
          </Button>
        )}
      </div>
    </header>
  );
}
