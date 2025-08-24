
"use client";

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Tag, Layers, Clock, MapPin, User as UserIcon, Info, BookOpen, ChevronsUpDown, ListFilter, Bookmark } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";
const NO_CATEGORY_VALUE = "__NONE_CATEGORY__";
const NO_SEMESTER_VALUE = "__NONE_SEMESTER__";
const NO_SECTION_VALUE = "__NONE_SECTION__";

const eventFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  category: z.string().min(1, { message: "Category is required."}),
  subType: z.string().optional(),
  subjectId: z.string().optional(),
  semester: z.string().optional(),
  section: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  startHour: z.string({ required_error: "Hour is required." }),
  startMinute: z.string({ required_error: "Minute is required." }),
  startPeriod: z.enum(['AM', 'PM'], { required_error: "AM/PM is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  endHour: z.string({ required_error: "Hour is required." }),
  endMinute: z.string({ required_error: "Minute is required." }),
  endPeriod: z.enum(['AM', 'PM'], { required_error: "AM/PM is required." }),
  location: z.string().optional(),
  faculty: z.string().optional(),
  description: z.string().optional(),
}).refine(data => {
  if (!data.startDate || !data.endDate) return true; // Defer to individual field validation.

  const startDateTime = new Date(data.startDate);
  let startHour24 = parseInt(data.startHour, 10);
  if (data.startPeriod === 'PM' && startHour24 < 12) startHour24 += 12;
  if (data.startPeriod === 'AM' && startHour24 === 12) startHour24 = 0; // Midnight case
  startDateTime.setHours(startHour24, parseInt(data.startMinute, 10));

  const endDateTime = new Date(data.endDate);
  let endHour24 = parseInt(data.endHour, 10);
  if (data.endPeriod === 'PM' && endHour24 < 12) endHour24 += 12;
  if (data.endPeriod === 'AM' && endHour24 === 12) endHour24 = 0; // Midnight case
  endDateTime.setHours(endHour24, parseInt(data.endMinute, 10));

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
  categoriesFromDB: EventCategory[];
  departmentId: string;
}

const hoursArray = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periodsArray: ('AM' | 'PM')[] = ['AM', 'PM'];

export default function AddEventDialog({ isOpen, onClose, onAddEvent, subjectsFromDB, categoriesFromDB, departmentId }: AddEventDialogProps) {
  const { toast } = useToast();
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      category: NO_CATEGORY_VALUE,
      startHour: "9",
      startMinute: "00",
      startPeriod: 'AM',
      endHour: "10",
      endMinute: "00",
      endPeriod: 'AM',
      location: "",
      faculty: "",
      description: "",
      subType: "",
      subjectId: NO_SUBJECT_VALUE,
      semester: NO_SEMESTER_VALUE,
      section: NO_SECTION_VALUE,
    },
  });

  const selectedCategoryName = form.watch("category");
  const [availableSubTypes, setAvailableSubTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (selectedCategoryName && selectedCategoryName !== NO_CATEGORY_VALUE) {
      const categoryDetails = categoriesFromDB.find(c => c.name === selectedCategoryName);
      setAvailableSubTypes(categoryDetails?.subTypes || []);
      form.setValue("subType", "");
    } else {
      setAvailableSubTypes([]);
    }
  }, [selectedCategoryName, categoriesFromDB, form]);

  function onSubmit(data: EventFormData) {
    if (data.category === NO_CATEGORY_VALUE) {
        toast({ variant: "destructive", title: "Validation Error", description: "Please select an event category."});
        return;
    }
    if (!departmentId) {
        toast({ variant: "destructive", title: "System Error", description: "Department ID is missing."});
        return;
    }
    const startDateTime = new Date(data.startDate);
    let startHour24 = parseInt(data.startHour, 10);
    if (data.startPeriod === 'PM' && startHour24 < 12) startHour24 += 12;
    if (data.startPeriod === 'AM' && startHour24 === 12) startHour24 = 0;
    startDateTime.setHours(startHour24, parseInt(data.startMinute, 10));

    const endDateTime = new Date(data.endDate);
    let endHour24 = parseInt(data.endHour, 10);
    if (data.endPeriod === 'PM' && endHour24 < 12) endHour24 += 12;
    if (data.endPeriod === 'AM' && endHour24 === 12) endHour24 = 0;
    endDateTime.setHours(endHour24, parseInt(data.endMinute, 10));

    const newEvent: Omit<AcademicEvent, 'id'> = {
      title: data.title,
      departmentId: departmentId,
      category: data.category,
      subType: data.subType || undefined,
      subjectId: data.subjectId === NO_SUBJECT_VALUE || !data.subjectId ? undefined : data.subjectId,
      semester: data.semester && data.semester !== NO_SEMESTER_VALUE ? parseInt(data.semester, 10) : undefined,
      section: data.section === NO_SECTION_VALUE || !data.section ? undefined : data.section,
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
        semester: NO_SEMESTER_VALUE,
        section: NO_SECTION_VALUE,
        startDate: undefined,
        startHour: '9',
        startMinute: '00',
        startPeriod: 'AM',
        endDate: undefined,
        endHour: '10',
        endMinute: '00',
        endPeriod: 'AM',
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
            title: "", category: NO_CATEGORY_VALUE, subType: "", subjectId: NO_SUBJECT_VALUE, semester: NO_SEMESTER_VALUE, section: NO_SECTION_VALUE,
            startDate: undefined, startHour: '9', startMinute: '00', startPeriod: 'AM',
            endDate: undefined, endHour: '10', endMinute: '00', endPeriod: 'AM',
            location: "", faculty: "", description: ""
        });
      }
      onClose();
    }}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary">Add New Event</DialogTitle>
          <DialogDescription>Fill in the details below to add a new event to the calendar.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 -mr-6 pr-6">
                <div className="space-y-6 py-4 pr-1">
                  
                  {/* --- CORE DETAILS --- */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Core Details</h4>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
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
                      </div>
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
                  </div>

                  <Separator />
                  
                  {/* --- DATE & TIME --- */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
                     <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Start Date / Time */}
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Date</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn( "w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground" )}
                                        >
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-3 gap-2">
                                <FormField control={form.control} name="startHour" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Hour</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{hoursArray.map(h => <SelectItem key={`start-h-${h}`} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="startMinute" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Minute</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{minutesArray.map(m => <SelectItem key={`start-m-${m}`} value={m}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="startPeriod" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Period</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{periodsArray.map(p => <SelectItem key={`start-p-${p}`} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </div>

                        {/* End Date / Time */}
                        <div className="space-y-2">
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>End Date</FormLabel>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant="outline"
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground" )}
                                        >
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => form.getValues("startDate") ? date < form.getValues("startDate") : false} initialFocus />
                                    </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <div className="grid grid-cols-3 gap-2">
                                <FormField control={form.control} name="endHour" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Hour</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{hoursArray.map(h => <SelectItem key={`end-h-${h}`} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="endMinute" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Minute</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{minutesArray.map(m => <SelectItem key={`end-m-${m}`} value={m}>{m}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name="endPeriod" render={({ field }) => (
                                    <FormItem><FormLabel className="text-xs">Period</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{periodsArray.map(p => <SelectItem key={`end-p-${p}`} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
                                )}/>
                            </div>
                        </div>
                    </div>
                  </div>
                  
                  <Separator />

                  {/* --- ACADEMIC CONTEXT --- */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Academic Context (Optional)</h4>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="subjectId"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel><BookOpen className="inline w-4 h-4 mr-1" />Subject</FormLabel>
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
                            <FormLabel><ListFilter className="inline w-4 h-4 mr-1" />Sem/Trimester</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || NO_SEMESTER_VALUE} defaultValue={field.value || NO_SEMESTER_VALUE}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a semester" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={NO_SEMESTER_VALUE}>None</SelectItem>
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                        <SelectItem key={sem} value={String(sem)}>Sem/Trimester {sem}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel><Bookmark className="inline w-4 h-4 mr-1" />Section</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || NO_SECTION_VALUE} defaultValue={field.value || NO_SECTION_VALUE}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={NO_SECTION_VALUE}>None</SelectItem>
                                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(sec => (
                                        <SelectItem key={sec} value={String(sec)}>Section {sec}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* --- ADDITIONAL INFO --- */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Additional Information (Optional)</h4>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                       <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel><MapPin className="inline w-4 h-4 mr-1" />Location</FormLabel>
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
                              <FormLabel><UserIcon className="inline w-4 h-4 mr-1" />Faculty/Host</FormLabel>
                              <FormControl>
                              <Input placeholder="e.g., Prof. John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><Info className="inline w-4 h-4 mr-1" />Description</FormLabel>
                              <FormControl>
                                  <Textarea placeholder="Provide additional details about the event..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
            </ScrollArea>
            <DialogFooter className="pt-4 flex-shrink-0 border-t mt-4">
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

