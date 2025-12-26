
"use client";

import * as React from 'react';
import Header from '@/components/layout/header';
import SidebarFilters from '@/components/layout/sidebar-filters';
import { FilterProvider } from '@/contexts/FilterContext';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <TooltipProvider delayDuration={0}>
      <FilterProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex flex-1 overflow-hidden">
              <aside className="hidden md:block w-64 border-r bg-sidebar text-sidebar-foreground">
                <SidebarFilters />
              </aside>
              <main className="flex flex-col flex-1 overflow-y-auto bg-background">
                {children}
              </main>
            </div>
          </div>
      </FilterProvider>
    </TooltipProvider>
  );
}

    