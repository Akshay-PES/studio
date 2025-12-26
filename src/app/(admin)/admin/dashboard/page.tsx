
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, deleteDoc, doc, updateDoc, DocumentData, QueryDocumentSnapshot, writeBatch, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { AcademicEvent, Subject, EventCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import AddEventDialog from '@/components/calendar/add-event-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, PlusCircle, BookOpen, Layers, ListFilter, CalendarIcon, Download, FileDown, ChevronDown, Search } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface EditEventFormData {
  title: string;
  category: string;
  location?: string;
  description?: string;
  subjectId?: string;
  subType?: string;
  semester?: string;
  section?: string;
  startDate?: Date;
  startHour: string;
  startMinute: string;
  startPeriod: 'AM' | 'PM';
  endDate?: Date;
  endHour: string;
  endMinute: string;
  endPeriod: 'AM' | 'PM';
}

interface AddSubjectFormData {
  name: string;
}

interface EditSubjectFormData {
  name: string;
  color: string;
}

interface AddCategoryFormData {
  name: string;
  subTypesString: string;
}

interface EditCategoryFormData {
  id: string;
  name: string;
  color: string;
  subTypesString: string;
  originalName?: string;
}

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";
const NO_CATEGORY_VALUE = "__NONE_CATEGORY__";
const NO_SEMESTER_VALUE = "__NONE_SEMESTER__";
const NO_SECTION_VALUE = "__NONE_SECTION__";
const DEFAULT_EVENT_CATEGORY_ON_DELETE = "Others";
const ALL_CATEGORIES = "__ALL_CATEGORIES__";
const ALL_SUBJECTS = "__ALL_SUBJECTS__";

const ALL_DEPARTMENTS = "__ALL_DEPARTMENTS__";


const PREDEFINED_SUBJECT_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF',
  '#33FFA1', '#FF8C00', '#00CED1', '#FFD700', '#ADFF2F',
  '#BA55D3', '#20B2AA', '#FF69B4', '#7B68EE', '#66CDAA',
  '#E57373', '#81C784', '#64B5F6', '#F06292', '#CE93D8',
  '#4DB6AC', '#FFB74D', '#7986CB', '#AED581', '#F48FB1'
];
const FALLBACK_SUBJECT_COLOR = '#A0A0A0';

const PREDEFINED_CATEGORY_COLORS = [
  '#EF9A9A', '#F48FB1', '#CE93D8', '#B39DDB', '#9FA8DA', '#90CAF9',
  '#81D4FA', '#80DEEA', '#80CBC4', '#A5D6A7', '#C5E1A5', '#E6EE9C',
  '#FFF59D', '#FFE082', '#FFCC80', '#FFAB91', '#BCAAA4', '#EEEEEE',
  '#B0BEC5', '#F06292', '#BA68C8', '#9575CD', '#7986CB', '#64B5F6'
];
const FALLBACK_CATEGORY_COLOR = '#BDBDBD';

const hoursArray = Array.from({ length: 12 }, (_, i) => String(i + 1));
const minutesArray = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const periodsArray: ('AM' | 'PM')[] = ['AM', 'PM'];

const departmentOptions = [
    { name: "1st Standard", id: "std-1" }, { name: "2nd Standard", id: "std-2" },
    { name: "3rd Standard", id: "std-3" }, { name: "4th Standard", id: "std-4" },
    { name: "5th Standard", id: "std-5" }, { name: "6th Standard", id: "std-6" },
    { name: "7th Standard", id: "std-7" }, { name: "8th Standard", id: "std-8" },
    { name: "9th Standard", id: "std-9" }, { name: "10th Standard", id: "std-10" },
];

export default function AdminDashboardPage() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [subjectsDB, setSubjectsDB] = useState<Subject[]>([]);
  const [eventCategoriesDB, setEventCategoriesDB] = useState<EventCategory[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [currentEventToEdit, setCurrentEventToEdit] = useState<AcademicEvent | null>(null);
  const [editEventFormData, setEditEventFormData] = useState<EditEventFormData>({
    title: '', category: '',
    startHour: '09', startMinute: '00', startPeriod: 'AM',
    endHour: '10', endMinute: '00', endPeriod: 'AM'
  });

  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);
  const [addSubjectFormData, setAddSubjectFormData] = useState<AddSubjectFormData>({ name: ''});
  const [editSubjectFormData, setEditSubjectFormData] = useState<EditSubjectFormData>({ name: '', color: '#808080' });

  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [currentCategoryToEdit, setCurrentCategoryToEdit] = useState<EventCategory | null>(null);
  const [addCategoryFormData, setAddCategoryFormData] = useState<AddCategoryFormData>({ name: '', subTypesString: '' });
  const [editCategoryFormData, setEditCategoryFormData] = useState<EditCategoryFormData>({ id: '', name: '', color: '#808080', subTypesString: '' });

  // Filters for Manage Events tab
  const [eventFilterDepartment, setEventFilterDepartment] = useState<string>(ALL_DEPARTMENTS);
  const [eventFilterCategory, setEventFilterCategory] = useState<string>(ALL_CATEGORIES);
  const [eventFilterSubject, setEventFilterSubject] = useState<string>(ALL_SUBJECTS);
  

  // Filters for the report generation tab
  const [reportFilterCategory, setReportFilterCategory] = useState<string>(ALL_CATEGORIES);
  const [reportFilterSubTypes, setReportFilterSubTypes] = useState<string[]>([]);
  const [reportFilterStartDate, setReportFilterStartDate] = useState<Date | undefined>();
  const [reportFilterEndDate, setReportFilterEndDate] = useState<Date | undefined>();


  const { toast } = useToast();

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const departmentId = isSuperAdmin ? undefined : userProfile?.departmentId;

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const eventsCollectionRef = collection(db, "events");
      const q = departmentId ? query(eventsCollectionRef, where("departmentId", "==", departmentId)) : query(eventsCollectionRef);
      const querySnapshot = await getDocs(q);

      const invalidEventTitles: string[] = [];
      const fetchedEvents = querySnapshot.docs
        .map((doc: QueryDocumentSnapshot<DocumentData>) => {
          const data = doc.data();
          if (!(data.start instanceof Timestamp) || !(data.end instanceof Timestamp)) {
            console.warn(`Skipping malformed event (ID: ${doc.id}). Missing or invalid start/end timestamp.`);
            invalidEventTitles.push(data.title || doc.id);
            return null;
          }
          return {
            id: doc.id,
            title: data.title,
            category: data.category,
            start: data.start.toDate(),
            end: data.end.toDate(),
            departmentId: data.departmentId,
            ...(data.subType && { subType: data.subType }),
            ...(data.subjectId && { subjectId: data.subjectId }),
            ...(data.semester && { semester: data.semester }),
            ...(data.section && { section: data.section }),
            ...(data.location && { location: data.location }),
            ...(data.faculty && { faculty: data.faculty }),
            ...(data.description && { description: data.description }),
            ...(data.attendees && { attendees: data.attendees }),
          };
        })
        .filter((event): event is AcademicEvent => event !== null);
      
      if (invalidEventTitles.length > 0) {
        toast({
          variant: "destructive",
          title: "Data Warning",
          description: `Skipped ${invalidEventTitles.length} event(s) with invalid dates. Please edit and save them to fix.`,
        });
      }

      const sortedEvents = fetchedEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
      setEvents(sortedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ variant: "destructive", title: "Error Fetching Events", description: `Could not load events. ${(error as Error).message}` });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [toast, departmentId]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
        const subjectsCollectionRef = collection(db, "subjects");
        const q = query(subjectsCollectionRef, orderBy("name"));
        const querySnapshot = await getDocs(q);

        const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return { id: doc.id, name: data.name, color: data.color };
        });
        setSubjectsDB(fetchedSubjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({ variant: "destructive", title: "Error Fetching Subjects", description: `Could not load subjects. ${(error as Error).message}` });
    } finally {
        setIsLoadingSubjects(false);
    }
  }, [toast]);

  const fetchEventCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const categoriesCollectionRef = collection(db, "eventCategories");
      const q = query(categoriesCollectionRef);
      const querySnapshot = await getDocs(q);
      const fetchedCategories: EventCategory[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        const uniqueSubTypes = data.subTypes ? [...new Set(data.subTypes.filter((st: any) => typeof st === 'string' && st.trim() !== ''))] as string[] : [];
        return { id: doc.id, name: data.name, color: data.color, subTypes: uniqueSubTypes };
      });
      const sortedCategories = fetchedCategories.sort((a,b) => a.name.localeCompare(b.name));
      setEventCategoriesDB(sortedCategories);
    } catch (error) {
      console.error("Error fetching event categories:", error);
      toast({ variant: "destructive", title: "Error Fetching Categories", description: `Could not load categories. ${(error as Error).message}` });
    } finally {
      setIsLoadingCategories(false);
    }
  }, [toast]);


  useEffect(() => {
    fetchEvents();
    fetchSubjects();
    fetchEventCategories();
  }, [userProfile, fetchEvents, fetchSubjects, fetchEventCategories]);

  const handleAddEvent = async (newEventData: Omit<AcademicEvent, 'id'>) => {
    const finalDepartmentId = isSuperAdmin ? newEventData.departmentId : departmentId;
    if (!finalDepartmentId || finalDepartmentId === NO_DEPARTMENT_VALUE) {
        toast({ variant: "destructive", title: "System Error", description: "Department ID is missing." });
        return;
    }
    
    try {
      const eventDataForFirestore = {
        ...newEventData,
        departmentId: finalDepartmentId,
        start: Timestamp.fromDate(newEventData.start),
        end: Timestamp.fromDate(newEventData.end),
        subjectId: newEventData.subjectId || null,
        semester: newEventData.semester || null,
        section: newEventData.section || null,
        category: newEventData.category || DEFAULT_EVENT_CATEGORY_ON_DELETE,
        subType: newEventData.subType || null,
      };
      await addDoc(collection(db, "events"), eventDataForFirestore);
      toast({ title: "Event Added Successfully" });
      fetchEvents();
      setShowAddEventDialog(false);
    } catch (error) {
      console.error("Error adding event:", error);
      toast({ variant: "destructive", title: "Error Adding Event", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast({ title: "Event Deleted Successfully" });
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ variant: "destructive", title: "Error Deleting Event", description: `Details: ${(error as Error)?.message}`});
    }
  };

  const openEditEventDialog = (event: AcademicEvent) => {
    setCurrentEventToEdit(event);
    
    const getFormattedTime = (date: Date) => {
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      return {
        hour: String(hours),
        minute: String(minutes).padStart(2, '0'),
        period: period as 'AM' | 'PM',
      };
    };

    const startTime = getFormattedTime(event.start);
    const endTime = getFormattedTime(event.end);

    setEditEventFormData({
        title: event.title,
        category: event.category,
        startDate: event.start,
        startHour: startTime.hour,
        startMinute: startTime.minute,
        startPeriod: startTime.period,
        endDate: event.end,
        endHour: endTime.hour,
        endMinute: endTime.minute,
        endPeriod: endTime.period,
        location: event.location || '',
        description: event.description || '',
        subjectId: event.subjectId || '',
        subType: event.subType || '',
        semester: event.semester ? String(event.semester) : NO_SEMESTER_VALUE,
        section: event.section || NO_SECTION_VALUE,
    });
    setShowEditEventDialog(true);
  };

  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditEventFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleEditEventSelectChange = (name: string, value: string | Date | undefined) => {
    setEditEventFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditEventCategoryChange = (newCategoryName: string) => {
    setEditEventFormData(prev => ({ ...prev, category: newCategoryName, subType: '' }));
  };

  const handleEditEventSubjectChange = (newSubjectId: string) => {
    setEditEventFormData(prev => ({ ...prev, subjectId: newSubjectId === NO_SUBJECT_VALUE ? '' : newSubjectId }));
  };

  const handleEditEventSubTypeChange = (newSubType: string) => {
    setEditEventFormData(prev => ({ ...prev, subType: newSubType }));
  };

  const handleEditEventSemesterChange = (newSemester: string) => {
    setEditEventFormData(prev => ({ ...prev, semester: newSemester }));
  };
  
  const handleEditEventSectionChange = (newSection: string) => {
    setEditEventFormData(prev => ({ ...prev, section: newSection }));
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventToEdit || !editEventFormData.startDate || !editEventFormData.endDate) return;

    const constructDate = (date: Date, hourStr: string, minuteStr: string, period: 'AM' | 'PM'): Date => {
      const newDate = new Date(date);
      let hour = parseInt(hourStr, 10);
      if (period === 'PM' && hour < 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0; // Midnight
      newDate.setHours(hour, parseInt(minuteStr, 10), 0, 0); // Also reset seconds and ms
      return newDate;
    };
    
    try {
        const startDateTime = constructDate(editEventFormData.startDate, editEventFormData.startHour, editEventFormData.startMinute, editEventFormData.startPeriod);
        const endDateTime = constructDate(editEventFormData.endDate, editEventFormData.endHour, editEventFormData.endMinute, editEventFormData.endPeriod);

        if(endDateTime < startDateTime) {
            toast({ variant: "destructive", title: "Validation Error", description: "End date/time must be after start date/time." });
            return;
        }

        const updatedEventData = {
            title: editEventFormData.title,
            category: editEventFormData.category,
            subType: editEventFormData.subType || null,
            start: Timestamp.fromDate(startDateTime),
            end: Timestamp.fromDate(endDateTime),
            location: editEventFormData.location,
            description: editEventFormData.description,
            subjectId: editEventFormData.subjectId || null,
            semester: editEventFormData.semester && editEventFormData.semester !== NO_SEMESTER_VALUE ? parseInt(editEventFormData.semester, 10) : null,
            section: editEventFormData.section && editEventFormData.section !== NO_SECTION_VALUE ? editEventFormData.section : null,
            departmentId: currentEventToEdit.departmentId, 
        };
        await updateDoc(doc(db, "events", currentEventToEdit.id), updatedEventData as { [x: string]: any });
        toast({ title: "Event Updated Successfully" });
        fetchEvents();
        setShowEditEventDialog(false);
        setCurrentEventToEdit(null);
    } catch (error) {
        console.error("Error updating event:", error);
        toast({ variant: "destructive", title: "Error Updating Event", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleAddSubjectToDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSubjectFormData.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject name is required." });
      return;
    }

    const usedColors = new Set(subjectsDB.map(s => s.color));
    let assignedColor = PREDEFINED_SUBJECT_COLORS.find(c => !usedColors.has(c));

    if (!assignedColor) {
        assignedColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    }
    
    try {
      await addDoc(collection(db, "subjects"), {
        name: addSubjectFormData.name,
        color: assignedColor,
      });
      toast({ title: "Subject Added Successfully", description: `Assigned color: ${assignedColor}` });
      fetchSubjects();
      setShowAddSubjectDialog(false);
      setAddSubjectFormData({ name: ''});
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({ variant: "destructive", title: "Error Adding Subject", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const openEditSubjectDialog = (subject: Subject) => {
    setCurrentSubjectToEdit(subject);
    setEditSubjectFormData({
      name: subject.name,
      color: subject.color,
    });
    setShowEditSubjectDialog(true);
  };

  const handleEditSubjectFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditSubjectFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubjectInDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubjectToEdit || !editSubjectFormData.name.trim() || !editSubjectFormData.color.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject name and color are required." });
      return;
    }
    try {
      await updateDoc(doc(db, "subjects", currentSubjectToEdit.id), {
        name: editSubjectFormData.name,
        color: editSubjectFormData.color,
      });
      toast({ title: "Subject Updated Successfully" });
      fetchSubjects();
      setShowEditSubjectDialog(false);
      setCurrentSubjectToEdit(null);
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({ variant: "destructive", title: "Error Updating Subject", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleDeleteSubjectFromDB = async (subject: Subject) => {
    if (!window.confirm(`Are you sure you want to delete the subject "${subject.name}"? This will also remove its association from ALL events.`)) return;
    
    try {
        const batch = writeBatch(db);
        
        // Delete the subject document
        const subjectDocRef = doc(db, "subjects", subject.id);
        batch.delete(subjectDocRef);
        
        // Query for events that have this subjectId and unset it
        const eventsQuery = query(collection(db, "events"), where("subjectId", "==", subject.id));
        const eventSnapshots = await getDocs(eventsQuery);

        eventSnapshots.forEach(eventDoc => {
            const eventDocRef = doc(db, "events", eventDoc.id);
            batch.update(eventDocRef, { subjectId: null });
        });

        await batch.commit();
        toast({ title: "Subject Deleted Successfully" });
        fetchSubjects();
        fetchEvents();
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({ variant: "destructive", title: "Error Deleting Subject", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleAddEventCategoryToDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addCategoryFormData.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Category name is required." });
      return;
    }
    if (eventCategoriesDB.some(cat => cat.name.toLowerCase() === addCategoryFormData.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Validation Error", description: "A category with this name already exists." });
        return;
    }

    const usedColors = new Set(eventCategoriesDB.map(c => c.color));
    let assignedColor = FALLBACK_CATEGORY_COLOR;
    for (const color of PREDEFINED_CATEGORY_COLORS) {
        if (!usedColors.has(color)) {
            assignedColor = color;
            break;
        }
    }

    const subTypesArray = [...new Set(addCategoryFormData.subTypesString.split(',').map(st => st.trim()).filter(st => st))];
    try {
      await addDoc(collection(db, "eventCategories"), {
        name: addCategoryFormData.name.trim(),
        color: assignedColor,
        subTypes: subTypesArray,
      });
      toast({ title: "Category Added Successfully", description: `Assigned color: ${assignedColor}` });
      fetchEventCategories();
      setShowAddCategoryDialog(false);
      setAddCategoryFormData({ name: '', subTypesString: '' });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ variant: "destructive", title: "Error Adding Category", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const openEditCategoryDialog = (category: EventCategory) => {
    setCurrentCategoryToEdit(category);
    setEditCategoryFormData({
      id: category.id,
      name: category.name,
      originalName: category.name,
      color: category.color,
      subTypesString: [...new Set(category.subTypes || [])].join(', '),
    });
    setShowEditCategoryDialog(true);
  };

  const handleEditCategoryFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditCategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateEventCategoryInDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCategoryToEdit || !editCategoryFormData.name.trim() || !editCategoryFormData.color.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Category name and color are required." });
      return;
    }

    const newName = editCategoryFormData.name.trim();
    const originalName = editCategoryFormData.originalName;

    if (newName.toLowerCase() !== originalName?.toLowerCase() &&
        eventCategoriesDB.some(cat => cat.id !== currentCategoryToEdit.id && cat.name.toLowerCase() === newName.toLowerCase())) {
        toast({ variant: "destructive", title: "Validation Error", description: "Another category with this name already exists." });
        return;
    }

    const subTypesArray = [...new Set(editCategoryFormData.subTypesString.split(',').map(st => st.trim()).filter(st => st))];
    const batch = writeBatch(db);
    const categoryDocRef = doc(db, "eventCategories", currentCategoryToEdit.id);

    batch.update(categoryDocRef, {
      name: newName,
      color: editCategoryFormData.color.trim(),
      subTypes: subTypesArray,
    });

    let eventsUpdatedCount = 0;
    if (originalName && newName !== originalName) {
      const eventsQuery = query(collection(db, "events"), where("category", "==", originalName));
      try {
        const eventSnapshots = await getDocs(eventsQuery);
        eventSnapshots.forEach(eventDoc => {
          const eventDocRef = doc(db, "events", eventDoc.id);
          batch.update(eventDocRef, { category: newName });
          eventsUpdatedCount++;
        });
      } catch (queryError) {
        console.error("Error querying events for category update:", queryError);
        toast({ variant: "destructive", title: "Error Updating Events", description: `Could not find events to update category name. ${(queryError as Error).message}` });
        return;
      }
    }

    try {
      await batch.commit();
      let successMessage = "Category Updated Successfully";
      if (eventsUpdatedCount > 0) {
        successMessage += ` and ${eventsUpdatedCount} event(s) were updated globally with the new category name.`;
      }
      toast({ title: successMessage });

      fetchEventCategories();
      if (originalName && newName !== originalName) {
         fetchEvents(); 
      }
      setShowEditCategoryDialog(false);
      setCurrentCategoryToEdit(null);
    } catch (error) {
      console.error("Error updating category and/or associated events:", error);
      toast({ variant: "destructive", title: "Error Updating Category", description: `Details: ${(error as Error)?.message}` });
    }
  };


  const handleDeleteEventCategoryFromDB = async (category: EventCategory) => {
    if (!window.confirm(`Are you sure you want to delete the GLOBAL category "${category.name}"? Events in ALL departments using this category will be reassigned to "${DEFAULT_EVENT_CATEGORY_ON_DELETE}".`)) {
      return;
    }
    try {
      const batch = writeBatch(db);
      const categoryDocRef = doc(db, "eventCategories", category.id);
      batch.delete(categoryDocRef);

      const eventsQuery = query(collection(db, "events"), where("category", "==", category.name));
      const eventSnapshots = await getDocs(eventsQuery);
      eventSnapshots.forEach(eventDoc => {
        const eventDocRef = doc(db, "events", eventDoc.id);
        batch.update(eventDocRef, { category: DEFAULT_EVENT_CATEGORY_ON_DELETE, subType: null });
      });

      await batch.commit();
      toast({ title: "Category Deleted Successfully" });
      fetchEventCategories();
      fetchEvents();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({ variant: "destructive", title: "Error Deleting Category", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const selectedEditEventCategoryDetails = eventCategoriesDB.find(c => c.name === editEventFormData.category);
  const uniqueSubTypesForEdit = selectedEditEventCategoryDetails?.subTypes ? [...new Set(selectedEditEventCategoryDetails.subTypes)] : [];

  const filteredEventsForList = useMemo(() => {
    return events.filter(event => {
      const departmentMatch = !isSuperAdmin || eventFilterDepartment === ALL_DEPARTMENTS || event.departmentId === eventFilterDepartment;
      const categoryMatch = eventFilterCategory === ALL_CATEGORIES || event.category === eventFilterCategory;
      const subjectMatch = eventFilterSubject === ALL_SUBJECTS || event.subjectId === eventFilterSubject;
      
      
      return departmentMatch && categoryMatch && subjectMatch;
    });
  }, [events, eventFilterDepartment, eventFilterCategory, eventFilterSubject, isSuperAdmin]);

  const filteredEventsForReport = useMemo(() => {
    return events.filter(event => {
      const categoryMatch = reportFilterCategory === ALL_CATEGORIES || event.category === reportFilterCategory;
      const subTypeMatch = reportFilterSubTypes.length === 0 || (event.subType && reportFilterSubTypes.includes(event.subType));
      
      const dateMatch = (() => {
        if (!reportFilterStartDate && !reportFilterEndDate) return true;
        const eventStart = startOfDay(event.start);
        if (reportFilterStartDate && eventStart < startOfDay(reportFilterStartDate)) return false;
        if (reportFilterEndDate && eventStart > endOfDay(reportFilterEndDate)) return false;
        return true;
      })();
      
      return categoryMatch && subTypeMatch && dateMatch;
    });
  }, [events, reportFilterCategory, reportFilterSubTypes, reportFilterStartDate, reportFilterEndDate]);

  const availableSubTypesForFilter = useMemo(() => {
    if (reportFilterCategory === ALL_CATEGORIES) {
      const allSubTypes = eventCategoriesDB.flatMap(c => c.subTypes || []);
      return [...new Set(allSubTypes)].sort();
    }
    const selectedCategory = eventCategoriesDB.find(c => c.name === reportFilterCategory);
    return selectedCategory?.subTypes?.sort() || [];
  }, [reportFilterCategory, eventCategoriesDB]);

  const handleReportFilterCategoryChange = (value: string) => {
    setReportFilterCategory(value);
    // When category changes, auto-select all of its sub-types
    if (value === ALL_CATEGORIES) {
      const allSubTypes = eventCategoriesDB.flatMap(c => c.subTypes || []);
      setReportFilterSubTypes([...new Set(allSubTypes)].sort());
    } else {
      const selectedCategory = eventCategoriesDB.find(c => c.name === value);
      setReportFilterSubTypes(selectedCategory?.subTypes?.sort() || []);
    }
  };

  const handleReportFilterSubTypeChange = (subType: string) => {
    setReportFilterSubTypes(prev => 
      prev.includes(subType) 
        ? prev.filter(st => st !== subType) 
        : [...prev, subType]
    );
  };

  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    const departmentName = userProfile?.departmentId ? departmentOptions.find(d => d.id === userProfile.departmentId)?.name || 'Admin' : 'All Standards';


    // Function to fetch image and convert to data URI
    const getImageDataUri = (url: string, callback: (dataUri: string) => void) => {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.onload = function () {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            callback(dataURL);
        };
        img.src = url;
    };

    getImageDataUri('/download.jpeg', (logoDataUri) => {
        // Header
        doc.addImage(logoDataUri, 'PNG', 14, 15, 60, 15);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("Jnanodaya school", 80, 23);
        doc.setFont("helvetica", "normal");
        
        // Sub-header
        doc.setFontSize(16);
        doc.text(`Academic Events - ${departmentName}`, 14, 40);
        
        doc.setFontSize(10);
        doc.setTextColor(100);

        // Filters text
        let filterText = `Category: ${reportFilterCategory === ALL_CATEGORIES ? 'All' : reportFilterCategory}`;
        if (reportFilterSubTypes.length > 0) {
            filterText += `, Sub-Types: ${reportFilterSubTypes.join(', ')}`;
        }
        if (reportFilterStartDate) {
            filterText += `, From: ${format(reportFilterStartDate, 'PPP')}`;
        }
        if (reportFilterEndDate) {
            filterText += `, To: ${format(reportFilterEndDate, 'PPP')}`;
        }
        doc.text(`Filters: ${filterText}`, 14, 48);

        // Table
        const tableColumn = ["Title", "Category", "Sub-Type", "Start", "End", "Location"];
        const tableRows: string[][] = [];

        filteredEventsForReport.forEach(event => {
            const eventData = [
                event.title || '-',
                event.category || '-',
                event.subType || '-',
                format(event.start, 'Pp'),
                format(event.end, 'Pp'),
                event.location || '-'
            ];
            tableRows.push(eventData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [0, 51, 102] },
        });
        
        // Footer (Pagination)
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
            doc.text(`Generated on: ${format(new Date(), 'PPP p')}`, 14, doc.internal.pageSize.height - 10);
        }
        
        // Save file
        const fileName = `events_report_${departmentName.toLowerCase().replace(' ','_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        doc.save(fileName);

        toast({ title: "PDF Generated", description: "Your event report has been downloaded." });
    });
  };

  if (!userProfile) {
    return <div className="flex justify-center items-center h-full"><p>Loading...</p></div>;
  }

  const tabsConfig = [
    { value: "events", label: "Manage Events", roles: ['department_admin', 'super_admin'] },
    { value: "subjects", label: "Manage Subjects", roles: ['department_admin', 'super_admin'] },
    { value: "reports", label: "Download Reports", roles: ['department_admin', 'super_admin'] },
    { value: "categories", label: "Manage Global Categories", roles: ['super_admin'] }
  ];

  const availableTabs = tabsConfig.filter(tab => tab.roles.includes(userProfile.role));


  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="events" className="w-full">
      <div className="relative border-b">
        <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent p-0">
            <div className="flex items-center gap-4 overflow-x-auto pb-1 custom-scrollbar">
                {availableTabs.map(tab => (
                    <TabsTrigger 
                        key={tab.value} 
                        value={tab.value}
                        className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                        {tab.label}
                    </TabsTrigger>
                ))}
            </div>
        </TabsList>
      </div>

        <TabsContent value="events" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start flex-col sm:flex-row sm:items-center gap-4">
                <div>
                    <CardTitle>Manage Academic Events</CardTitle>
                    <CardDescription>
                        Add, edit, or delete academic events for any standard.
                    </CardDescription>
                </div>
                 <Button onClick={() => setShowAddEventDialog(true)}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-muted/50 mb-6">
                <div className={cn("grid gap-4 items-end", isSuperAdmin ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
                    {isSuperAdmin && (
                        <div>
                            <Label htmlFor="event-department-filter" className="text-xs">Standard</Label>
                            <Select value={eventFilterDepartment} onValueChange={setEventFilterDepartment}>
                                <SelectTrigger id="event-department-filter"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={ALL_DEPARTMENTS}>All Standards</SelectItem>
                                    {departmentOptions.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="event-category-filter" className="text-xs">Category</Label>
                        <Select value={eventFilterCategory} onValueChange={setEventFilterCategory}>
                            <SelectTrigger id="event-category-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                                {eventCategoriesDB.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="event-subject-filter" className="text-xs">Subject</Label>
                        <Select value={eventFilterSubject} onValueChange={setEventFilterSubject}>
                            <SelectTrigger id="event-subject-filter"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ALL_SUBJECTS}>All Subjects</SelectItem>
                                {subjectsDB.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </div>
              {isLoadingEvents ? (<p className="text-center text-muted-foreground">Loading events...</p>) :
              filteredEventsForList.length === 0 ? (
                <div className="text-center text-muted-foreground py-10">
                    <p className="font-semibold">No events found.</p>
                    <p className="text-sm">
                        Try adjusting your filter criteria.
                    </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {filteredEventsForList.map((event) => {
                    const categoryDetails = eventCategoriesDB.find(c => c.name === event.category);
                    const departmentName = departmentOptions.find(d => d.id === event.departmentId)?.name;
                    return (
                    <li key={event.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                        <div className="text-sm text-muted-foreground">
                          {format(event.start, "PPP p")} - {format(event.end, "PPP p")}
                        </div>
                        <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                          <div className="flex items-center">
                            Category:
                            {categoryDetails && <span className="w-3 h-3 rounded-full mr-1.5 ml-1.5" style={{ backgroundColor: categoryDetails.color }} />}
                            {event.category} {event.subType && `(${event.subType})`}
                          </div>
                          {departmentName && <div className="flex items-center">For: <Badge variant="secondary" className="ml-1.5">{departmentName}</Badge></div>}
                        </div>
                        {event.semester && <div className="text-sm text-muted-foreground">Standard: {event.semester}</div>}
                        {event.section && <div className="text-sm text-muted-foreground">Section: {event.section}</div>}
                        {event.location && <div className="text-sm text-muted-foreground">Location: {event.location}</div>}
                        {event.subjectId && subjectsDB.find(s => s.id === event.subjectId) &&
                          <div className="text-sm" style={{color: subjectsDB.find(s => s.id === event.subjectId)?.color || 'inherit'}}>
                            Subject: {subjectsDB.find(s => s.id === event.subjectId)?.name}
                          </div>
                        }
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <Button variant="outline" size="sm" onClick={() => openEditEventDialog(event)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="pt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                <div>
                  <CardTitle>Manage Global Subjects</CardTitle>
                  <CardDescription>
                    Add, edit, or delete subjects. These are available to all standards.
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setAddSubjectFormData({ name: ''});
                  setShowAddSubjectDialog(true);
                }}>
                  <BookOpen className="mr-2 h-4 w-4" /> Add New Subject
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                 <p className="text-center text-muted-foreground">Loading subjects...</p>
              ) : subjectsDB.length === 0 ? (
                <p className="text-center text-muted-foreground">No subjects found. Add some!</p>
              ) : (
                <ul className="space-y-4">
                  {subjectsDB.map((subject) => (
                    <li key={subject.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center flex-col sm:flex-row gap-4 hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="text-lg font-semibold" style={{color: subject.color}}>{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">Color: {subject.color}</p>
                      </div>
                      <div className="space-x-2 self-end sm:self-center">
                        <Button variant="outline" size="sm" onClick={() => openEditSubjectDialog(subject)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSubjectFromDB(subject)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="pt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Download Event Reports</CardTitle>
                    <CardDescription>Filter events to generate a downloadable PDF report.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-6 border rounded-lg bg-card-foreground/5">
                        <h4 className="text-lg font-semibold mb-4">Report Filters</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-2">
                                <Label htmlFor="category-filter" className="text-sm">Filter by Category</Label>
                                <Select value={reportFilterCategory} onValueChange={handleReportFilterCategoryChange}>
                                    <SelectTrigger id="category-filter"><SelectValue placeholder="Select Category" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL_CATEGORIES}>All Categories</SelectItem>
                                        {eventCategoriesDB.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subtype-filter" className="text-sm">Filter by Sub-Type</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between" disabled={availableSubTypesForFilter.length === 0}>
                                            <span>
                                                {reportFilterSubTypes.length === 0
                                                    ? "Select Sub-Types"
                                                    : reportFilterSubTypes.length === availableSubTypesForFilter.length
                                                        ? "All Sub-Types Selected"
                                                        : `${reportFilterSubTypes.length} Selected`}
                                            </span>
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        <DropdownMenuLabel>Available Sub-Types</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <ScrollArea className="h-40">
                                            {availableSubTypesForFilter.map((st) => (
                                                <DropdownMenuCheckboxItem
                                                    key={st}
                                                    checked={reportFilterSubTypes.includes(st)}
                                                    onCheckedChange={() => handleReportFilterSubTypeChange(st)}
                                                    onSelect={(e) => e.preventDefault()} // prevent menu closing on item click
                                                >
                                                    {st}
                                                </DropdownMenuCheckboxItem>
                                            ))}
                                        </ScrollArea>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="report-start-date">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="report-start-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !reportFilterStartDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {reportFilterStartDate ? format(reportFilterStartDate, "PPP") : <span>Pick a start date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={reportFilterStartDate} onSelect={setReportFilterStartDate} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="report-end-date">End Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="report-end-date"
                                            variant={"outline"}
                                            className={cn("w-full justify-start text-left font-normal", !reportFilterEndDate && "text-muted-foreground")}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {reportFilterEndDate ? format(reportFilterEndDate, "PPP") : <span>Pick an end date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={reportFilterEndDate} onSelect={setReportFilterEndDate} disabled={(date) => reportFilterStartDate ? date < reportFilterStartDate : false} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <Button onClick={handleDownloadPdf} disabled={filteredEventsForReport.length === 0}>
                            <FileDown className="mr-2 h-4 w-4"/>
                            Download as PDF ({filteredEventsForReport.length} event{filteredEventsForReport.length !== 1 ? 's' : ''})
                        </Button>
                    </div>
                    {filteredEventsForReport.length === 0 && (
                        <p className="text-center text-muted-foreground pt-4">No events match your current filter criteria.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>

        
          <TabsContent value="categories" className="pt-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                  <div>
                    <CardTitle>Manage Global Event Categories</CardTitle>
                    <CardDescription>
                      These categories are GLOBAL and shared across all classes.
                    </CardDescription>
                  </div>
                  <Button onClick={() => {
                    setAddCategoryFormData({ name: '', subTypesString: ''});
                    setShowAddCategoryDialog(true);
                  }}>
                    <Layers className="mr-2 h-4 w-4" /> Add New Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingCategories ? (
                  <p className="text-center text-muted-foreground">Loading categories...</p>
                ) : eventCategoriesDB.length === 0 ? (
                  <p className="text-center text-muted-foreground">No categories found. Add some!</p>
                ) : (
                  <ul className="space-y-4">
                    {eventCategoriesDB.map((category) => (
                      <li key={category.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center flex-col sm:flex-row gap-4 hover:bg-muted/50 transition-colors">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center">
                             <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                             {category.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Color: {category.color}</p>
                          <p className="text-sm text-muted-foreground">
                            Sub-types: {(category.subTypes && category.subTypes.length > 0) ? [...new Set(category.subTypes)].join(', ') : 'None'}
                          </p>
                        </div>
                        <div className="space-x-2 self-end sm:self-center">
                          <Button variant="outline" size="sm" onClick={() => openEditCategoryDialog(category)}>
                            <Pencil className="mr-1 h-4 w-4" /> Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteEventCategoryFromDB(category)}>
                            <Trash2 className="mr-1 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        
      </Tabs>
      
      <AddEventDialog
        isOpen={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onAddEvent={handleAddEvent}
        subjectsFromDB={subjectsDB}
        categoriesFromDB={eventCategoriesDB}
        departmentId={departmentId || ''}
      />

      {currentEventToEdit && (
         <Dialog open={showEditEventDialog} onOpenChange={(isOpen) => {
            if (!isOpen) setCurrentEventToEdit(null);
            setShowEditEventDialog(isOpen);
         }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Event: {currentEventToEdit.title}</DialogTitle>
              <DialogDescription>Update the details for this event.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEvent} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-event-title">Title</Label>
                <Input id="edit-event-title" name="title" value={editEventFormData.title} onChange={handleEditEventFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-event-category">Category</Label>
                  <Select value={editEventFormData.category || NO_CATEGORY_VALUE} onValueChange={handleEditEventCategoryChange}>
                      <SelectTrigger id="edit-event-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value={NO_CATEGORY_VALUE} disabled={eventCategoriesDB.length > 0}>Select a category</SelectItem>
                          {eventCategoriesDB.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                                <span className="flex items-center">
                                  <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: cat.color }} />
                                  {cat.name}
                                </span>
                            </SelectItem>
                          ))}
                          {eventCategoriesDB.length === 0 && <SelectItem value="no-categories" disabled>No categories configured</SelectItem>}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="edit-event-subType">Sub-Type</Label>
                    <Select
                        value={editEventFormData.subType || ""}
                        onValueChange={handleEditEventSubTypeChange}
                        disabled={!selectedEditEventCategoryDetails || !uniqueSubTypesForEdit || uniqueSubTypesForEdit.length === 0}
                    >
                        <SelectTrigger id="edit-event-subType"><SelectValue placeholder="Select sub-type (if any)" /></SelectTrigger>
                        <SelectContent>
                            {uniqueSubTypesForEdit?.map((st) => <SelectItem key={`${st}-${Date.now()}`} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {(!selectedEditEventCategoryDetails || !uniqueSubTypesForEdit || uniqueSubTypesForEdit.length === 0) && <p className="text-xs text-muted-foreground mt-1">No sub-types for this category.</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-event-subjectId">Subject (Optional)</Label>
                <Select value={editEventFormData.subjectId || NO_SUBJECT_VALUE} onValueChange={handleEditEventSubjectChange}>
                    <SelectTrigger id="edit-event-subjectId"><SelectValue placeholder="Select a subject" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value={NO_SUBJECT_VALUE}>None</SelectItem>
                        {subjectsDB.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                                <span className="flex items-center">
                                    <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: subject.color }} />
                                    {subject.name}
                                </span>
                            </SelectItem>
                        ))}
                        {subjectsDB.length === 0 && <SelectItem value="no-subjects" disabled>No subjects configured</SelectItem>}
                    </SelectContent>
                </Select>
              </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-event-semester">Standard</Label>
                    <Select value={editEventFormData.semester || NO_SEMESTER_VALUE} onValueChange={handleEditEventSemesterChange}>
                        <SelectTrigger id="edit-event-semester"><SelectValue placeholder="Select standard" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NO_SEMESTER_VALUE}>None</SelectItem>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(std => (
                                <SelectItem key={std} value={String(std)}>{std}{std === 1 ? 'st' : std === 2 ? 'nd' : std === 3 ? 'rd' : 'th'} Standard</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-event-section">Section</Label>
                    <Select value={editEventFormData.section || NO_SECTION_VALUE} onValueChange={handleEditEventSectionChange}>
                        <SelectTrigger id="edit-event-section"><SelectValue placeholder="Select section" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NO_SECTION_VALUE}>None</SelectItem>
                            {['A', 'B', 'C', 'D'].map(sec => (
                                <SelectItem key={sec} value={String(sec)}>Section {sec}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="startDate">Start Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !editEventFormData.startDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editEventFormData.startDate ? format(editEventFormData.startDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={editEventFormData.startDate}
                                    onSelect={(date) => handleEditEventSelectChange('startDate', date)}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label>Start Time</Label>
                        <div className="grid grid-cols-3 gap-1">
                            <Select value={editEventFormData.startHour} onValueChange={(val) => handleEditEventSelectChange('startHour', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{hoursArray.map(h => <SelectItem key={`start-h-${h}`} value={h}>{h}</SelectItem>)}</SelectContent>
                            </Select>
                             <Select value={editEventFormData.startMinute} onValueChange={(val) => handleEditEventSelectChange('startMinute', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{minutesArray.map(m => <SelectItem key={`start-m-${m}`} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                             <Select value={editEventFormData.startPeriod} onValueChange={(val) => handleEditEventSelectChange('startPeriod', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{periodsArray.map(p => <SelectItem key={`start-p-${p}`} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="endDate">End Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-full justify-start text-left font-normal", !editEventFormData.endDate && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {editEventFormData.endDate ? format(editEventFormData.endDate, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={editEventFormData.endDate}
                                    onSelect={(date) => handleEditEventSelectChange('endDate', date)}
                                    disabled={(date) => editEventFormData.startDate ? date < editEventFormData.startDate : false}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div>
                        <Label>End Time</Label>
                        <div className="grid grid-cols-3 gap-1">
                            <Select value={editEventFormData.endHour} onValueChange={(val) => handleEditEventSelectChange('endHour', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{hoursArray.map(h => <SelectItem key={`end-h-${h}`} value={h}>{h}</SelectItem>)}</SelectContent>
                            </Select>
                             <Select value={editEventFormData.endMinute} onValueChange={(val) => handleEditEventSelectChange('endMinute', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{minutesArray.map(m => <SelectItem key={`end-m-${m}`} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                             <Select value={editEventFormData.endPeriod} onValueChange={(val) => handleEditEventSelectChange('endPeriod', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{periodsArray.map(p => <SelectItem key={`end-p-${p}`} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
              <div>
                <Label htmlFor="edit-event-location">Location (Optional)</Label>
                <Input id="edit-event-location" name="location" value={editEventFormData.location || ''} onChange={handleEditEventFormChange} />
              </div>
              <div>
                <Label htmlFor="edit-event-description">Description (Optional)</Label>
                <Textarea id="edit-event-description" name="description" value={editEventFormData.description || ''} onChange={handleEditEventFormChange} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showAddSubjectDialog} onOpenChange={(isOpen) => {
        if (!isOpen) setAddSubjectFormData({ name: ''});
        setShowAddSubjectDialog(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Define a new global subject. A unique color will be automatically assigned.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubjectToDB} className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-subject-name">Subject Name</Label>
              <Input id="add-subject-name" name="name" value={addSubjectFormData.name}
                onChange={(e) => setAddSubjectFormData(prev => ({...prev, name: e.target.value}))} required />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Add Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {currentSubjectToEdit && (
        <Dialog open={showEditSubjectDialog} onOpenChange={(isOpen) => {
          if (!isOpen) setCurrentSubjectToEdit(null);
          setShowEditSubjectDialog(isOpen);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Subject: {currentSubjectToEdit.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubjectInDB} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-subject-name">Subject Name</Label>
                <Input id="edit-subject-name" name="name" value={editSubjectFormData.name} onChange={handleEditSubjectFormChange} required />
              </div>
              <div>
                <Label htmlFor="edit-subject-color">Color (Hex Code)</Label>
                <Input id="edit-subject-color" name="color" value={editSubjectFormData.color} onChange={handleEditSubjectFormChange} placeholder="e.g., #FF5733" required />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showAddCategoryDialog} onOpenChange={(isOpen) => {
        if (!isOpen) setAddCategoryFormData({ name: '', subTypesString: '' });
        setShowAddCategoryDialog(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Global Category</DialogTitle>
            <DialogDescription>This category will be available to ALL classes.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEventCategoryToDB} className="space-y-4 py-4">
            <div>
              <Label htmlFor="add-category-name">Category Name</Label>
              <Input id="add-category-name" name="name" value={addCategoryFormData.name}
                onChange={(e) => setAddCategoryFormData(prev => ({...prev, name: e.target.value}))} required />
            </div>
            <div>
              <Label htmlFor="add-category-subTypes">Sub-Types (comma-separated)</Label>
              <Textarea id="add-category-subTypes" name="subTypesString" value={addCategoryFormData.subTypesString}
                onChange={(e) => setAddCategoryFormData(prev => ({...prev, subTypesString: e.target.value}))} placeholder="e.g., Exam, Quiz, Holiday" />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Add Category</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {currentCategoryToEdit && (
        <Dialog open={showEditCategoryDialog} onOpenChange={(isOpen) => {
          if (!isOpen) setCurrentCategoryToEdit(null);
          setShowEditCategoryDialog(isOpen);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Global Category: {currentCategoryToEdit.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateEventCategoryInDB} className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-category-name">Category Name</Label>
                <Input id="edit-category-name" name="name" value={editCategoryFormData.name} onChange={handleEditCategoryFormChange} required />
              </div>
              <div>
                <Label htmlFor="edit-category-color">Color (Hex Code)</Label>
                <Input id="edit-category-color" name="color" value={editCategoryFormData.color} onChange={handleEditCategoryFormChange} placeholder="e.g., #FFD700" required />
              </div>
              <div>
                <Label htmlFor="edit-category-subTypes">Sub-Types (comma-separated)</Label>
                <Textarea id="edit-category-subTypes" name="subTypesString" value={editCategoryFormData.subTypesString} onChange={handleEditCategoryFormChange} placeholder="e.g., Exam, Quiz, Holiday" />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

    

    
