
"use client";

import type { Dispatch, SetStateAction } from 'react';
import type { AcademicEvent, CalendarFilters, ColorCodingMode, Subject, EventCategory } from '@/lib/types';
import EventCard from './event-card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday as fnsIsToday,
  startOfDay,
} from 'date-fns';
import React from 'react';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  allEvents: AcademicEvent[];
  allSubjects: Subject[];
  allCategories: EventCategory[];
  filters: CalendarFilters;
  colorMode: ColorCodingMode;
  setSelectedEvent: Dispatch<SetStateAction<AcademicEvent | null>>;
  setShowEventDetail: Dispatch<SetStateAction<boolean>>;
  onDateClick: (date: Date) => void; // Callback for when a date number is clicked
}

export default function CalendarView({
  allEvents,
  allSubjects,
  allCategories,
  filters,
  colorMode,
  setSelectedEvent,
  setShowEventDetail,
  onDateClick, 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const handleEventClick = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const filteredEvents = React.useMemo(() => {
    const subjectsById = new Map(allSubjects.map(subject => [subject.id, subject]));

    return allEvents.filter(event => {
      const eventStart = event.start;
      const eventEnd = event.end;

      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      if (filters.subTypes.length > 0) {
        if (!event.subType || !filters.subTypes.includes(event.subType)) {
          return false;
        }
      }
      if (filters.subjects.length > 0 && event.subjectId && !filters.subjects.includes(event.subjectId)) {
        return false;
      }
      if (filters.semesters.length > 0) {
        const eventSubject = event.subjectId ? subjectsById.get(event.subjectId) : null;
        const eventSemester = event.semester;
        const subjectSemester = eventSubject?.semester;

        const semesterMatch = (eventSemester && filters.semesters.includes(eventSemester)) || 
                              (subjectSemester && filters.semesters.includes(subjectSemester));
        
        if (!semesterMatch) {
            return false;
        }
      }
      if (filters.sections.length > 0 && event.section && !filters.sections.includes(event.section)) {
        return false;
      }
      if (filters.dateRange?.start && eventEnd < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange?.end && eventStart > filters.dateRange.end) {
        return false;
      }
      return true;
    });
  }, [allEvents, allSubjects, filters]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); 

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl md:text-2xl font-headline text-primary text-center w-40 sm:w-48">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="ml-2 hidden sm:inline-flex">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2 sm:hidden">
            <Button variant="outline" onClick={goToToday} className="text-xs px-2.5 py-1 h-auto">
                Today
            </Button>
        </div>
      </div>
      
      <div className="flex-grow overflow-hidden border rounded-lg shadow-sm bg-card flex flex-col min-h-0">
        <div className="grid grid-cols-7 sticky top-0 bg-card z-10 border-b">
          {dayNames.map(dayName => (
            <div key={dayName} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 flex-grow min-h-0">
          {days.map(day => {
            const eventsForDay = filteredEvents.filter(event => {
              const eventStartDateOnly = startOfDay(event.start);
              const eventEndDateOnly = startOfDay(event.end);
              const currentDayOnly = startOfDay(day);
              return currentDayOnly >= eventStartDateOnly && currentDayOnly <= eventEndDateOnly;
            });
            return (
              <div
                key={day.toString()}
                className={cn(
                  "p-1.5 border-b border-r text-sm overflow-hidden flex flex-col", 
                  !isSameMonth(day, currentDate) ? 'bg-muted/30' : 'bg-card',
                  fnsIsToday(day) ? 'border-primary border-2 relative' : ''
                )}
              >
                <span 
                  className={cn(
                    "block text-center mb-1 p-1 rounded-full w-7 h-7 flex items-center justify-center mx-auto shrink-0 cursor-pointer hover:bg-accent/50 transition-colors",
                    fnsIsToday(day) ? 'bg-primary text-primary-foreground font-bold' : isSameMonth(day, currentDate) ? 'text-foreground' : 'text-muted-foreground/70'
                  )}
                  onClick={() => onDateClick(day)} // Trigger day view
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && onDateClick(day)}
                  aria-label={`View events for ${format(day, 'PPP')}`}
                >
                  {format(day, 'd')}
                </span>
                {fnsIsToday(day) && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                <div className="space-y-1 overflow-y-auto flex-grow max-h-36 custom-scrollbar">
                  {eventsForDay.map(event => (
                    <EventCard 
                        key={event.id} 
                        event={event} 
                        allSubjects={allSubjects}
                        allCategories={allCategories}
                        colorMode={colorMode} 
                        onClick={() => handleEventClick(event)} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: hsl(var(--border));
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background-color: transparent;
        }
      `}</style>
    </div>
  );
}
