import type { EventCategory, Subject, AcademicEvent } from '@/lib/types';

// Event Categories are now managed via Firestore. This array is for reference or fallback if needed.
// It's recommended to rely on data fetched from Firestore.
export const eventCategories_fallback: EventCategory[] = [
  { id: 'academics_fallback', name: 'Academics', color: '#FFD700', subTypes: ['ISA', 'Project/Internship Viva', 'SBA Sessions'] },
  { id: 'experiential_learning_fallback', name: 'Experiential Learning', color: '#FF5733', subTypes: ['Case Study', 'Research Paper', 'CXO Talk', 'Hackathon', 'Workshops'] },
  { id: 'placement_fallback', name: 'Placement', color: '#2196F3', subTypes: ['Aptitude Test', 'Placement Training', 'Mentoring'] },
  { id: 'quality_control_fallback', name: 'Quality Control', color: '#4CAF50', subTypes: ['CCM', 'Mid-Term Audit', 'PTM', 'IQAC'] },
  { id: 'others_fallback', name: 'Others', color: '#9E9E9E', subTypes: ['Holiday', 'Non-Instructional Day', 'Others'] },
];


export const subjects: Subject[] = []; // Keep this empty, as it's fetched dynamically.


export const academicEvents: AcademicEvent[] = [
    // Example:
    // {
    //   id: 'event_placeholder_1',
    //   title: 'Sample Event - Needs DB Entry',
    //   category: 'Academics', // This would be a category name
    //   start: new Date(),
    //   end: new Date(),
    //   description: 'This is a placeholder event. Add real events via admin panel.'
    // }
];

// Helper to find a category by its name from a dynamic list
export const getCategoryByName = (name: string, categoriesFromDB: EventCategory[]): EventCategory | undefined => {
  if (!name || !categoriesFromDB) return undefined;
  return categoriesFromDB.find(cat => cat.name === name);
};

export const getCategoryById = (id: string, categoriesFromDB: EventCategory[]): EventCategory | undefined => {
  if (!id || !categoriesFromDB) return undefined;
  return categoriesFromDB.find(cat => cat.id === id);
};

// Modified to search a provided list of subjects (fetched from DB)
export const getSubjectById = (id: string, subjectsFromDB: Subject[]): Subject | undefined => {
  if (!id || !subjectsFromDB) return undefined;
  return subjectsFromDB.find(sub => sub.id === id);
};
