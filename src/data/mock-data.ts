import type { EventCategory, Subject, AcademicEvent, EventCategoryName } from '@/lib/types';

export const eventCategories: EventCategory[] = [
  { id: 'academics', name: 'Academics', color: '#FFD700', subTypes: ['ISA', 'Project/Internship Viva', 'SBA Sessions'] },
  { id: 'experiential_learning', name: 'Experiential Learning', color: '#FF5733', subTypes: ['Case Study', 'Research Paper', 'CXO Talk', 'Hackathon', 'Workshops'] },
  { id: 'placement', name: 'Placement', color: '#2196F3', subTypes: ['Aptitude Test', 'Placement Training', 'Mentoring'] },
  { id: 'quality_control', name: 'Quality Control', color: '#4CAF50', subTypes: ['CCM', 'Mid-Term Audit', 'PTM', 'IQAC'] },
  { id: 'others', name: 'Others', color: '#9E9E9E', subTypes: ['Holiday', 'Non-Instructional Day', 'Others'] },
];

// Subjects are no longer mocked here. They will be fetched from Firestore.
export const subjects: Subject[] = []; // Keep this empty, as it's fetched dynamically.

const getDayWithOffset = (day: number, hour: number, monthOffset: number = 0): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

// AcademicEvents mock data is no longer needed if all events are managed via admin panel.
// For initial testing, we can keep a few, but ideally this would be empty too.
export const academicEvents: AcademicEvent[] = [
    // Example:
    // {
    //   id: 'event_placeholder_1',
    //   title: 'Sample Event - Needs DB Entry',
    //   category: 'Academics',
    //   start: getDayWithOffset(10, 10),
    //   end: getDayWithOffset(10, 12),
    //   description: 'This is a placeholder event. Add real events via admin panel.'
    // }
];


export const getCategoryByName = (name: EventCategoryName): EventCategory | undefined => eventCategories.find(cat => cat.name === name);

// Modified to search a provided list of subjects (fetched from DB)
export const getSubjectById = (id: string, subjectsFromDB: Subject[]): Subject | undefined => {
  if (!id || !subjectsFromDB) return undefined;
  return subjectsFromDB.find(sub => sub.id === id);
};
