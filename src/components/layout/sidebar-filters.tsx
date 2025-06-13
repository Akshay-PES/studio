
"use client";

import * as React from 'react';
import { CalendarIcon, Palette, Tag, Layers, Filter, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { EventCategoryName } from '@/lib/types';
import { eventCategories, subjects } from '@/data/mock-data';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useFilters } from '@/contexts/FilterContext';

export default function SidebarFilters() {
  const { filters, setFilters, colorMode, setColorMode } = useFilters();

  const handleCategoryChange = (categoryName: EventCategoryName, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryName]
        : prev.categories.filter(c => c !== categoryName),
      // Reset subTypes when categories change, as available subtypes depend on selected categories
      subTypes: [],
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

  const handleSubTypeChange = (subTypeName: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      subTypes: checked
        ? [...prev.subTypes, subTypeName]
        : prev.subTypes.filter(st => st !== subTypeName),
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
    setFilters({ categories: [], subjects: [], subTypes: [], dateRange: {} });
    setColorMode('category');
  };

  const availableSubTypes = React.useMemo(() => {
    if (filters.categories.length === 0) {
      return [];
    }
    const allSelectedSubTypes = eventCategories
      .filter(category => filters.categories.includes(category.name))
      .flatMap(category => category.subTypes || [])
      .filter(subType => subType); // Ensure not undefined or empty string if that's possible
    return [...new Set(allSelectedSubTypes)].sort();
  }, [filters.categories]);

  return (
    <div className="p-2 space-y-3 h-full flex flex-col text-sidebar-foreground bg-sidebar">
      <div className="flex items-center justify-between px-2 pt-2">
        <h3 className="text-base font-semibold font-headline flex items-center gap-1.5">
          <Filter className="w-4 h-4" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs hover:bg-sidebar-accent h-7 px-2">Clear All</Button>
      </div>
      
      <ScrollArea className="flex-grow pr-1">
        <Accordion type="multiple" defaultValue={['categories', 'subjects', 'sub-types', 'date-range', 'display']} className="w-full">
          <AccordionItem value="categories" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Categories</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {eventCategories.map(category => (
                <div key={category.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                  <Checkbox
                    id={`cat-${category.id}`}
                    checked={filters.categories.includes(category.name)}
                    onCheckedChange={(checked) => handleCategoryChange(category.name, !!checked)}
                    className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                  />
                  <Label htmlFor={`cat-${category.id}`} className="text-xs font-normal cursor-pointer flex-grow">
                    {category.name}
                  </Label>
                   <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sub-types" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><ListFilter className="w-4 h-4" /> Sub-Types</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {filters.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">Select a category to see available sub-types.</p>
              ) : availableSubTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">No sub-types available for selected category/categories.</p>
              ) : (
                availableSubTypes.map(subType => (
                  <div key={subType} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                    <Checkbox
                      id={`subtype-${subType.replace(/\s+/g, '-')}`} // Create a safe ID
                      checked={filters.subTypes.includes(subType)}
                      onCheckedChange={(checked) => handleSubTypeChange(subType, !!checked)}
                      className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                    />
                    <Label htmlFor={`subtype-${subType.replace(/\s+/g, '-')}`} className="text-xs font-normal cursor-pointer flex-grow">
                      {subType}
                    </Label>
                  </div>
                ))
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subjects" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Subjects</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {subjects.map(subject => (
                <div key={subject.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                  <Checkbox
                    id={`sub-${subject.id}`}
                    checked={filters.subjects.includes(subject.id)}
                    onCheckedChange={(checked) => handleSubjectChange(subject.id, !!checked)}
                    className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                  />
                  <Label htmlFor={`sub-${subject.id}`} className="text-xs font-normal cursor-pointer flex-grow">
                    {subject.name}
                  </Label>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject.color }} />
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="date-range" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
               <div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4" /> Date Range</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1.5 pb-2 space-y-2 px-2">
              <div>
                <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1 h-8 text-xs bg-sidebar-accent border-sidebar-border hover:bg-sidebar-accent/70", 
                        !filters.dateRange?.start && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {filters.dateRange?.start ? format(filters.dateRange.start, "MMM d, yyyy") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
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
                <Label htmlFor="end-date" className="text-xs">End Date</Label>
                 <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1 h-8 text-xs bg-sidebar-accent border-sidebar-border hover:bg-sidebar-accent/70", 
                        !filters.dateRange?.end && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                      {filters.dateRange?.end ? format(filters.dateRange.end, "MMM d, yyyy") : <span>Pick date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground" align="start">
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

          <AccordionItem value="display" className="border-b-0">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Palette className="w-4 h-4" /> Display Options</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1.5 pb-2 space-y-2 px-2">
              <div className="flex items-center justify-between p-1 rounded-md">
                <Label htmlFor="color-mode" className="text-xs">Color Code by Subject</Label>
                <Switch
                  id="color-mode"
                  checked={colorMode === 'subject'}
                  onCheckedChange={(checked) => setColorMode(checked ? 'subject' : 'category')}
                  className="data-[state=checked]:bg-sidebar-primary data-[state=unchecked]:bg-sidebar-accent"
                />
              </div>
               <p className="text-xs text-muted-foreground/80 px-1">
                Toggle to color events by subject. Default is by category.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      <Separator className="my-1.5 bg-sidebar-border"/>
      <div className="text-xs text-center text-muted-foreground/70 pb-2">
        AcademiaSync v1.0
      </div>
    </div>
  );
}

