
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
import AddEventDialog from '@/components/calendar/add-event-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, PlusCircle, BookOpen, Layers } from 'lucide-react';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

interface EditEventFormData {
  title: string;
  category: string; // Category Name
  start: string;
  end: string;
  location?: string;
  description?: string;
  subjectId?: string;
  subType?: string;
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
  // color: string; // Color is now auto-assigned
  subTypesString: string; // Comma-separated
}

interface EditCategoryFormData {
  id: string;
  name: string;
  color: string;
  subTypesString: string; // Comma-separated
  originalName?: string; // To track if name changed
}

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";
const NO_CATEGORY_VALUE = "__NONE_CATEGORY__";
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

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const eventsCollectionRef = collection(db, "events");
      const q = query(eventsCollectionRef, orderBy("start", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedEvents: AcademicEvent[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          category: data.category,
          subType: data.subType,
          subjectId: data.subjectId,
          start: (data.start as Timestamp).toDate(),
          end: (data.end as Timestamp).toDate(),
          location: data.location,
          faculty: data.faculty,
          description: data.description,
          attendees: data.attendees,
        };
      });
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({ variant: "destructive", title: "Error Fetching Events", description: `Could not load events. ${(error as Error).message}` });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [toast]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const subjectsCollectionRef = collection(db, "subjects");
      const q = query(subjectsCollectionRef, orderBy("name", "asc"));
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
      const q = query(categoriesCollectionRef, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedCategories: EventCategory[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
          subTypes: data.subTypes || [],
        };
      });
      setEventCategoriesDB(fetchedCategories);
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
  }, [fetchEvents, fetchSubjects, fetchEventCategories]);

  const handleAddEvent = async (newEventData: Omit<AcademicEvent, 'id'>) => {
    try {
      const eventDataForFirestore = {
        ...newEventData,
        start: Timestamp.fromDate(newEventData.start),
        end: Timestamp.fromDate(newEventData.end),
        subjectId: newEventData.subjectId || null,
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
    console.log(`AdminDashboard: Attempting to delete event: ${eventId}`);
    if (!window.confirm("Are you sure you want to delete this event?")) {
        console.log("AdminDashboard: Event deletion cancelled by user.");
        return;
    }
    try {
      console.log(`AdminDashboard: Proceeding with delete operation for event: ${eventId}`);
      await deleteDoc(doc(db, "events", eventId));
      console.log(`AdminDashboard: Event ${eventId} successfully deleted from Firestore (according to client).`);
      toast({ title: "Event Deleted Successfully" });
      fetchEvents();
    } catch (error) {
      console.error(`AdminDashboard: Error deleting event ${eventId} (raw error object):`, error);
      const firebaseError = error as { code?: string; message: string };
      toast({ 
          variant: "destructive", 
          title: "Error Deleting Event", 
          description: `Firebase Error (${firebaseError.code || 'UNKNOWN'}): ${firebaseError.message}`
      });
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

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventToEdit) return;
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
    let assignedColor = FALLBACK_SUBJECT_COLOR;
    for (const color of PREDEFINED_SUBJECT_COLORS) {
      if (!usedColors.has(color)) {
        assignedColor = color;
        break;
      }
    }
    if (assignedColor === FALLBACK_SUBJECT_COLOR && PREDEFINED_SUBJECT_COLORS.length > 0 && usedColors.size >= PREDEFINED_SUBJECT_COLORS.length) {
        console.warn("All predefined subject colors are in use. Assigning fallback color.");
    }
    try {
      await addDoc(collection(db, "subjects"), { name: addSubjectFormData.name, color: assignedColor });
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
    if (!currentSubjectToEdit || !editSubjectFormData.name.trim() || !editSubjectFormData.color.trim()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Subject name and color are required." });
      return;
    }
    try {
      await updateDoc(doc(db, "subjects", currentSubjectToEdit.id), { name: editSubjectFormData.name, color: editSubjectFormData.color });
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
    console.log(`AdminDashboard: Attempting to delete subject: ${subjectId}`);
    if (!window.confirm("Are you sure you want to delete this subject? This will also remove its association from any events.")) {
      console.log("AdminDashboard: Subject deletion cancelled by user.");
      return;
    }
    console.log(`AdminDashboard: Proceeding with delete operation for subject: ${subjectId}`);
    try {
      const batch = writeBatch(db);
      const subjectDocRef = doc(db, "subjects", subjectId);
      batch.delete(subjectDocRef);
      console.log(`AdminDashboard: Subject ${subjectId} added to delete batch.`);
      const eventsQuery = query(collection(db, "events"), where("subjectId", "==", subjectId));
      const eventSnapshots = await getDocs(eventsQuery);
      console.log(`AdminDashboard: Found ${eventSnapshots.docs.length} events associated with subject ${subjectId}.`);
      eventSnapshots.forEach(eventDoc => {
        const eventDocRef = doc(db, "events", eventDoc.id);
        batch.update(eventDocRef, { subjectId: null });
        console.log(`AdminDashboard: Event ${eventDoc.id} added to batch for subjectId update to null.`);
      });
      console.log("AdminDashboard: Committing batch delete for subject and update for associated events...");
      await batch.commit();
      console.log("AdminDashboard: Batch commit successful (according to client).");
      toast({ title: "Subject Deleted Successfully" });
      console.log("AdminDashboard: Re-fetching subjects and events post-deletion...");
      fetchSubjects(); 
      fetchEvents();   
    } catch (error) {
      console.error(`AdminDashboard: Error deleting subject ${subjectId} (raw error object):`, error);
      const firebaseError = error as { code?: string; message: string };
      toast({ 
        variant: "destructive", 
        title: "Error Deleting Subject", 
        description: `Firebase Error (${firebaseError.code || 'UNKNOWN'}): ${firebaseError.message}`
      });
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
    if (assignedColor === FALLBACK_CATEGORY_COLOR && PREDEFINED_CATEGORY_COLORS.length > 0 && usedColors.size >= PREDEFINED_CATEGORY_COLORS.length) {
        console.warn("All predefined category colors are in use. Assigning fallback color.");
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
    if (editCategoryFormData.name.trim().toLowerCase() !== currentCategoryToEdit.name.toLowerCase() &&
        eventCategoriesDB.some(cat => cat.id !== currentCategoryToEdit.id && cat.name.toLowerCase() === editCategoryFormData.name.trim().toLowerCase())) {
        toast({ variant: "destructive", title: "Validation Error", description: "Another category with this name already exists." });
        return;
    }

    const subTypesArray = editCategoryFormData.subTypesString.split(',').map(st => st.trim()).filter(st => st);
    const batch = writeBatch(db);
    const categoryDocRef = doc(db, "eventCategories", currentCategoryToEdit.id);
    batch.update(categoryDocRef, {
      name: editCategoryFormData.name.trim(),
      color: editCategoryFormData.color.trim(),
      subTypes: subTypesArray,
    });

    try {
      await batch.commit();
      toast({ title: "Category Updated Successfully" });
      fetchEventCategories(); 
      if (editCategoryFormData.name !== editCategoryFormData.originalName) {
         fetchEvents(); 
      }
      setShowEditCategoryDialog(false);
      setCurrentCategoryToEdit(null);
    } catch (error) {
      console.error("Error updating category:", error);
      toast({ variant: "destructive", title: "Error Updating Category", description: `Details: ${(error as Error)?.message}` });
    }
  };

  const handleDeleteEventCategoryFromDB = async (category: EventCategory) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? Events using this category will be reassigned to "${DEFAULT_EVENT_CATEGORY_ON_DELETE}".`)) {
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

  if (isLoadingEvents || isLoadingSubjects || isLoadingCategories) {
    return <div className="flex justify-center items-center h-full"><p>Loading admin data...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Manage Events</TabsTrigger>
          <TabsTrigger value="subjects">Manage Subjects</TabsTrigger>
          <TabsTrigger value="categories">Manage Categories</TabsTrigger>
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
                Add, edit, or delete academic events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-center text-muted-foreground">No events found. Add some!</p>
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
                <CardTitle>Manage Subjects</CardTitle>
                <Button onClick={() => { 
                  setAddSubjectFormData({ name: '' }); 
                  setShowAddSubjectDialog(true);
                }}>
                  <BookOpen className="mr-2 h-4 w-4" /> Add New Subject
                </Button>
              </div>
              <CardDescription>
                Add, edit, or delete subjects. A unique color is automatically assigned.
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
                <CardTitle>Manage Event Categories</CardTitle>
                <Button onClick={() => {
                  setAddCategoryFormData({ name: '', subTypesString: ''});
                  setShowAddCategoryDialog(true);
                }}>
                  <Layers className="mr-2 h-4 w-4" /> Add New Category
                </Button>
              </div>
              <CardDescription>
                Add, edit, or delete event categories and their sub-types. A unique color is automatically assigned.
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
            <DialogDescription>Define a new subject. A unique color will be automatically assigned.</DialogDescription>
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
            <DialogTitle>Add New Event Category</DialogTitle>
            <DialogDescription>Define a new category and its optional sub-types (comma-separated). A unique color will be automatically assigned.</DialogDescription>
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
              <DialogTitle>Edit Category: {currentCategoryToEdit.name}</DialogTitle>
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

