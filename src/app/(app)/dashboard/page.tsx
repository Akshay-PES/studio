
"use client";

import React, { useState, useEffect } from 'react';
import SidebarFilters from '@/components/layout/sidebar-filters';
import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
import AddEventDialog from '@/components/calendar/add-event-dialog'; // Import AddEventDialog
import type { CalendarFilters, ColorCodingMode, AcademicEvent } from '@/lib/types';
import { SidebarContent } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { academicEvents as initialEvents } from '@/data/mock-data'; // Import initial events

export default function DashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>(initialEvents); // Manage events in state
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: [],
    subjects: [],
    dateRange: {},
  });
  const [colorMode, setColorMode] = useState<ColorCodingMode>('category');
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false); // State for AddEventDialog
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!selectedEvent) {
      setShowEventDetail(false);
    }
  }, [selectedEvent]);

  const handleAddEvent = (newEventData: Omit<AcademicEvent, 'id'>) => {
    const newEventWithId: AcademicEvent = {
      ...newEventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
    };
    setEvents(prevEvents => [...prevEvents, newEventWithId]);
  };
  
  return (
    <div className="flex flex-1 h-[calc(100vh-4rem)]">
      <SidebarContent className="data-[state=open]:border-r data-[state=closed]:border-r">
         <SidebarFilters
            filters={filters}
            setFilters={setFilters}
            colorMode={colorMode}
            setColorMode={setColorMode}
          />
      </SidebarContent>
      
      <div className="flex-1 overflow-auto">
        <CalendarView
          allEvents={events} // Pass events state to CalendarView
          filters={filters}
          colorMode={colorMode}
          setSelectedEvent={setSelectedEvent}
          setShowEventDetail={setShowEventDetail}
          setShowAddEventDialog={setShowAddEventDialog} // Pass setter for AddEventDialog
        />
      </div>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            setTimeout(() => setSelectedEvent(null), 300);
          }}
        />
      )}

      <AddEventDialog
        isOpen={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onAddEvent={handleAddEvent}
      />
    </div>
  );
}
