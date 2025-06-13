
"use client";

import * as React from 'react';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import SidebarFilters from '@/components/layout/sidebar-filters'; // Import SidebarFilters
import { FilterProvider } from '@/contexts/FilterContext'; // Import FilterProvider

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
      <FilterProvider> {/* Wrap with FilterProvider */}
        <SidebarProvider defaultOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <div className="flex flex-col min-h-screen">
            <Header sidebarTrigger={<SidebarTrigger className="hidden md:flex" />} />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar collapsible="icon" className="border-r bg-sidebar text-sidebar-foreground">
                {/* SidebarFilters now uses context, so no props needed here if it consumes context directly */}
                <SidebarFilters />
              </Sidebar>
              <SidebarRail />
              <main className="flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </FilterProvider>
    </TooltipProvider>
  );
}
