
"use client";

import * as React from 'react';
import Image from 'next/image';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import SidebarFilters from '@/components/layout/sidebar-filters';
import { FilterProvider } from '@/contexts/FilterContext';
import { Button } from '@/components/ui/button';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  React.useEffect(() => {
    const storedState = document.cookie
      .split('; ')
      .find(row => row.startsWith('sidebar_state='))
      ?.split('=')[1];
    if (storedState) {
      setIsSidebarOpen(storedState === 'true');
    }
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <FilterProvider>
        <SidebarProvider defaultOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <div className="flex flex-col min-h-screen">
            {/* The Header now contains the mobile sidebar content */}
            <Header>
                <SidebarTrigger asChild className="hidden md:flex">
                    <Button variant="ghost" size="icon">
                      <>
                        <Image src="/pes-logo.png" alt="PES University Logo" width={100} height={36} className="w-auto h-7" />
                        <span className="sr-only">Toggle Sidebar</span>
                      </>
                    </Button>
                </SidebarTrigger>
            </Header>
            <div className="flex flex-1 overflow-hidden">
              <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
                {/* This instance of SidebarFilters is for the desktop view */}
                <SidebarFilters />
              </Sidebar>
              <SidebarRail />
              <main className="flex flex-col flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </FilterProvider>
    </TooltipProvider>
  );
}
