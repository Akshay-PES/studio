
"use client";

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, orderBy, DocumentData, QueryDocumentSnapshot, where, onSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { CalendarIcon, Palette, Tag, Layers, Filter, ListFilter, ChevronsUpDown, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { Subject, EventCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useFilters } from '@/contexts/FilterContext';
import { useToast } from '@/hooks/use-toast';

export default function SidebarFilters() {
  const { filters, setFilters, colorMode, setColorMode } = useFilters();
  const [subjectsDB, setSubjectsDB] = React.useState<Subject[]>([]);
  const [eventCategoriesDB, setEventCategoriesDB] = React.useState<EventCategory[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = React.useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = React.useState(true);
  const { toast } = useToast();
  
  const searchParams = useSearchParams();
  const department = searchParams.get('department') || 'std-1';

  React.useEffect(() => {
    if (!department) return;
    setIsLoadingSubjects(true);
    const subjectsCollection = collection(db, "subjects");
    const q = query(subjectsCollection, where("departmentId", "==", department), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return { 
                id: doc.id, 
                name: data.name, 
                color: data.color, 
                departmentId: data.departmentId, 
                semester: data.semester 
            };
        });
        setSubjectsDB(fetchedSubjects);
        setIsLoadingSubjects(false);
    }, (error) => {
        console.error("Error fetching subjects for filters:", error);
        toast({ variant: "destructive", title: "Error Real-time Subjects" });
        setIsLoadingSubjects(false);
    });
    return () => unsubscribe();
  }, [toast, department]);

  React.useEffect(() => {
    setIsLoadingCategories(true);
    const categoriesCollection = collection(db, "eventCategories");
    const q = query(categoriesCollection, orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedCategories: EventCategory[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return { id: doc.id, name: data.name, color: data.color, subTypes: data.subTypes || [] };
        });
        setEventCategoriesDB(fetchedCategories);
        setIsLoadingCategories(false);
    }, (error) => {
        console.error("Error fetching event categories for filters:", error);
        toast({ variant: "destructive", title: "Error Real-time Categories" });
        setIsLoadingCategories(false);
    });
    return () => unsubscribe();
  }, [toast]);


  // Category filter uses category names
  const handleCategoryChange = (categoryName: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, categoryName]
        : prev.categories.filter(cName => cName !== categoryName),
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
  
  const handleSemesterChange = (semester: number, checked: boolean) => {
    setFilters(prev => {
        const newSemesters = checked
        ? [...prev.semesters, semester]
        : prev.semesters.filter(s => s !== semester);
        
        // When semesters change, we need to un-filter subjects that are no longer relevant
        const stillValidSubjects = prev.subjects.filter(subjectId => {
            const subject = subjectsDB.find(s => s.id === subjectId);
            // Keep subject if it has no semester or its semester is in the new list
            return !subject?.semester || newSemesters.includes(subject.semester);
        });

        return {
            ...prev,
            semesters: newSemesters,
            subjects: stillValidSubjects,
        };
    });
  };

  const handleSectionChange = (section: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      sections: checked
        ? [...prev.sections, section]
        : prev.sections.filter(s => s !== section),
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
    setFilters({ categories: [], subjects: [], subTypes: [], semesters: [], sections: [], dateRange: {} });
    setColorMode('category');
  };

  const availableSubTypes = React.useMemo(() => {
    if (filters.categories.length === 0 || eventCategoriesDB.length === 0) return [];
    const allSelectedSubTypes = eventCategoriesDB
      .filter(category => filters.categories.includes(category.name)) // Filter by name
      .flatMap(category => category.subTypes || [])
      .filter(subType => subType);
    return [...new Set(allSelectedSubTypes)].sort();
  }, [filters.categories, eventCategoriesDB]);

  const filteredSubjectsForDisplay = React.useMemo(() => {
    if (filters.semesters.length === 0) {
      return subjectsDB; // If no semester is selected, show all subjects
    }
    return subjectsDB.filter(subject => 
      subject.semester && filters.semesters.includes(subject.semester)
    );
  }, [filters.semesters, subjectsDB]);

  return (
    <div className="p-2 space-y-3 h-full flex flex-col text-sidebar-foreground bg-sidebar">
      <div className="flex items-center justify-between px-2 pt-2">
        <h3 className="text-base font-semibold font-headline flex items-center gap-1.5">
          <Filter className="w-4 h-4" /> Filters
        </h3>
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs hover:bg-sidebar-accent h-7 px-2">Clear All</Button>
      </div>
      
      <ScrollArea className="flex-grow pr-1">
        <Accordion type="multiple" defaultValue={['categories', 'subjects', 'sub-types', 'semesters', 'date-range', 'display']} className="w-full">
          <AccordionItem value="categories" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Layers className="w-4 h-4" /> Categories</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {isLoadingCategories ? (<p className="text-xs text-muted-foreground/80 px-1 py-2">Loading categories...</p>)
              : eventCategoriesDB.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">No categories found. Add them via Admin Panel.</p>
              ) : (
                eventCategoriesDB.map(category => (
                  <div key={category.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                    <Checkbox
                      id={`cat-${category.id}`}
                      checked={filters.categories.includes(category.name)} // Filter by name
                      onCheckedChange={(checked) => handleCategoryChange(category.name, !!checked)}
                      className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                    />
                    <Label htmlFor={`cat-${category.id}`} className="text-xs font-normal cursor-pointer flex-grow">
                      {category.name}
                    </Label>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                  </div>
                ))
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sub-types" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><ChevronsUpDown className="w-4 h-4" /> Sub-Types</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {filters.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">Select a category to see sub-types.</p>
              ) : availableSubTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">No sub-types for selected category/categories.</p>
              ) : (
                availableSubTypes.map(subType => (
                  <div key={subType} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                    <Checkbox
                      id={`subtype-${subType.replace(/\s+/g, '-')}`}
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

          <AccordionItem value="semesters" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><ListFilter className="w-4 h-4" /> Standard</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map(std => (
                <div key={std} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                  <Checkbox
                    id={`std-${std}`}
                    checked={filters.semesters.includes(std)}
                    onCheckedChange={(checked) => handleSemesterChange(std, !!checked)}
                    className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                  />
                  <Label htmlFor={`std-${std}`} className="text-xs font-normal cursor-pointer flex-grow">
                    {std}{std === 1 ? 'st' : std === 2 ? 'nd' : std === 3 ? 'rd' : 'th'} Standard
                  </Label>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subjects" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> Subjects</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {isLoadingSubjects ? (<p className="text-xs text-muted-foreground/80 px-1 py-2">Loading subjects...</p>) 
              : filteredSubjectsForDisplay.length === 0 ? (
                <p className="text-xs text-muted-foreground/80 px-1 py-2">No subjects found for the selected criteria.</p>
              ) : (
                filteredSubjectsForDisplay.map(subject => (
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
                ))
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="sections" className="border-b-sidebar-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline px-2 py-2.5">
              <div className="flex items-center gap-1.5"><Bookmark className="w-4 h-4" /> Section</div>
            </AccordionTrigger>
            <AccordionContent className="pt-1 pb-1.5 space-y-1 px-2">
              {['A', 'B', 'C', 'D'].map(sec => (
                <div key={sec} className="flex items-center space-x-2 p-1 rounded-md hover:bg-sidebar-accent/70">
                  <Checkbox
                    id={`sec-${sec}`}
                    checked={filters.sections.includes(sec)}
                    onCheckedChange={(checked) => handleSectionChange(sec, !!checked)}
                    className="border-sidebar-primary data-[state=checked]:bg-sidebar-primary data-[state=checked]:text-sidebar-primary-foreground"
                  />
                  <Label htmlFor={`sec-${sec}`} className="text-xs font-normal cursor-pointer flex-grow">
                    Section {sec}
                  </Label>
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
                  disabled={subjectsDB.length === 0}
                />
              </div>
               <p className="text-xs text-muted-foreground/80 px-1">
                Toggle to color events by subject. Default is by category. {subjectsDB.length === 0 && " (Disabled as no subjects are configured.)"}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ScrollArea>
      <Separator className="my-1.5 bg-sidebar-border"/>
      <div className="text-xs text-center text-muted-foreground/70 pb-2">
        Jnanodaya school v1.0
      </div>
    </div>
  );
}
