
"use client";

import type { AcademicEvent, Subject, EventCategory, CalendarFilters } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Clock, MapPin, Layers, BookOpen, Info, ListFilter, Bookmark } from 'lucide-react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { getCategoryByName, getSubjectById } from '@/data/mock-data';

interface DayViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  allEvents: AcademicEvent[];
  allSubjects: Subject[];
  allCategories: EventCategory[];
  filters: CalendarFilters; // Add filters prop
  onEventClick: (event: AcademicEvent) => void;
}

export default function DayViewDialog({
  isOpen,
  onClose,
  selectedDate,
  allEvents,
  allSubjects,
  allCategories,
  filters, // Destructure filters
  onEventClick,
}: DayViewDialogProps) {
  
  const eventsForSelectedDate = allEvents
    .filter(event => {
      // Date filtering (ensure event is on selectedDate)
      const eventStartDateOnly = startOfDay(event.start);
      const eventEndDateOnly = startOfDay(event.end);
      const currentDayOnly = startOfDay(selectedDate);
      const isEventOnSelectedDate = currentDayOnly >= eventStartDateOnly && currentDayOnly <= eventEndDateOnly;
      if (!isEventOnSelectedDate) return false;

      // Apply additional filters (categories, sub-types, subjects, semesters)
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
      if (filters.semesters.length > 0 && event.semester && !filters.semesters.includes(event.semester)) {
        return false;
      }
      if (filters.sections.length > 0 && event.section && !filters.sections.includes(event.section)) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary flex items-center">
            <CalendarDays className="w-6 h-6 mr-2" />
            Events for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </DialogTitle>
          <DialogDescription>
            All scheduled (and filtered) events for the selected day. Click on an event for more details.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-3 my-4">
          {eventsForSelectedDate.length > 0 ? (
            <ul className="space-y-3">
              {eventsForSelectedDate.map((event, index) => {
                const category = getCategoryByName(event.category, allCategories);
                const subject = event.subjectId ? getSubjectById(event.subjectId, allSubjects) : null;
                const isMultiDayOnThisDate = !isSameDay(event.start, event.end) && 
                                             (isSameDay(selectedDate, event.start) || isSameDay(selectedDate, event.end) || 
                                             (selectedDate > event.start && selectedDate < event.end));

                return (
                  <li key={event.id}>
                    <button
                      onClick={() => onEventClick(event)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ borderColor: category?.color || subject?.color || 'hsl(var(--border))' }}
                    >
                      <h3 className="font-semibold text-primary mb-1">{event.title}</h3>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                           {isSameDay(event.start, event.end) || (isSameDay(selectedDate, event.start) && isSameDay(selectedDate, event.end)) ?
                            `${format(event.start, 'p')} - ${format(event.end, 'p')}` :
                            isSameDay(selectedDate, event.start) ? 
                            `Starts ${format(event.start, 'p')} (ends ${format(event.end, 'MMM d')})` :
                            isSameDay(selectedDate, event.end) ?
                            `Ends ${format(event.end, 'p')} (started ${format(event.start, 'MMM d')})` :
                            `Ongoing (Started ${format(event.start, 'MMM d')}, ends ${format(event.end, 'MMM d')})`
                          }
                        </div>
                        {category && (
                          <div className="flex items-center">
                            <Layers className="w-3.5 h-3.5 mr-1.5" style={{ color: category.color }} />
                            {category.name} {event.subType && `(${event.subType})`}
                          </div>
                        )}
                        {subject && (
                          <div className="flex items-center">
                            <BookOpen className="w-3.5 h-3.5 mr-1.5" style={{ color: subject.color }} />
                            {subject.name}
                          </div>
                        )}
                        {event.semester && (
                          <div className="flex items-center">
                            <ListFilter className="w-3.5 h-3.5 mr-1.5" />
                            Sem/Trimester: {event.semester}
                          </div>
                        )}
                        {event.section && (
                          <div className="flex items-center">
                            <Bookmark className="w-3.5 h-3.5 mr-1.5" />
                            Section: {event.section}
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center">
                            <MapPin className="w-3.5 h-3.5 mr-1.5" />
                            {event.location}
                          </div>
                        )}
                      </div>
                    </button>
                    {index < eventsForSelectedDate.length - 1 && <Separator className="my-3" />}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Info className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No events scheduled for this day based on current filters.</p>
            </div>
          )}
        </ScrollArea>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="mt-2 w-full sm:w-auto">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
