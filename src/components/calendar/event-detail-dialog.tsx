
"use client";

import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
import { getCategoryByName, getSubjectById } from '@/data/mock-data'; // Helpers updated to take dynamic lists
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Clock, MapPin, User, Info, BookOpen, Users, ListFilter, Bookmark } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailDialogProps {
  event: AcademicEvent | null;
  allSubjects: Subject[]; 
  allCategories: EventCategory[]; // Receive all categories
  isOpen: boolean;
  onClose: () => void;
}

export default function EventDetailDialog({ event, allSubjects, allCategories, isOpen, onClose }: EventDetailDialogProps) {
  if (!event) return null;

  // Use the passed allCategories list for lookup by name
  const category = getCategoryByName(event.category, allCategories);
  const subject = event.subjectId ? getSubjectById(event.subjectId, allSubjects) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary">{event.title}</DialogTitle>
          {category && (
            <DialogDescription className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
              {category.name} {/* Display category name */}
              {event.subType && ` - ${event.subType}`}
            </DialogDescription>
          )}
          {!category && event.category && ( // Fallback if category not in DB but name exists
             <DialogDescription className="flex items-center gap-2">
              {event.category}
              {event.subType && ` - ${event.subType}`}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {subject && (
              <div className="p-3 rounded-md bg-accent/50 border border-accent">
                <h4 className="font-semibold flex items-center gap-2 mb-1">
                  <BookOpen className="w-4 h-4 text-accent-foreground" /> Subject Details
                </h4>
                <p className="text-sm"><strong className="text-accent-foreground">{subject.name}</strong></p>
                {/* Removed subject.courseCode and subject.semester as they are not in base Subject type */}
                 <div className="mt-1">
                    <Badge variant="outline" style={{ borderColor: subject.color, color: subject.color, backgroundColor: `${subject.color}1A` }}>
                      {subject.name}
                    </Badge>
                  </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start">
                <CalendarDays className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <div>
                  <strong>Date:</strong>
                  <p>{format(event.start, 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                <div>
                  <strong>Time:</strong>
                  <p>{format(event.start, 'p')} - {format(event.end, 'p')}</p>
                </div>
              </div>
              {event.location && (
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                  <div>
                    <strong>Location:</strong>
                    <p>{event.location}</p>
                  </div>
                </div>
              )}
              {event.faculty && (
                 <div className="flex items-start">
                  <User className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                  <div>
                    <strong>Faculty:</strong>
                    <p>{event.faculty}</p>
                  </div>
                </div>
              )}
              {event.semester && (
                <div className="flex items-start">
                  <ListFilter className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                  <div>
                    <strong>Semester/Trimester:</strong>
                    <p>{event.semester}</p>
                  </div>
                </div>
              )}
              {event.section && (
                <div className="flex items-start">
                  <Bookmark className="w-4 h-4 mr-2 mt-0.5 text-primary" />
                  <div>
                    <strong>Section:</strong>
                    <p>{event.section}</p>
                  </div>
                </div>
              )}
            </div>

            {event.description && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-1">
                    <Info className="w-4 h-4 text-primary" /> Description
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
                </div>
              </>
            )}

            {event.attendees && event.attendees.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-primary" /> Attendees
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {event.attendees.map((attendee, index) => <li key={index}>{attendee}</li>)}
                  </ul>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
