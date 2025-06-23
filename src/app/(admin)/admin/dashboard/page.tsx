
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
import { Pencil, Trash2, PlusCircle, BookOpen, Layers, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

interface EditEventFormData {
  title: string;
  category: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  subjectId?: string;
  subType?: string;
  semester?: string;
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
const DEFAULT_EVENT_CATEGORY_ON_DELETE = "Others";

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
  const [editEventFormData, setEditEventFormData] = useState<EditEventFormData>({ title: '', category: '', start: '', end: '' });

  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);
  const [addSubjectFormData, setAddSubjectFormData] = useState<AddSubjectFormData>({ name: '' });
  const [editSubjectFormData, setEditSubjectFormData] = useState<EditSubjectFormData>({ name: '', color: '#808080' });

  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [currentCategoryToEdit, setCurrentCategoryToEdit] = useState<EventCategory | null>(null);
  const [addCategoryFormData, setAddCategoryFormData] = useState<AddCategoryFormData>({ name: '', subTypesString: '' });
  const [editCategoryFormData, setEditCategoryFormData] = useState<EditCategoryFormData>({ id: '', name: '', color: '#808080', subTypesString: '' });

  const { toast } = useToast();

  const departmentId = userProfile?.departmentId;

  const fetchEvents = useCallback(async () => {
    if (!departmentId) return;
    setIsLoadingEvents(true);
    try {
      const eventsCollectionRef = collection(db, "events");
      const q = query(eventsCollectionRef, where("departmentId", "==", departmentId));
      const querySnapshot = await getDocs(q);

      const invalidEventTitles: string[] = [];
      const fetchedEvents: AcademicEvent[] = querySnapshot.docs
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
            subType: data.subType,
            subjectId: data.subjectId,
            semester: data.semester,
            start: data.start.toDate(),
            end: data.end.toDate(),
            location: data.location,
            faculty: data.faculty,
            description: data.description,
            attendees: data.attendees,
            departmentId: data.departmentId,
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
    if (!departmentId) return;
    setIsLoadingSubjects(true);
    try {
        const subjectsCollectionRef = collection(db, "subjects");
        const q = query(subjectsCollectionRef, where("departmentId", "==", departmentId), orderBy("name"));
        const querySnapshot = await getDocs(q);

        const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
            const data = doc.data();
            return { id: doc.id, name: data.name, color: data.color, departmentId: data.departmentId };
        });
        setSubjectsDB(fetchedSubjects);
    } catch (error) {
        console.error("Error fetching subjects:", error);
        toast({ variant: "destructive", title: "Error Fetching Subjects", description: `Could not load subjects. ${(error as Error).message}` });
    } finally {
        setIsLoadingSubjects(false);
    }
  }, [toast, departmentId]);

  const fetchEventCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const categoriesCollectionRef = collection(db, "eventCategories");
      const q = query(categoriesCollectionRef);
      const querySnapshot = await getDocs(q);
      const fetchedCategories: EventCategory[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return { id: doc.id, name: data.name, color: data.color, subTypes: data.subTypes || [] };
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
    if (departmentId) {
      fetchEvents();
      fetchSubjects();
    }
    fetchEventCategories();
  }, [departmentId, fetchEvents, fetchSubjects, fetchEventCategories]);

  const handleAddEvent = async (newEventData: Omit<AcademicEvent, 'id'>) => {
    if (!departmentId || newEventData.departmentId !== departmentId) {
        toast({ variant: "destructive", title: "Error", description: "Department ID is missing or mismatched." });
        return;
    }
    try {
      const eventDataForFirestore = {
        ...newEventData,
        start: Timestamp.fromDate(newEventData.start),
        end: Timestamp.fromDate(newEventData.end),
        subjectId: newEventData.subjectId || null,
        semester: newEventData.semester || null,
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
    setEditEventFormData({
        title: event.title,
        category: event.category,
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        description: event.description || '',
        subjectId: event.subjectId || '',
        subType: event.subType || '',
        semester: event.semester ? String(event.semester) : NO_SEMESTER_VALUE,
    });
    setShowEditEventDialog(true);
  };

  const handleEditEventFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
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
  
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventToEdit || !departmentId) return;
    try {
        const updatedEventData = {
            title: editEventFormData.title,
            category: editEventFormData.category,
            subType: editEventFormData.subType || null,
            start: Timestamp.fromDate(new Date(editEventFormData.start)),
            end: Timestamp.fromDate(new Date(editEventFormData.end)),
            location: editEventFormData.location,
            description: editEventFormData.description,
            subjectId: editEventFormData.subjectId || null,
            semester: editEventFormData.semester && editEventFormData.semester !== NO_SEMESTER_VALUE ? parseInt(editEventFormData.semester, 10) : null,
            departmentId: departmentId, // Ensure departmentId is preserved/added
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
    if (!departmentId) {
      toast({ variant: "destructive", title: "Error", description: "No department identified for admin." });
      return;
    }
    if (!addSubjectFormData.name.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject name is required." });
      return;
    }
    const usedColors = new Set(subjectsDB.map(s => s.color));
    let assignedColor = FALLBACK_SUBJECT_COLOR;
    for (const color of PREDEFINED_SUBJECT_COLORS) {
      if (!usedColors.has(color)) {
        assignedColor = color;
        break;
      }
    }
    try {
      await addDoc(collection(db, "subjects"), { name: addSubjectFormData.name, color: assignedColor, departmentId: departmentId });
      toast({ title: "Subject Added Successfully", description: `Assigned color: ${assignedColor}` });
      fetchSubjects();
      setShowAddSubjectDialog(false);
      setAddSubjectFormData({ name: '' });
    } catch (error) {
      console.error("Error adding subject:", error);
      toast({ variant: "destructive", title: "Error Adding Subject", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const openEditSubjectDialog = (subject: Subject) => {
    setCurrentSubjectToEdit(subject);
    setEditSubjectFormData({ name: subject.name, color: subject.color });
    setShowEditSubjectDialog(true);
  };

  const handleEditSubjectFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditSubjectFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubjectInDB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSubjectToEdit || !editSubjectFormData.name.trim() || !editSubjectFormData.color.trim() || !departmentId) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject name and color are required." });
      return;
    }
    try {
      await updateDoc(doc(db, "subjects", currentSubjectToEdit.id), { name: editSubjectFormData.name, color: editSubjectFormData.color, departmentId: departmentId });
      toast({ title: "Subject Updated Successfully" });
      fetchSubjects();
      setShowEditSubjectDialog(false);
      setCurrentSubjectToEdit(null);
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({ variant: "destructive", title: "Error Updating Subject", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleDeleteSubjectFromDB = async (subjectId: string) => {
    if (!window.confirm("Are you sure you want to delete this subject? This will also remove its association from any events in this department.")) return;
    if (!departmentId) return;

    try {
      const batch = writeBatch(db);
      const subjectDocRef = doc(db, "subjects", subjectId);
      batch.delete(subjectDocRef);
      
      const eventsQuery = query(collection(db, "events"), where("subjectId", "==", subjectId), where("departmentId", "==", departmentId));
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

  // Category management is global and does not depend on department
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

    const subTypesArray = addCategoryFormData.subTypesString.split(',').map(st => st.trim()).filter(st => st);
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
      subTypesString: (category.subTypes || []).join(', '),
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

    const subTypesArray = editCategoryFormData.subTypesString.split(',').map(st => st.trim()).filter(st => st);
    const batch = writeBatch(db);
    const categoryDocRef = doc(db, "eventCategories", currentCategoryToEdit.id);

    batch.update(categoryDocRef, {
      name: newName,
      color: editCategoryFormData.color.trim(),
      subTypes: subTypesArray,
    });

    // This is a global change. When a category name changes, it affects events in ALL departments.
    let eventsUpdatedCount = 0;
    if (originalName && newName !== originalName) {
      // Note: This query is NOT scoped by department, which is intentional for global category updates.
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
         fetchEvents(); // Re-fetch events for the current department to reflect change
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

  if (!userProfile) {
    return <div className="flex justify-center items-center h-full"><p>Loading...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Manage Events</TabsTrigger>
          <TabsTrigger value="subjects">Manage Subjects</TabsTrigger>
          <TabsTrigger value="categories">Manage Global Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manage Academic Events</CardTitle>
                 <Button onClick={() => setShowAddEventDialog(true)}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
                 </Button>
              </div>
              <CardDescription>
                Add, edit, or delete academic events for your department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (<p className="text-center text-muted-foreground">Loading events...</p>) :
              events.length === 0 ? (
                <p className="text-center text-muted-foreground">No events found for this department. Add one!</p>
              ) : (
                <ul className="space-y-4">
                  {events.map((event) => {
                    const categoryDetails = eventCategoriesDB.find(c => c.name === event.category);
                    return (
                    <li key={event.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(event.start, "PPP p")} - {format(event.end, "PPP p")}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center">
                          Category:
                          {categoryDetails && <span className="w-3 h-3 rounded-full mr-1.5 ml-1.5" style={{ backgroundColor: categoryDetails.color }} />}
                          {event.category} {event.subType && `(${event.subType})`}
                        </p>
                        {event.semester && <p className="text-sm text-muted-foreground">Semester: {event.semester}</p>}
                        {event.location && <p className="text-sm text-muted-foreground">Location: {event.location}</p>}
                        {event.subjectId && subjectsDB.find(s => s.id === event.subjectId) &&
                          <p className="text-sm" style={{color: subjectsDB.find(s => s.id === event.subjectId)?.color || 'inherit'}}>
                            Subject: {subjectsDB.find(s => s.id === event.subjectId)?.name}
                          </p>
                        }
                      </div>
                      <div className="space-x-2">
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

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manage Department Subjects</CardTitle>
                <Button onClick={() => {
                  setAddSubjectFormData({ name: '' });
                  setShowAddSubjectDialog(true);
                }}>
                  <BookOpen className="mr-2 h-4 w-4" /> Add New Subject
                </Button>
              </div>
              <CardDescription>
                Add, edit, or delete subjects for your department.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubjects ? (
                 <p className="text-center text-muted-foreground">Loading subjects...</p>
              ) : subjectsDB.length === 0 ? (
                <p className="text-center text-muted-foreground">No subjects found. Add some!</p>
              ) : (
                <ul className="space-y-4">
                  {subjectsDB.map((subject) => (
                    <li key={subject.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="text-lg font-semibold" style={{color: subject.color}}>{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">Color: {subject.color}</p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditSubjectDialog(subject)}>
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteSubjectFromDB(subject.id)}>
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

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Manage Global Event Categories</CardTitle>
                <Button onClick={() => {
                  setAddCategoryFormData({ name: '', subTypesString: ''});
                  setShowAddCategoryDialog(true);
                }}>
                  <Layers className="mr-2 h-4 w-4" /> Add New Category
                </Button>
              </div>
              <CardDescription>
                These categories are GLOBAL and shared across all departments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCategories ? (
                <p className="text-center text-muted-foreground">Loading categories...</p>
              ) : eventCategoriesDB.length === 0 ? (
                <p className="text-center text-muted-foreground">No categories found. Add some!</p>
              ) : (
                <ul className="space-y-4">
                  {eventCategoriesDB.map((category) => (
                    <li key={category.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center">
                           <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }} />
                           {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">Color: {category.color}</p>
                        <p className="text-sm text-muted-foreground">
                          Sub-types: {(category.subTypes && category.subTypes.length > 0) ? category.subTypes.join(', ') : 'None'}
                        </p>
                      </div>
                      <div className="space-x-2">
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
                        disabled={!selectedEditEventCategoryDetails || !selectedEditEventCategoryDetails.subTypes || selectedEditEventCategoryDetails.subTypes.length === 0}
                    >
                        <SelectTrigger id="edit-event-subType"><SelectValue placeholder="Select sub-type (if any)" /></SelectTrigger>
                        <SelectContent>
                            {selectedEditEventCategoryDetails?.subTypes?.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {(!selectedEditEventCategoryDetails || !selectedEditEventCategoryDetails.subTypes || selectedEditEventCategoryDetails.subTypes.length === 0) && <p className="text-xs text-muted-foreground mt-1">No sub-types for this category.</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                   <div>
                    <Label htmlFor="edit-event-semester">Semester/Trimester</Label>
                    <Select value={editEventFormData.semester || NO_SEMESTER_VALUE} onValueChange={handleEditEventSemesterChange}>
                        <SelectTrigger id="edit-event-semester"><SelectValue placeholder="Select semester" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={NO_SEMESTER_VALUE}>None</SelectItem>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                                <SelectItem key={sem} value={String(sem)}>Sem/Trimester {sem}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
               <div>
                <Label htmlFor="edit-event-start">Start Date & Time</Label>
                <Input id="edit-event-start" name="start" type="datetime-local" value={editEventFormData.start} onChange={handleEditEventFormChange} required />
              </div>
              <div>
                <Label htmlFor="edit-event-end">End Date & Time</Label>
                <Input id="edit-event-end" name="end" type="datetime-local" value={editEventFormData.end} onChange={handleEditEventFormChange} required />
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
        if (!isOpen) setAddSubjectFormData({ name: '' });
        setShowAddSubjectDialog(isOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Subject</DialogTitle>
            <DialogDescription>Define a new subject for your department. A unique color will be automatically assigned.</DialogDescription>
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
            <DialogDescription>This category will be available to ALL departments.</DialogDescription>
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
