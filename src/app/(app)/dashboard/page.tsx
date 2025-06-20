
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, Timestamp, query, orderBy, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase'; 

import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
import DayViewDialog from '@/components/calendar/day-view-dialog'; // Import DayViewDialog
import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext';

export default function DashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { filters, colorMode } = useFilters();
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // State for Day View Dialog
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showDayViewDialog, setShowDayViewDialog] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const eventsCollection = collection(db, "events");
      const q = query(eventsCollection, orderBy("start", "asc")); 
      const querySnapshot = await getDocs(q);
      const fetchedEvents: AcademicEvent[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          category: data.category, // Category name
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
        description: "Could not load events. Please try again later.",
      });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [toast]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "subjects");
      const q = query(subjectsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
        };
      });
      setSubjects(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Subjects",
        description: "Could not load subjects. Please try again later.",
      });
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [toast]);

  const fetchEventCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const categoriesCollection = collection(db, "eventCategories");
      const q = query(categoriesCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedCategories: EventCategory[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          subTypes: data.subTypes || [],
        };
      });
      setEventCategories(fetchedCategories);
    } catch (error) {
      console.error("Error fetching event categories from Firestore:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Categories",
        description: "Could not load event categories. Please try again later.",
      });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
    fetchSubjects();
    fetchEventCategories();
  }, [fetchEvents, fetchSubjects, fetchEventCategories]);


  useEffect(() => {
    if (!selectedEvent) {
      setShowEventDetail(false);
    }
  }, [selectedEvent]);
  
  const isLoading = isLoadingEvents || isLoadingSubjects || isLoadingCategories;

  const handleOpenDayView = (date: Date) => {
    setSelectedDateForDayView(date);
    setShowDayViewDialog(true);
  };

  const handleCloseDayView = () => {
    setShowDayViewDialog(false);
    setTimeout(() => setSelectedDateForDayView(null), 300); // Delay to allow for fade-out animation
  };

  const handleEventClickFromDayView = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
    // Optionally close DayViewDialog when an event detail is opened
    // setShowDayViewDialog(false); 
  };

  if (isLoading && !isMobile) { 
    return (
      <div className="flex flex-1 h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading calendar data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="flex-1 overflow-auto min-h-0">
      {isLoading && isMobile && ( 
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        )}
        <CalendarView
          allEvents={events}
          allSubjects={subjects}
          allCategories={eventCategories} 
          filters={filters}
          colorMode={colorMode}
          setSelectedEvent={setSelectedEvent}
          setShowEventDetail={setShowEventDetail}
          onDateClick={handleOpenDayView} // Pass callback to open day view
        />
      </div>

      {selectedEvent && (
        <EventDetailDialog
          event={selectedEvent}
          allSubjects={subjects}
          allCategories={eventCategories} 
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            setTimeout(() => setSelectedEvent(null), 300); 
          }}
        />
      )}

      {selectedDateForDayView && (
        <DayViewDialog
          isOpen={showDayViewDialog}
          onClose={handleCloseDayView}
          selectedDate={selectedDateForDayView}
          allEvents={events}
          allSubjects={subjects}
          allCategories={eventCategories}
          filters={filters} // Pass filters to DayViewDialog
          onEventClick={handleEventClickFromDayView}
        />
      )}
    </div>
  );
}
