
"use client";

import type { AcademicEvent, ColorCodingMode, Subject, EventCategory } from '@/lib/types';
import { getCategoryByName, getSubjectById } from '@/data/mock-data'; // getCategoryByName will be used with dynamic list
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, User, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface EventCardProps {
  event: AcademicEvent;
  allSubjects: Subject[]; 
  allCategories: EventCategory[]; // Receive all categories
  colorMode: ColorCodingMode;
  onClick: () => void;
}

export default function EventCard({ event, allSubjects, allCategories, colorMode, onClick }: EventCardProps) {
  // Use the passed allCategories list for lookup by name
  const category = getCategoryByName(event.category, allCategories);
  const subject = event.subjectId ? getSubjectById(event.subjectId, allSubjects) : null;

  const displayColor = colorMode === 'subject' && subject ? subject.color : category?.color || '#808080';

  const eventTime = `${format(event.start, 'p')} - ${format(event.end, 'p')}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card
          className="mb-2 cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-[5px]"
          style={{ borderLeftColor: displayColor }}
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onClick()}
        >
          <CardContent className="p-2 space-y-1">
            <h4 className="text-sm font-semibold truncate text-primary">{event.title}</h4>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" />
              {eventTime}
            </div>
            {subject && (
              <Badge variant="outline" className="text-xs py-0.5 px-1.5" style={{borderColor: subject.color, color: subject.color}}>
                {subject.name}
              </Badge>
            )}
            {!subject && category && (
               <Badge variant="outline" className="text-xs py-0.5 px-1.5" style={{borderColor: category.color, color: category.color}}>
                {category.name} {/* Display category name */}
              </Badge>
            )}
             {!subject && !category && event.category && ( // Fallback if category not in DB but name exists on event
               <Badge variant="outline" className="text-xs py-0.5 px-1.5">
                {event.category}
              </Badge>
            )}
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="bg-popover text-popover-foreground shadow-lg rounded-md p-3">
        <p className="font-semibold">{event.title}</p>
        <p className="text-sm text-muted-foreground">{eventTime}</p>
        {category && <p className="text-xs">Category: {category.name}{event.subType ? ` (${event.subType})` : ''}</p>}
        {!category && event.category && <p className="text-xs">Category: {event.category}{event.subType ? ` (${event.subType})` : ''}</p>}
        {subject && <p className="text-xs">Subject: {subject.name}</p>}
        {event.location && <p className="text-xs flex items-center"><MapPin className="w-3 h-3 mr-1" /> {event.location}</p>}
        {event.faculty && <p className="text-xs flex items-center"><User className="w-3 h-3 mr-1" /> {event.faculty}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
