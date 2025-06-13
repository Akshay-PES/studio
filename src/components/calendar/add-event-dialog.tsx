
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format, parse } from 'date-fns';
import { CalendarIcon, Tag, Layers, Clock, MapPin, User as UserIcon, Info, BookOpen } from 'lucide-react'; // Renamed User to UserIcon to avoid conflict

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
import { Label } from '@/components/ui/label';
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
import type { AcademicEvent, EventCategoryName } from '@/lib/types';
import { validCategoryNames } from '@/lib/types';
import { eventCategories, subjects } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__"; // Unique value for "None" option

const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  category: z.enum(validCategoryNames, { required_error: "Category is required." }),
  subType: z.string().optional(),
  subjectId: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
  endDate: z.date({ required_error: "End date is required." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Invalid time format (HH:MM)." }),
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
  path: ["endDate"], // You can also use "endTime" or a more general path if needed
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface AddEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddEvent: (event: Omit<AcademicEvent, 'id'>) => void;
}

export default function AddEventDialog({ isOpen, onClose, onAddEvent }: AddEventDialogProps) {
  const { toast } = useToast();
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      faculty: "",
      description: "",
      subType: "",
      subjectId: "", // Remains empty string for placeholder to show initially
    },
  });

  const selectedCategoryName = form.watch("category");
  const [availableSubTypes, setAvailableSubTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (selectedCategoryName) {
      const category = eventCategories.find(c => c.name === selectedCategoryName);
      setAvailableSubTypes(category?.subTypes || []);
      form.setValue("subType", ""); // Reset subType when category changes
    } else {
      setAvailableSubTypes([]);
    }
  }, [selectedCategoryName, form]);

  function onSubmit(data: EventFormData) {
    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes);

    const newEvent: Omit<AcademicEvent, 'id'> = {
      title: data.title,
      category: data.category,
      subType: data.subType || undefined, // Treat empty string as undefined if preferred
      subjectId: data.subjectId === NO_SUBJECT_VALUE ? undefined : data.subjectId,
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
    form.reset();
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        form.reset(); // Reset form when dialog is closed
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {eventCategories.map(category => (
                              <SelectItem key={category.id} value={category.name}>
                                <span className="flex items-center">
                                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                                  {category.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {availableSubTypes.length > 0 && (
                     <FormField
                        control={form.control}
                        name="subType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel><Layers className="inline w-4 h-4 mr-1 opacity-70" />Sub-Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
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
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel><BookOpen className="inline w-4 h-4 mr-1" />Subject (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={NO_SUBJECT_VALUE}>None</SelectItem>
                          {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                               <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.color }} />
                                {subject.name}
                               </span>
                            </SelectItem>
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

