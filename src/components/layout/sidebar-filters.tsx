"use client";

import type { Dispatch, SetStateAction } from 'react';
import { CalendarIcon, Palette, Tag, Layers, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { CalendarFilters, ColorCodingMode, EventCategoryName } from '@/lib/types';
import { eventCategories, subjects } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface SidebarFiltersProps {
  filters: CalendarFilters;
  setFilters: Dispatch<SetStateAction<CalendarFilters>>;
  colorMode: ColorCodingMode;
  setColorMode: Dispatch<SetStateAction<ColorCodingMode>>;
}

export default function SidebarFilters({ filters, setFilters, colorMode, setColorMode }: SidebarFiltersProps) {
  const handleCategoryChange = (categoryName: EventCategoryName, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryName]
        : prev.categories.filter(c => c !== categoryName),
    }));
  };

  const handleSubjectChange = (subjectId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      subjects: checked
        ? [...prev.subjects, subjectId]
        : prev.subjects.filter(s => s !== subjectId),
    }));
  };
  
  const handleDateChange = (field: 'start' | 'end', date?: Date) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date,
      },
    }));
  };

  const clearFilters = () => {
    setFilters({ categories: [], subjects: [], dateRange: {} });
    setColorMode('category');
  };

  return (
    <div className="p-4 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold font-headline flex items-center gap-2">
          <Filter className="w-5 h-5" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">Clear All</Button>
      </div>
      
      <ScrollArea className="flex-grow pr-3">
        <Accordion type="multiple" defaultValue={['categories', 'subjects', 'date-range', 'display']} className="w-full">
          <AccordionItem value="categories">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2"><Layers className="w-4 h-4" /> Categories</div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              {eventCategories.map(category => (
                <div key={category.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/50">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filters.categories.includes(category.name)}
                    onCheckedChange={(checked) => handleCategoryChange(category.name, !!checked)}
                    style={{color: category.color}}
                  />
                  <Label htmlFor={`cat-${category.id}`} className="text-sm font-normal cursor-pointer flex-grow">
                    {category.name}
                  </Label>
                   <span className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subjects">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2"><Tag className="w-4 h-4" /> Subjects</div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-2">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/50">
                  <Checkbox
                    id={`sub-${subject.id}`}
                    checked={filters.subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                  />
                  <Label htmlFor={`sub-${subject.id}`} className="text-sm font-normal cursor-pointer flex-grow">
                    {subject.name}
                  </Label>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="date-range">
            <AccordionTrigger className="text-base font-medium">
               <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4" /> Date Range</div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 space-y-3">
              <div>
                <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !filters.dateRange?.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.start ? format(filters.dateRange.start, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.start}
                      onSelect={(date) => handleDateChange('start', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="end-date" className="text-sm">End Date</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !filters.dateRange?.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange?.end ? format(filters.dateRange.end, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.end}
                      onSelect={(date) => handleDateChange('end', date)}
                      disabled={(date) => filters.dateRange?.start ? date < filters.dateRange.start : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="display">
            <AccordionTrigger className="text-base font-medium">
              <div className="flex items-center gap-2"><Palette className="w-4 h-4" /> Display Options</div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between p-1 rounded-md">
                <Label htmlFor="color-mode" className="text-sm">Color Code by Subject</Label>
                <Switch
                  id="color-mode"
                  checked={colorMode === 'subject'}
                  onCheckedChange={(checked) => setColorMode(checked ? 'subject' : 'category')}
                />
              </div>
               <p className="text-xs text-muted-foreground px-1">
                Toggle to color events by their specific subject. Default is by category.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      <Separator className="my-4"/>
      <div className="text-xs text-center text-muted-foreground">
        AcademiaSync v1.0
      </div>
    </div>
  );
}
