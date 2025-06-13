
"use client";

import React, { useState, useEffect } from 'react';
import { collection, getDocs, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from '@/lib/firebase'; 

import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
import type { AcademicEvent } from '@/lib/types';
// SidebarFilters is now in AppLayout
// import { SidebarContent } from '@/components/ui/sidebar'; // No longer needed here
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext'; // Import useFilters

export default function DashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { filters, colorMode } = useFilters(); // Get filters and colorMode from context
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const eventsCollection = collection(db, "events");
        const q = query(eventsCollection, orderBy("start", "asc")); 
        const querySnapshot = await getDocs(q);
        const fetchedEvents: AcademicEvent[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            category: data.category,
            subType: data.subType,
            subjectId: data.subjectId,
            start: (data.start as Timestamp).toDate(), 
            end: (data.end as Timestamp).toDate(),     
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
  
  if (isLoading && !isMobile) { 
    return (
      <div className="flex flex-1 h-full items-center justify-center"> {/* Use h-full */}
        <p className="text-lg text-muted-foreground">Loading calendar data...</p>
      </div>
    );
  }

  return (
    // The parent div now directly contains the CalendarView and EventDetailDialog
    // Sidebar is handled by AppLayout
    <div className="flex flex-1 h-full"> {/* Use h-full to fill space given by AppLayout's main tag */}
      {/* SidebarContent and SidebarFilters are removed from here */}
      
      <div className="flex-1 overflow-auto">
      {isLoading && isMobile && ( 
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
        <CalendarView
          allEvents={events}
          filters={filters} // from context
          colorMode={colorMode} // from context
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
            setTimeout(() => setSelectedEvent(null), 300); 
          }}
        />
      )}
    </div>
  );
}
