import type { EventCategory, Subject, AcademicEvent, EventCategoryName } from '@/lib/types';

export const eventCategories: EventCategory[] = [
  { id: 'academics', name: 'Academics', color: '#FFD700', subTypes: ['ISA', 'Project/Internship Viva', 'SBA Sessions'] },
  { id: 'experiential_learning', name: 'Experiential Learning', color: '#FF5733', subTypes: ['Case Study', 'Research Paper', 'CXO Talk', 'Hackathon', 'Workshops'] },
  { id: 'placement', name: 'Placement', color: '#2196F3', subTypes: ['Aptitude Test', 'Placement Training', 'Mentoring'] },
  { id: 'quality_control', name: 'Quality Control', color: '#4CAF50', subTypes: ['CCM', 'Mid-Term Audit', 'PTM', 'IQAC'] },
  { id: 'others', name: 'Others', color: '#9E9E9E', subTypes: ['Holiday', 'Non-Instructional Day', 'Others'] },
];

// Subjects are no longer mocked here.
// They would ideally be fetched from a database.
export const subjects: Subject[] = [];

const getDayWithOffset = (day: number, hour: number, monthOffset: number = 0): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

// AcademicEvents mock data remains for now, but subjectId references will not resolve to mock subject details.
export const academicEvents: AcademicEvent[] = [
  {
    id: 'event1',
    title: 'Lecture: Intro to Data Vis',
    category: 'Academics',
    subType: 'ISA',
    subjectId: 'data_visualisation_e1', // This ID will no longer match anything in the local subjects array
    start: getDayWithOffset(3, 10),
    end: getDayWithOffset(3, 11),
    faculty: 'Dr. Smith',
    description: 'Introduction to Data Visualisation concepts and tools.',
    location: 'Room 101',
  },
  {
    id: 'event2',
    title: 'Workshop: ML Basics',
    category: 'Academics',
    subjectId: 'machine_learning_e1', // This ID will no longer match
    start: getDayWithOffset(5, 14),
    end: getDayWithOffset(5, 16),
    faculty: 'Dr. Ada',
    description: 'Hands-on workshop on Machine Learning fundamentals.',
    location: 'Lab A',
  },
  {
    id: 'event3',
    title: 'CXO Talk: Future of Tech',
    category: 'Experiential Learning',
    subType: 'CXO Talk',
    subjectId: 'disruptive_technologies', // This ID will no longer match
    start: getDayWithOffset(10, 18),
    end: getDayWithOffset(10, 19),
    faculty: 'Ms. Innovate',
    description: 'Guest lecture by a tech industry leader.',
    location: 'Auditorium',
  },
  // ... (other events will also have subjectIds that don't resolve from local mock data)
  {
    id: 'event4',
    title: 'Placement Training Session',
    category: 'Placement',
    subType: 'Placement Training',
    subjectId: 'investment_management_e1', // This ID will no longer match
    start: getDayWithOffset(12, 9),
    end: getDayWithOffset(12, 12),
    description: 'Session on resume building and interview skills.',
    location: 'Hall B',
  },
  {
    id: 'event5',
    title: 'Mid-Term Audit Meeting',
    category: 'Quality Control',
    subType: 'Mid-Term Audit',
    start: getDayWithOffset(15, 11),
    end: getDayWithOffset(15, 12),
    description: 'Review of academic delivery quality.',
    location: 'Conference Room 1',
  },
  {
    id: 'event6',
    title: 'Holiday: Summer Break Starts',
    category: 'Others',
    subType: 'Holiday',
    start: getDayWithOffset(1, 0, 1), // Next month
    end: getDayWithOffset(1, 23, 1),
    description: 'Institution closed for summer break.',
  },
   {
    id: 'event7',
    title: 'Marketing Analytics Case Study',
    category: 'Academics',
    subjectId: 'marketing_analytics_e1', // This ID will no longer match
    start: getDayWithOffset(7, 13),
    end: getDayWithOffset(7, 15),
    faculty: 'Prof. Jones',
    description: 'Discussion of a real-world marketing analytics case.',
    location: 'Room 202',
  },
  {
    id: 'event8',
    title: 'Digital Marketing Workshop',
    category: 'Experiential Learning',
    subType: 'Workshops',
    subjectId: 'digital_marketing_e1', // This ID will no longer match
    start: getDayWithOffset(18, 10),
    end: getDayWithOffset(18, 13),
    faculty: 'Prof. Web',
    description: 'Practical workshop on SEO and SEM.',
    location: 'Digital Lab',
  },
  {
    id: 'event9',
    title: 'US Taxation Seminar',
    category: 'Academics',
    subjectId: 'us_taxation_e1', // This ID will no longer match
    start: getDayWithOffset(22, 9),
    end: getDayWithOffset(22, 11),
    faculty: 'Mr. Taxman',
    description: 'Overview of current US tax laws for individuals.',
    location: 'Lecture Hall C',
  },
   {
    id: 'event10',
    title: 'Data Vis Project Presentation',
    category: 'Academics',
    subType: 'Project/Internship Viva',
    subjectId: 'data_visualisation_e1', // This ID will no longer match
    start: getDayWithOffset(25, 14),
    end: getDayWithOffset(25, 17),
    faculty: 'Dr. Smith',
    description: 'Student presentations for Data Visualisation projects.',
    location: 'Room 105',
  }
];

export const getCategoryByName = (name: EventCategoryName) => eventCategories.find(cat => cat.name === name);

// Since subjects array is now empty (or would be fetched from DB),
// this function will likely not find a subject by ID from a local static list.
// Components using this need to handle the case where 'subject' is undefined.
export const getSubjectById = (id: string): Subject | undefined => {
  // In a real scenario with DB, this would fetch from Firestore.
  // For now, it will search the empty 'subjects' array.
  return subjects.find(sub => sub.id === id);
};
