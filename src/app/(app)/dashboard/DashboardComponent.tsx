
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, Timestamp, query, DocumentData, QueryDocumentSnapshot, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";
import { db } from '@/lib/firebase'; 

import CalendarView from '@/components/calendar/calendar-view';
import EventDetailDialog from '@/components/calendar/event-detail-dialog';
import DayViewDialog from '@/components/calendar/day-view-dialog';
import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useFilters } from '@/contexts/FilterContext';
import { Skeleton } from '@/components/ui/skeleton';

const departmentNames: { [key: string]: string } = {
    "std-1": "1st Standard",
    "std-2": "2nd Standard",
    "std-3": "3rd Standard",
    "std-4": "4th Standard",
    "std-5": "5th Standard",
    "std-6": "6th Standard",
    "std-7": "7th Standard",
    "std-8": "8th Standard",
    "std-9": "9th Standard",
    "std-10": "10th Standard",
};

// A skeleton loader component for the mobile view
function MobileCalendarSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-2/5 rounded-md" />
        <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      <div className="border rounded-lg p-2 space-y-2">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full rounded-md" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}


export default function DashboardComponent() {
  const searchParams = useSearchParams();
  const department = searchParams.get('department') || 'std-1'; // Default to 'std-1'
  
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [eventCategories, setEventCategories] = useState<EventCategory[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const { filters, setFilters, colorMode } = useFilters();
  const [selectedEvent, setSelectedEvent] = useState<AcademicEvent | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  // State for Day View Dialog
  const [selectedDateForDayView, setSelectedDateForDayView] = useState<Date | null>(null);
  const [showDayViewDialog, setShowDayViewDialog] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const fetchEvents = useCallback(async (departmentId: string) => {
    setIsLoadingEvents(true);
    try {
      const eventsCollection = collection(db, "events");
      const q = query(eventsCollection, where("departmentId", "==", departmentId));
      const querySnapshot = await getDocs(q);
      const fetchedEvents = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          if (!(data.start instanceof Timestamp) || !(data.end instanceof Timestamp)) {
            console.warn(`Skipping malformed event on public dashboard (ID: ${doc.id}).`);
            return null; // Silently skip on public view
          }
          return {
            id: doc.id,
            title: data.title,
            category: data.category,
            start: data.start.toDate(),
            end: data.end.toDate(),
            departmentId: data.departmentId,
            ...(data.subType && { subType: data.subType }),
            ...(data.subjectId && { subjectId: data.subjectId }),
            ...(data.semester && { semester: data.semester }),
            ...(data.section && { section: data.section }),
            ...(data.location && { location: data.location }),
            ...(data.faculty && { faculty: data.faculty }),
            ...(data.description && { description: data.description }),
            ...(data.attendees && { attendees: data.attendees }),
          };
        })
        .filter((event): event is AcademicEvent => event !== null);
      
      const sortedEvents = fetchedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(sortedEvents);
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
  
  useEffect(() => {
    setFilters({ categories: [], subjects: [], subTypes: [], semesters: [], sections: [], dateRange: {} });
    fetchEvents(department);

    // Set up real-time listener for subjects for the current department
    setIsLoadingSubjects(true);
    const subjectsCollection = collection(db, "subjects");
    const subjectsQuery = query(subjectsCollection, where("departmentId", "==", department), orderBy("name"));
    const unsubscribeSubjects = onSnapshot(subjectsQuery, (querySnapshot) => {
      const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          departmentId: data.departmentId,
          semester: data.semester,
        };
      });
      setSubjects(fetchedSubjects);
      setIsLoadingSubjects(false);
    }, (error) => {
      console.error("Error fetching real-time subjects:", error);
      toast({ variant: "destructive", title: "Error Fetching Subjects", description: "Could not load subjects in real-time." });
      setIsLoadingSubjects(false);
    });

    // Set up real-time listener for global event categories
    setIsLoadingCategories(true);
    const categoriesCollection = collection(db, "eventCategories");
    const categoriesQuery = query(categoriesCollection, orderBy("name"));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (querySnapshot) => {
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
        setIsLoadingCategories(false);
    }, (error) => {
        console.error("Error fetching real-time event categories:", error);
        toast({ variant: "destructive", title: "Error Fetching Categories", description: "Could not load categories in real-time." });
        setIsLoadingCategories(false);
    });

    // Cleanup function to unsubscribe from listeners when component unmounts or department changes
    return () => {
      unsubscribeSubjects();
      unsubscribeCategories();
    };
  }, [department, fetchEvents, setFilters, toast]);

  useEffect(() => {
    if (!selectedEvent) {
      setShowEventDetail(false);
    }
  }, [selectedEvent]);
  
  const isLoading = isLoadingEvents || isLoadingSubjects || isLoadingCategories;

  const departmentDisplayName = useMemo(() => departmentNames[department] || department.toUpperCase(), [department]);

  const handleOpenDayView = (date: Date) => {
    setSelectedDateForDayView(date);
    setShowDayViewDialog(true);
  };

  const handleOpenTodayView = () => {
    handleOpenDayView(new Date());
  };

  const handleCloseDayView = () => {
    setShowDayViewDialog(false);
    setTimeout(() => setSelectedDateForDayView(null), 300); // Delay to allow for fade-out animation
  };

  const handleEventClickFromDayView = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  if (isLoading) {
    return isMobile ? <MobileCalendarSkeleton /> : (
      <div className="flex flex-1 h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading {departmentDisplayName} calendar data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="p-4 md:px-6 md:pt-6 md:pb-0">
          <h1 className="text-2xl font-bold text-primary">
              {departmentDisplayName} Calendar
          </h1>
          <p className="text-muted-foreground">Academic events and schedules for the {departmentDisplayName}.</p>
      </div>
      <div className="flex-1 overflow-auto min-h-0">
        <CalendarView
          allEvents={events}
          allSubjects={subjects}
          allCategories={eventCategories} 
          filters={filters}
          colorMode={colorMode}
          setSelectedEvent={setSelectedEvent}
          setShowEventDetail={setShowEventDetail}
          onDateClick={handleOpenDayView}
          onTodayClick={handleOpenTodayView}
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
          filters={filters}
          onEventClick={handleEventClickFromDayView}
        />
      )}
    </div>
  );
}
