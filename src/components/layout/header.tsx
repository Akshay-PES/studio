
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogOut, UserCircle, LogIn, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SidebarFilters from './sidebar-filters';
import { Separator } from '../ui/separator';
import { SidebarTrigger } from '../ui/sidebar';

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
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
      <div className="flex items-center gap-3">
        {/* This is the mobile menu trigger, it remains */}
        <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs bg-sidebar text-sidebar-foreground p-0 flex flex-col">
                <div className="p-4">
                  <Link href="/" className="flex items-center gap-2">
                    <Image src="/pes-logo.png" alt="PES University Logo" width={100} height={36} className="w-auto h-7" />
                    <span className="font-headline text-lg text-primary">PESU Playbook</span>
                  </Link>
                </div>
                <Separator className="bg-sidebar-border" />
                <SidebarFilters />
            </SheetContent>
        </Sheet>
        
        {/* The desktop trigger button has been removed from here. */}

        <Separator orientation="vertical" className="h-6 hidden md:block" />

        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
          <Image src="/pes-logo.png" alt="PES University Logo" width={100} height={36} className="w-auto h-7 hidden md:block" />
          <span className="font-headline text-xl">PESU Playbook</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {currentUser && userProfile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-auto px-2">
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
