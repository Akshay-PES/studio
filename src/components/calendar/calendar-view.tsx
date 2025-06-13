"use client";

import type { useState, Dispatch, SetStateAction } from 'react';
import type { AcademicEvent, CalendarFilters, ColorCodingMode } from '@/lib/types';
import { getCategoryByName, getSubjectById, academicEvents as allEvents } from '@/data/mock-data';
import EventCard from './event-card';
import EventDetailDialog from './event-detail-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
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
  parseISO,
} from 'date-fns';
import React from 'react'; // Explicitly import React for useState

interface CalendarViewProps {
  filters: CalendarFilters;
  colorMode: ColorCodingMode;
  setSelectedEvent: Dispatch<SetStateAction<AcademicEvent | null>>;
  setShowEventDetail: Dispatch<SetStateAction<boolean>>;
}

export default function CalendarView({ filters, colorMode, setSelectedEvent, setShowEventDetail }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [viewMode, setViewMode] = React.useState<'month' | 'week' | 'day'>('month'); // Simplified to month for now

  const handleEventClick = (event: AcademicEvent) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const filteredEvents = React.useMemo(() => {
    return allEvents.filter(event => {
      const eventStart = event.start; // Already a Date object
      const eventEnd = event.end; // Already a Date object

      if (filters.categories.length > 0 && !filters.categories.includes(event.category)) {
        return false;
      }
      if (filters.subjects.length > 0 && (!event.subjectId || !filters.subjects.includes(event.subjectId))) {
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
  }, [filters]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

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
          <h2 className="text-xl md:text-2xl font-headline text-primary text-center w-48">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Next month">
            <ChevronRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="ml-2 hidden sm:inline-flex">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={goToToday} className="sm:hidden text-sm px-3 py-1.5 h-auto">
                Today
            </Button>
          {/* View mode selector can be added here if more views are implemented */}
          {/* <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week" disabled>Week</SelectItem>
              <SelectItem value="day" disabled>Day</SelectItem>
            </SelectContent>
          </Select> */}
        </div>
      </div>

      {/* Calendar Grid - Month View */}
      <div className="flex-grow overflow-auto border rounded-lg shadow-sm bg-card">
        <div className="grid grid-cols-7 sticky top-0 bg-card z-10 border-b">
          {dayNames.map(dayName => (
            <div key={dayName} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {dayName}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 grid-rows-5 min-h-[calc(100%-2.5rem)]">
          {days.map(day => {
            const eventsForDay = filteredEvents.filter(event => isSameDay(event.start, day));
            return (
              <div
                key={day.toString()}
                className={`p-1.5 border-b border-r text-sm overflow-hidden
                  ${!isSameMonth(day, currentDate) ? 'bg-muted/30' : 'bg-card'}
                  ${fnsIsToday(day) ? 'border-primary border-2 relative' : ''}`}
              >
                <span className={`block text-center mb-1 p-1 rounded-full w-7 h-7 flex items-center justify-center mx-auto
                  ${fnsIsToday(day) ? 'bg-primary text-primary-foreground font-bold' : isSameMonth(day, currentDate) ? 'text-foreground' : 'text-muted-foreground/70'}
                  `}>
                  {format(day, 'd')}
                </span>
                {fnsIsToday(day) && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />}
                <div className="space-y-1 overflow-y-auto max-h-28 custom-scrollbar">
                  {eventsForDay.map(event => (
                    <EventCard key={event.id} event={event} colorMode={colorMode} onClick={() => handleEventClick(event)} />
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
