
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Tag, Layers, Clock, MapPin, User as UserIcon, Info, BookOpen, ChevronsUpDown, ListFilter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
// import { eventCategories as staticEventCategories } from '@/data/mock-data'; // Replaced
import { cn } from '@/lib/utils';

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";
const NO_CATEGORY_VALUE = "__NONE_CATEGORY__";

// Zod schema now expects category as a string (name)
const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  category: z.string().min(1, { message: "Category is required."}), // Category name
  subType: z.string().optional(),
  subjectId: z.string().optional(),
  semester: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  endDate: z.date({ required_error: "End date is required." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }), // Corrected regex
  location: z.string().optional(),
  faculty: z.string().optional(),
  description: z.string().optional(),
}).refine(data => {
  const startDateTime = new Date(data.startDate);
  const [startHours, startMinutes] = data.startTime.split(':').map(Number);
  startDateTime.setHours(startHours, startMinutes);

  const endDateTime = new Date(data.endDate);
  const [endHours, endMinutes] = data.endTime.split(':').map(Number);
  endDateTime.setHours(endHours, endMinutes);

  return endDateTime >= startDateTime;
}, {
  message: "End date/time must be after start date/time.",
  path: ["endDate"],
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<AcademicEvent, 'id'>) => void;
  subjectsFromDB: Subject[];
  categoriesFromDB: EventCategory[]; // Pass categories from Firestore
}

export default function AddEventDialog({ isOpen, onClose, onAddEvent, subjectsFromDB, categoriesFromDB }: AddEventDialogProps) {
  const { toast } = useToast();
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      category: NO_CATEGORY_VALUE,
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      faculty: "",
      description: "",
      subType: "",
      subjectId: NO_SUBJECT_VALUE,
      semester: "",
    },
  });

  const selectedCategoryName = form.watch("category"); // This is the category name
  const [availableSubTypes, setAvailableSubTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (selectedCategoryName && selectedCategoryName !== NO_CATEGORY_VALUE) {
      const categoryDetails = categoriesFromDB.find(c => c.name === selectedCategoryName);
      setAvailableSubTypes(categoryDetails?.subTypes || []);
      form.setValue("subType", ""); // Reset subType when category changes
    } else {
      setAvailableSubTypes([]);
    }
  }, [selectedCategoryName, categoriesFromDB, form]);

  function onSubmit(data: EventFormData) {
    if (data.category === NO_CATEGORY_VALUE) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please select an event category."});
        return;
    }
    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes);

    const newEvent: Omit<AcademicEvent, 'id'> = {
      title: data.title,
      category: data.category, // Category name
      subType: data.subType || undefined,
      subjectId: data.subjectId === NO_SUBJECT_VALUE || !data.subjectId ? undefined : data.subjectId,
      semester: data.semester ? parseInt(data.semester, 10) : undefined,
      start: startDateTime,
      end: endDateTime,
      location: data.location,
      faculty: data.faculty,
      description: data.description,
    };
    onAddEvent(newEvent);
    toast({
      title: "Event Added",
      description: `${data.title} has been successfully added to the calendar.`,
    });
    form.reset({ 
        title: "",
        category: NO_CATEGORY_VALUE,
        subType: "",
        subjectId: NO_SUBJECT_VALUE,
        semester: "",
        startDate: undefined,
        startTime: "09:00",
        endDate: undefined,
        endTime: "10:00",
        location: "",
        faculty: "",
        description: ""
    });
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset({
            title: "", category: NO_CATEGORY_VALUE, subType: "", subjectId: NO_SUBJECT_VALUE, semester: "",
            startDate: undefined, startTime: "09:00", endDate: undefined, endTime: "10:00",
            location: "", faculty: "", description: ""
        });
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary">Add New Event</DialogTitle>
          <DialogDescription>Fill in the details below to add a new event to the calendar.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[60vh] pr-4 py-4">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Midterm Exams" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><Layers className="inline w-4 h-4 mr-1" />Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || NO_CATEGORY_VALUE} defaultValue={field.value || NO_CATEGORY_VALUE}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={NO_CATEGORY_VALUE} disabled={categoriesFromDB.length > 0}>Select a category</SelectItem>
                            {categoriesFromDB.map(category => (
                              <SelectItem key={category.id} value={category.name}>
                                <span className="flex items-center">
                                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                                  {category.name}
                                </span>
                              </SelectItem>
                            ))}
                            {categoriesFromDB.length === 0 && <SelectItem value="no-cats-db" disabled>No categories configured</SelectItem>}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subType"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel><ChevronsUpDown className="inline w-4 h-4 mr-1 opacity-70" />Sub-Type</FormLabel>
                        <Select 
                            onValueChange={field.onChange} 
                            value={field.value || ""} 
                            defaultValue={field.value || ""}
                            disabled={availableSubTypes.length === 0 || selectedCategoryName === NO_CATEGORY_VALUE}
                        >
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a sub-type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {availableSubTypes.map(subType => (
                            <SelectItem key={subType} value={subType}>
                                {subType}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        { (selectedCategoryName && selectedCategoryName !== NO_CATEGORY_VALUE && availableSubTypes.length === 0) && <FormDescription className="text-xs">No sub-types for selected category.</FormDescription>}
                        {(!selectedCategoryName || selectedCategoryName === NO_CATEGORY_VALUE) && <FormDescription className="text-xs">Select a category first.</FormDescription>}
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
                
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><BookOpen className="inline w-4 h-4 mr-1" />Subject (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || NO_SUBJECT_VALUE} defaultValue={field.value || NO_SUBJECT_VALUE}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_SUBJECT_VALUE}>None</SelectItem>
                          {subjectsFromDB.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                               <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.color }} />
                                {subject.name}
                               </span>
                            </SelectItem>
                          ))}
                          {subjectsFromDB.length === 0 && <SelectItem value="no-subjects" disabled>No subjects configured</SelectItem>}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      {subjectsFromDB.length === 0 && <FormDescription className="text-xs">No subjects found. Add them via admin panel.</FormDescription>}
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="semester"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel><ListFilter className="inline w-4 h-4 mr-1" />Semester/Trimester (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a semester" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="">None</SelectItem>
                                {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                    <SelectItem key={sem} value={String(sem)}>{sem}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel><CalendarIcon className="inline w-4 h-4 mr-1" />Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><Clock className="inline w-4 h-4 mr-1" />Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel><CalendarIcon className="inline w-4 h-4 mr-1" />End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                form.getValues("startDate") ? date < form.getValues("startDate") : false
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel><Clock className="inline w-4 h-4 mr-1" />End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><MapPin className="inline w-4 h-4 mr-1" />Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Main Auditorium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="faculty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><UserIcon className="inline w-4 h-4 mr-1" />Faculty/Host (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Prof. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><Info className="inline w-4 h-4 mr-1" />Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide additional details about the event..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <DialogFooter className="pt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Adding..." : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
