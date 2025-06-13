"use client";

import React, { useState, useEffect } from 'react';
import SidebarFilters from '@/components/layout/sidebar-filters';
import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
import type { CalendarFilters, ColorCodingMode, AcademicEvent } from '@/lib/types';
import { Sidebar, SidebarContent } from '@/components/ui/sidebar'; // Using shadcn/ui/sidebar
import { useIsMobile } from '@/hooks/use-mobile';


export default function DashboardPage() {
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: [],
    subjects: [],
    dateRange: {},
  });
  const [colorMode, setColorMode] = useState<ColorCodingMode>('category');
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const isMobile = useIsMobile();

  // Effect to close dialog if event is null
  useEffect(() => {
    if (!selectedEvent) {
      setShowEventDetail(false);
    }
  }, [selectedEvent]);
  
  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)]"> {/* Adjust height based on header */}
      {/* Sidebar is now part of the AppLayout, we just provide its content */}
      <SidebarContent className="data-[state=open]:border-r data-[state=closed]:border-r"> {/* Ensure border is visible */}
         <SidebarFilters
            filters={filters}
            setFilters={setFilters}
            colorMode={colorMode}
            setColorMode={setColorMode}
          />
      </SidebarContent>
      
      <div className="flex-1 overflow-auto">
        <CalendarView
          filters={filters}
          colorMode={colorMode}
          setSelectedEvent={setSelectedEvent}
          setShowEventDetail={setShowEventDetail}
        />
      </div>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            // Delay clearing selected event to allow dialog to animate out
            setTimeout(() => setSelectedEvent(null), 300);
          }}
        />
      )}
    </div>
  );
}
