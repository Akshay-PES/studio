
"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase'; // Import Firestore instance

import SidebarFilters from '@/components/layout/sidebar-filters';
import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
// import AddEventDialog from '@/components/calendar/add-event-dialog'; // Removed
import type { CalendarFilters, ColorCodingMode, AcademicEvent } from '@/lib/types';
import { SidebarContent } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<CalendarFilters>({
    categories: [],
    subjects: [],
    dateRange: {},
  });
  const [colorMode, setColorMode] = useState<ColorCodingMode>('category');
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  // const [showAddEventDialog, setShowAddEventDialog] = useState(false); // Removed
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const eventsCollection = collection(db, "events");
        const q = query(eventsCollection, orderBy("start", "asc")); // Optional: order events
        const querySnapshot = await getDocs(q);
        const fetchedEvents: AcademicEvent[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            category: data.category,
            subType: data.subType,
            subjectId: data.subjectId,
            start: (data.start as Timestamp).toDate(), // Convert Firestore Timestamp to JS Date
            end: (data.end as Timestamp).toDate(),     // Convert Firestore Timestamp to JS Date
            location: data.location,
            faculty: data.faculty,
            description: data.description,
            attendees: data.attendees,
          };
        });
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events from Firestore:", error);
        toast({
          variant: "destructive",
          title: "Error Fetching Events",
          description: "Could not load events from the database. Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, [toast]);

  useEffect(() => {
    if (!selectedEvent) {
      setShowEventDetail(false);
    }
  }, [selectedEvent]);

  // handleAddEvent function removed as "Add Event" is admin-only now.
  
  if (isLoading && !isMobile) { // Show full page loader only on desktop initially
    return (
      <div className="flex flex-1 h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading calendar data...</p>
      </div>
    );
  }

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
      {isLoading && isMobile && ( // Show a simpler loading indicator on mobile or if content already partially loaded
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
        <CalendarView
          allEvents={events}
          filters={filters}
          colorMode={colorMode}
          setSelectedEvent={setSelectedEvent}
          setShowEventDetail={setShowEventDetail}
          // setShowAddEventDialog={setShowAddEventDialog} // Removed
        />
      </div>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            // Delay clearing to allow for fade-out animation
            setTimeout(() => setSelectedEvent(null), 300); 
          }}
        />
      )}

      {/* AddEventDialog instance removed
      <AddEventDialog
        isOpen={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onAddEvent={handleAddEvent}
      />
      */}
    </div>
  );
}
