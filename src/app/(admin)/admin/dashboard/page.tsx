
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, deleteDoc, doc, updateDoc, DocumentData, QueryDocumentSnapshot, writeBatch, where } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { AcademicEvent, EventCategoryName, Subject } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AddEventDialog from '@/components/calendar/add-event-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, PlusCircle, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { eventCategories } from '@/data/mock-data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';

interface EditEventFormData {
  title: string;
  category: EventCategoryName;
  start: string;
  end: string;
  location?: string;
  description?: string;
  subjectId?: string;
  subType?: string;
}

// Used for adding a subject, color is auto-assigned
interface AddSubjectFormData {
  name: string;
}

// Used for editing a subject, color is editable
interface EditSubjectFormData {
  name: string;
  color: string; 
}

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";

// Predefined list of colors for automatic assignment
const PREDEFINED_SUBJECT_COLORS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', 
  '#33FFA1', '#FF8C00', '#00CED1', '#FFD700', '#ADFF2F', 
  '#BA55D3', '#20B2AA', '#FF69B4', '#7B68EE', '#66CDAA',
  '#E57373', '#81C784', '#64B5F6', '#F06292', '#CE93D8',
  '#4DB6AC', '#FFB74D', '#7986CB', '#AED581', '#F48FB1'
];
const FALLBACK_SUBJECT_COLOR = '#A0A0A0'; // Default if all predefined are used

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [subjectsDB, setSubjectsDB] = useState<Subject[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);

  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [currentEventToEdit, setCurrentEventToEdit] = useState<AcademicEvent | null>(null);
  const [editFormData, setEditFormData] = useState<EditEventFormData>({ title: '', category: 'Academics', start: '', end: '' });

  const [showAddSubjectDialog, setShowAddSubjectDialog] = useState(false);
  const [showEditSubjectDialog, setShowEditSubjectDialog] = useState(false);
  const [currentSubjectToEdit, setCurrentSubjectToEdit] = useState<Subject | null>(null);
  const [addSubjectFormData, setAddSubjectFormData] = useState<AddSubjectFormData>({ name: '' });
  const [editSubjectFormData, setEditSubjectFormData] = useState<EditSubjectFormData>({ name: '', color: '#808080' });
  
  const { toast } = useToast();

  const fetchEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const eventsCollection = collection(db, "events");
      const q = query(eventsCollection, orderBy("start", "asc"));
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
      toast({ variant: "destructive", title: "Error Fetching Events", description: "Could not load events." });
    } finally {
      setIsLoadingEvents(false);
    }
  }, [toast]);

  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      const subjectsCollection = collection(db, "subjects");
      const q = query(subjectsCollection, orderBy("name", "asc"));
      const querySnapshot = await getDocs(q);
      const fetchedSubjects: Subject[] = querySnapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          color: data.color,
        };
      });
      setSubjectsDB(fetchedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast({ variant: "destructive", title: "Error Fetching Subjects", description: "Could not load subjects." });
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEvents();
    fetchSubjects();
  }, [fetchEvents, fetchSubjects]);

  // Event Management Functions
  const handleAddEvent = async (newEventData: Omit<AcademicEvent, 'id'>) => {
    try {
      const eventDataForFirestore = {
        ...newEventData,
        start: Timestamp.fromDate(newEventData.start),
        end: Timestamp.fromDate(newEventData.end),
        subjectId: newEventData.subjectId || null,
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
    console.log(`Attempting to delete event: ${eventId}`);
    if (!window.confirm("Are you sure you want to delete this event?")) {
        console.log("Event deletion cancelled by user.");
        return;
    }
    try {
      console.log(`Proceeding with delete operation for event: ${eventId}`);
      await deleteDoc(doc(db, "events", eventId));
      console.log(`Event ${eventId} successfully deleted from Firestore (according to client).`);
      toast({ title: "Event Deleted Successfully" });
      fetchEvents();
    } catch (error) {
      console.error(`Error deleting event ${eventId} (raw error object):`, error);
      let errorMessage = "An unknown error occurred. Check console for details.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = `Firebase Error (${firebaseError.code}): ${firebaseError.message}`;
      }
      toast({ 
          variant: "destructive", 
          title: "Error Deleting Event", 
          description: errorMessage 
      });
    }
  };
  
  const openEditEventDialog = (event: AcademicEvent) => {
    setCurrentEventToEdit(event);
    setEditFormData({
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
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditEventCategoryChange = (newCategory: EventCategoryName) => {
    setEditFormData(prev => ({ ...prev, category: newCategory, subType: '' })); 
  };
  
  const handleEditEventSubjectChange = (newSubjectId: string) => {
    setEditFormData(prev => ({ ...prev, subjectId: newSubjectId === NO_SUBJECT_VALUE ? '' : newSubjectId }));
  };
  
  const handleEditEventSubTypeChange = (newSubType: string) => {
    setEditFormData(prev => ({ ...prev, subType: newSubType }));
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventToEdit) return;
    try {
        const updatedEventData = {
            ...currentEventToEdit,
            title: editFormData.title,
            category: editFormData.category,
            subType: editFormData.subType || null,
            start: Timestamp.fromDate(new Date(editFormData.start)),
            end: Timestamp.fromDate(new Date(editFormData.end)),
            location: editFormData.location,
            description: editFormData.description,
            subjectId: editFormData.subjectId || null,
        };
        const { id, ...dataToUpdate } = updatedEventData;
        await updateDoc(doc(db, "events", currentEventToEdit.id), dataToUpdate as { [x: string]: any });
        toast({ title: "Event Updated Successfully" });
        fetchEvents();
        setShowEditEventDialog(false);
        setCurrentEventToEdit(null);
    } catch (error) {
        console.error("Error updating event:", error);
        toast({ variant: "destructive", title: "Error Updating Event", description: `Details: ${(error as Error)?.message}` });
    }
  };

  // Subject Management Functions
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
        console.warn("All predefined subject colors are in use. Assigning fallback color. Consider expanding the color palette.");
    }


    try {
      await addDoc(collection(db, "subjects"), {
        name: addSubjectFormData.name,
        color: assignedColor,
      });
      toast({ title: "Subject Added Successfully", description: `Assigned color: ${assignedColor}` });
      fetchSubjects();
      setShowAddSubjectDialog(false);
      setAddSubjectFormData({ name: '' }); // Reset form
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

  const handleDeleteSubjectFromDB = async (subjectId: string) => {
    console.log(`Attempting to delete subject: ${subjectId}`);
    if (!window.confirm("Are you sure you want to delete this subject? This will also remove its association from any events.")) {
      console.log("Subject deletion cancelled by user.");
      return;
    }
    
    console.log(`Proceeding with delete operation for subject: ${subjectId}`);
    try {
      const batch = writeBatch(db);
      
      const subjectDocRef = doc(db, "subjects", subjectId);
      batch.delete(subjectDocRef);
      console.log(`Subject ${subjectId} added to delete batch.`);

      const eventsQuery = query(collection(db, "events"), where("subjectId", "==", subjectId));
      const eventSnapshots = await getDocs(eventsQuery);
      
      console.log(`Found ${eventSnapshots.docs.length} events associated with subject ${subjectId}.`);
      eventSnapshots.forEach(eventDoc => {
        const eventDocRef = doc(db, "events", eventDoc.id);
        batch.update(eventDocRef, { subjectId: null });
        console.log(`Event ${eventDoc.id} added to batch for subjectId update to null.`);
      });
      
      console.log("Committing batch delete for subject and update for associated events...");
      await batch.commit();
      console.log("Batch commit successful (according to client).");

      toast({ title: "Subject Deleted Successfully" });
      
      console.log("Re-fetching subjects and events post-deletion...");
      fetchSubjects(); 
      fetchEvents();   
    } catch (error) {
      console.error(`Error deleting subject ${subjectId} (raw error object):`, error);
      let errorMessage = "An unknown error occurred. Check console for details.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        const firebaseError = error as { code: string; message: string };
        errorMessage = `Firebase Error (${firebaseError.code}): ${firebaseError.message}`;
        console.error(`Detailed Firebase Error: Code - ${firebaseError.code}, Message - ${firebaseError.message}`);
      }
      
      toast({ 
        variant: "destructive", 
        title: "Error Deleting Subject", 
        description: errorMessage
      });
    }
  };
  
  const selectedEditEventCategoryDetails = eventCategories.find(c => c.name === editFormData.category);

  if (isLoadingEvents || isLoadingSubjects) {
    return <div className="flex justify-center items-center h-full"><p>Loading admin data...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Manage Events</TabsTrigger>
          <TabsTrigger value="subjects">Manage Subjects</TabsTrigger>
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
                  {events.map((event) => (
                    <li key={event.id} className="p-4 border rounded-lg shadow-sm flex justify-between items-center hover:bg-muted/50 transition-colors">
                      <div>
                        <h3 className="text-lg font-semibold text-primary">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {format(event.start, "PPP p")} - {format(event.end, "PPP p")}
                        </p>
                        <p className="text-sm text-muted-foreground">Category: {event.category} {event.subType && `(${event.subType})`}</p>
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
                  ))}
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
                  setAddSubjectFormData({ name: '' }); // Reset form data for adding
                  setShowAddSubjectDialog(true);
                }}>
                  <BookOpen className="mr-2 h-4 w-4" /> Add New Subject
                </Button>
              </div>
              <CardDescription>
                Add, edit, or delete subjects. These will be available for selection when creating events.
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
      </Tabs>

      <AddEventDialog
        isOpen={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onAddEvent={handleAddEvent}
        subjectsFromDB={subjectsDB}
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
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" value={editFormData.title} onChange={handleEditEventFormChange} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={editFormData.category} onValueChange={handleEditEventCategoryChange}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                          {eventCategories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                </div>
                <div>
                    <Label htmlFor="subType">Sub-Type</Label>
                    <Select 
                        value={editFormData.subType || ""} 
                        onValueChange={handleEditEventSubTypeChange}
                        disabled={!selectedEditEventCategoryDetails || !selectedEditEventCategoryDetails.subTypes || selectedEditEventCategoryDetails.subTypes.length === 0}
                    >
                        <SelectTrigger id="subType"><SelectValue placeholder="Select sub-type (if any)" /></SelectTrigger>
                        <SelectContent>
                            {selectedEditEventCategoryDetails?.subTypes?.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    {(!selectedEditEventCategoryDetails || !selectedEditEventCategoryDetails.subTypes || selectedEditEventCategoryDetails.subTypes.length === 0) && <p className="text-xs text-muted-foreground mt-1">No sub-types for this category.</p>}
                </div>
              </div>
              <div>
                  <Label htmlFor="subjectId">Subject (Optional)</Label>
                  <Select value={editFormData.subjectId || NO_SUBJECT_VALUE} onValueChange={handleEditEventSubjectChange}>
                      <SelectTrigger id="subjectId"><SelectValue placeholder="Select a subject" /></SelectTrigger>
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
                <Label htmlFor="start">Start Date & Time</Label>
                <Input id="start" name="start" type="datetime-local" value={editFormData.start} onChange={handleEditEventFormChange} required />
              </div>
              <div>
                <Label htmlFor="end">End Date & Time</Label>
                <Input id="end" name="end" type="datetime-local" value={editFormData.end} onChange={handleEditEventFormChange} required />
              </div>
              <div>
                <Label htmlFor="location">Location (Optional)</Label>
                <Input id="location" name="location" value={editFormData.location || ''} onChange={handleEditEventFormChange} />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" value={editFormData.description || ''} onChange={handleEditEventFormChange} />
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Subject Dialog */}
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
              <Input 
                id="add-subject-name" 
                name="name" 
                value={addSubjectFormData.name} 
                onChange={(e) => setAddSubjectFormData(prev => ({...prev, name: e.target.value}))} 
                required 
              />
            </div>
            {/* Color input removed - will be auto-assigned */}
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Add Subject</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
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
                <Input 
                  id="edit-subject-name" 
                  name="name" 
                  value={editSubjectFormData.name} 
                  onChange={handleEditSubjectFormChange} 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="edit-subject-color">Color (Hex Code)</Label>
                <Input 
                  id="edit-subject-color" 
                  name="color" 
                  value={editSubjectFormData.color} 
                  onChange={handleEditSubjectFormChange}
                  placeholder="e.g., #FF5733" 
                  required 
                />
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

    