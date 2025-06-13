
"use client";

// Placeholder for Admin Dashboard
// This page will eventually contain UI for managing events (CRUD operations)

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, orderBy, deleteDoc, doc, updateDoc, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from '@/lib/firebase';
import type { AcademicEvent, EventCategoryName } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AddEventDialog from '@/components/calendar/add-event-dialog'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pencil, Trash2, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { eventCategories, subjects } from '@/data/mock-data'; // Import eventCategories, subjects will be an empty array


// Simplified form state for editing
interface EditEventFormData {
  title: string;
  category: EventCategoryName; // Use EventCategoryName type
  start: string; // Store as ISO string or similar for input[type=datetime-local]
  end: string;
  location?: string;
  description?: string;
  subjectId?: string; // Added subjectId
}

const NO_SUBJECT_VALUE = "__NONE_SUBJECT__";


export default function AdminDashboardPage() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showEditEventDialog, setShowEditEventDialog] = useState(false);
  const [currentEventToEdit, setCurrentEventToEdit] = useState<AcademicEvent | null>(null);
  const [editFormData, setEditFormData] = useState<EditEventFormData>({ title: '', category: 'Academics', start: '', end: '' });

  const { toast } = useToast();

  const fetchEvents = async () => {
    setIsLoading(true);
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
      toast({ variant: "destructive", title: "Error Fetching Events" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [toast]); // Removed fetchEvents from dependencies to avoid re-fetch loop if toast causes re-render


  const handleAddEvent = async (newEventData: Omit<AcademicEvent, 'id'>) => {
    try {
      const eventDataForFirestore = {
        ...newEventData,
        start: Timestamp.fromDate(newEventData.start),
        end: Timestamp.fromDate(newEventData.end),
        subjectId: newEventData.subjectId || null, // Ensure it's null if undefined
      };
      await addDoc(collection(db, "events"), eventDataForFirestore);
      toast({ title: "Event Added Successfully" });
      fetchEvents(); // Refresh list
      setShowAddEventDialog(false);
    } catch (error) {
      console.error("Error adding event:", error);
      toast({ variant: "destructive", title: "Error Adding Event" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteDoc(doc(db, "events", eventId));
      toast({ title: "Event Deleted Successfully" });
      fetchEvents(); // Refresh list
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({ variant: "destructive", title: "Error Deleting Event" });
    }
  };
  
  const openEditDialog = (event: AcademicEvent) => {
    setCurrentEventToEdit(event);
    setEditFormData({
        title: event.title,
        category: event.category,
        start: format(event.start, "yyyy-MM-dd'T'HH:mm"),
        end: format(event.end, "yyyy-MM-dd'T'HH:mm"),
        location: event.location || '',
        description: event.description || '',
        subjectId: event.subjectId || '',
    });
    setShowEditEventDialog(true);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditCategoryChange = (newCategory: EventCategoryName) => {
    setEditFormData(prev => ({ ...prev, category: newCategory }));
  };
  
  const handleEditSubjectChange = (newSubjectId: string) => {
    setEditFormData(prev => ({ ...prev, subjectId: newSubjectId === NO_SUBJECT_VALUE ? '' : newSubjectId }));
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEventToEdit) return;

    try {
        const updatedEventData = {
            ...currentEventToEdit, // Keep existing fields like subType, faculty etc.
            title: editFormData.title,
            category: editFormData.category,
            start: Timestamp.fromDate(new Date(editFormData.start)),
            end: Timestamp.fromDate(new Date(editFormData.end)),
            location: editFormData.location,
            description: editFormData.description,
            subjectId: editFormData.subjectId || null, // Ensure it's null if empty string
        };
        // Remove id from the object to be updated in Firestore
        const { id, ...dataToUpdate } = updatedEventData;

        await updateDoc(doc(db, "events", currentEventToEdit.id), dataToUpdate as { [x: string]: any });
        toast({ title: "Event Updated Successfully" });
        fetchEvents(); // Refresh list
        setShowEditEventDialog(false);
        setCurrentEventToEdit(null);
    } catch (error) {
        console.error("Error updating event:", error);
        toast({ variant: "destructive", title: "Error Updating Event" });
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><p>Loading events...</p></div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Manage Academic Events</CardTitle>
            <Button onClick={() => setShowAddEventDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Event
            </Button>
          </div>
          <CardDescription>
            Here you can add, edit, or delete academic events.
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
                    {/* Display subject name if available - this will likely not work without fetching subject details by ID from DB */}
                    {/* {event.subjectId && <p className="text-sm text-muted-foreground">Subject: {subjects.find(s => s.id === event.subjectId)?.name || event.subjectId}</p>} */}
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(event)}>
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

      <AddEventDialog
        isOpen={showAddEventDialog}
        onClose={() => setShowAddEventDialog(false)}
        onAddEvent={handleAddEvent}
      />

      {currentEventToEdit && (
         <Dialog open={showEditEventDialog} onOpenChange={(isOpen) => {
            if (!isOpen) {
                setCurrentEventToEdit(null);
            }
            setShowEditEventDialog(isOpen);
         }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Event: {currentEventToEdit.title}</DialogTitle>
              <DialogDescription>Update the details for this event.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateEvent} className="space-y-4 py-4">
              <div>
                <Label htmlFor="title" className="block text-sm font-medium">Title</Label>
                <Input id="title" name="title" value={editFormData.title} onChange={handleEditFormChange} required />
              </div>
              <div>
                <Label htmlFor="category" className="block text-sm font-medium">Category</Label>
                <Select
                    value={editFormData.category}
                    onValueChange={(value: EventCategoryName) => handleEditCategoryChange(value)}
                >
                    <SelectTrigger id="category" className="mt-1">
                        <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
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
              </div>
              <div>
                  <Label htmlFor="subjectId" className="block text-sm font-medium">Subject (Optional)</Label>
                  <Select
                      value={editFormData.subjectId || ""}
                      onValueChange={(value: string) => handleEditSubjectChange(value)}
                  >
                      <SelectTrigger id="subjectId" className="mt-1">
                          <SelectValue placeholder="Select a subject (currently unavailable)" />
                      </SelectTrigger>
                      <SelectContent>
                          {subjects.length === 0 && <SelectItem value={NO_SUBJECT_VALUE} disabled>No subjects available</SelectItem>}
                          {subjects.length > 0 && <SelectItem value={NO_SUBJECT_VALUE}>None</SelectItem>}
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
                  {subjects.length === 0 && <p className="text-xs text-muted-foreground mt-1">Subjects are managed via database and currently none are available for selection.</p>}
              </div>
               <div>
                <Label htmlFor="start" className="block text-sm font-medium">Start Date & Time</Label>
                <Input id="start" name="start" type="datetime-local" value={editFormData.start} onChange={handleEditFormChange} required />
              </div>
              <div>
                <Label htmlFor="end" className="block text-sm font-medium">End Date & Time</Label>
                <Input id="end" name="end" type="datetime-local" value={editFormData.end} onChange={handleEditFormChange} required />
              </div>
              <div>
                <Label htmlFor="location" className="block text-sm font-medium">Location (Optional)</Label>
                <Input id="location" name="location" value={editFormData.location || ''} onChange={handleEditFormChange} />
              </div>
              <div>
                <Label htmlFor="description" className="block text-sm font-medium">Description (Optional)</Label>
                <Textarea id="description" name="description" value={editFormData.description || ''} onChange={handleEditFormChange} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
