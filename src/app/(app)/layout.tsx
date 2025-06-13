"use client";

import * as React from 'react';
import Header from '@/components/layout/header';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarRail } from '@/components/ui/sidebar'; // Using shadcn/ui/sidebar
import { TooltipProvider } from '@/components/ui/tooltip'; // Required by shadcn/ui/sidebar

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // Initialize sidebar state from cookies or default
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true); // Default to open
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
      <SidebarProvider defaultOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
        <div className="flex flex-col min-h-screen">
          <Header sidebarTrigger={<SidebarTrigger className="hidden md:flex" />} />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar collapsible="icon" className="border-r">
              {/* Content for the sidebar itself (filters) will be in dashboard/page.tsx's children, passed to SidebarContent there */}
              {/* This layout just sets up the Sidebar component structure */}
            </Sidebar>
            <SidebarRail /> {/* Optional: adds a draggable rail */}
            <main className="flex-1 overflow-y-auto bg-background">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
