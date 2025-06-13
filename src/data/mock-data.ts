import type { EventCategory, Subject, AcademicEvent, EventCategoryName } from '@/lib/types';

export const eventCategories: EventCategory[] = [
  { id: 'academics', name: 'Academics', color: '#FFD700', subTypes: ['ISA', 'Project/Internship Viva', 'SBA Sessions'] },
  { id: 'experiential_learning', name: 'Experiential Learning', color: '#FF5733', subTypes: ['Case Study', 'Research Paper', 'CXO Talk', 'Hackathon', 'Workshops'] },
  { id: 'placement', name: 'Placement', color: '#2196F3', subTypes: ['Aptitude Test', 'Placement Training', 'Mentoring'] },
  { id: 'quality_control', name: 'Quality Control', color: '#4CAF50', subTypes: ['CCM', 'Mid-Term Audit', 'PTM', 'IQAC'] },
  { id: 'others', name: 'Others', color: '#9E9E9E', subTypes: ['Holiday', 'Non-Instructional Day', 'Others'] },
];

export const subjects: Subject[] = [
  { id: 'data_visualisation_e1', name: 'Data Visualisation E1', category: 'Academics', color: '#FF6347', faculty: 'Dr. Smith', semester: 'Spring 2025', courseCode: 'DV101' },
  { id: 'marketing_analytics_e1', name: 'Marketing Analytics E1', category: 'Academics', color: '#FFA500', faculty: 'Prof. Jones', semester: 'Spring 2025', courseCode: 'MA101' },
  { id: 'machine_learning_e1', name: 'Machine Learning E1', category: 'Academics', color: '#4682B4', faculty: 'Dr. Ada', semester: 'Fall 2024', courseCode: 'ML101' },
  { id: 'digital_marketing_e1', name: 'Digital Marketing E1', category: 'Academics', color: '#32CD32', faculty: 'Prof. Web', semester: 'Spring 2025', courseCode: 'DM101' },
  { id: 'us_taxation_e1', name: 'US Taxation E1', category: 'Academics', color: '#8A2BE2', faculty: 'Mr. Taxman', semester: 'Fall 2024', courseCode: 'TAX101' },
  { id: 'disruptive_technologies', name: 'Disruptive Technologies', category: 'Experiential Learning', color: '#FFC0CB', faculty: 'Ms. Innovate', semester: 'Spring 2025', courseCode: 'DT101'},
  { id: 'investment_management_e1', name: 'Investment Management E1', category: 'Placement', color: '#00CED1', faculty: 'Mr. Invest', semester: 'Fall 2024', courseCode: 'IM101'},
  // New subjects added below
  { id: 'marketing_analytics_e2', name: 'Marketing Analytics E2', category: 'Academics', color: '#FF4500' },
  { id: 'ads_sales_e1', name: 'Ads & Sales E1', category: 'Academics', color: '#FF8C00' },
  { id: 'digital_marketing_e2', name: 'Digital marketing E2', category: 'Academics', color: '#ADFF2F' },
  { id: 'machine_learning_e2', name: 'Machine Learning E2', category: 'Academics', color: '#20B2AA' },
  { id: 'data_visualisation_e2', name: 'Data Visualisation E2', category: 'Academics', color: '#5F9EA0' },
  { id: 'optimization_technique', name: 'Optimization technique', category: 'Academics', color: '#BA55D3' },
  { id: 'disruptive_tech_talent_acquisition', name: 'Disruptive Technologies and Talent Acquisition', category: 'Experiential Learning', color: '#DB7093' },
  { id: 'compensation_reward_management', name: 'Compensation and Reward management', category: 'Academics', color: '#F08080' },
  { id: 'us_taxation_e2', name: 'US Taxation E2', category: 'Academics', color: '#E9967A' },
  { id: 'consumer_behaviour', name: 'Consumer Behaviour', category: 'Academics', color: '#CD5C5C' },
  { id: 'corporate_taxation_e3', name: 'Corporate Taxation E3', category: 'Academics', color: '#BC8F8F' },
  { id: 'corporate_taxation_e1', name: 'Corporate Taxation E1', category: 'Academics', color: '#D2B48C' },
  { id: 'ads_sales_e2', name: 'Ads & Sales E2', category: 'Academics', color: '#DAA520' },
  { id: 'international_financial_management_e2', name: 'International Financial Management E2', category: 'Academics', color: '#BDB76B' },
  { id: 'international_financial_management_e1', name: 'International Financial Management E1', category: 'Academics', color: '#9ACD32' },
  { id: 'investment_management_e2', name: 'Investment Management E2', category: 'Placement', color: '#66CDAA' },
  { id: 'risk_management_operations', name: 'Risk Management in operations', category: 'Academics', color: '#48D1CC' },
  { id: 'corporate_taxation_e2', name: 'Corporate Taxation E2', category: 'Academics', color: '#AFEEEE' },
  { id: 'project_management_e2', name: 'Project Management E2', category: 'Academics', color: '#B0E0E6' },
  { id: 'service_operations', name: 'Service Operations', category: 'Academics', color: '#C71585' }
];

const getDayWithOffset = (day: number, hour: number, monthOffset: number = 0): Date => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const academicEvents: AcademicEvent[] = [
  {
    id: 'event1',
    title: 'Lecture: Intro to Data Vis',
    category: 'Academics',
    subType: 'ISA',
    subjectId: 'data_visualisation_e1',
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
    subjectId: 'machine_learning_e1',
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
    subjectId: 'disruptive_technologies',
    start: getDayWithOffset(10, 18),
    end: getDayWithOffset(10, 19),
    faculty: 'Ms. Innovate',
    description: 'Guest lecture by a tech industry leader.',
    location: 'Auditorium',
  },
  {
    id: 'event4',
    title: 'Placement Training Session',
    category: 'Placement',
    subType: 'Placement Training',
    subjectId: 'investment_management_e1',
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
    subjectId: 'marketing_analytics_e1',
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
    subjectId: 'digital_marketing_e1',
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
    subjectId: 'us_taxation_e1',
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
    subjectId: 'data_visualisation_e1',
    start: getDayWithOffset(25, 14),
    end: getDayWithOffset(25, 17),
    faculty: 'Dr. Smith',
    description: 'Student presentations for Data Visualisation projects.',
    location: 'Room 105',
  }
];

export const getCategoryByName = (name: EventCategoryName) => eventCategories.find(cat => cat.name === name);
export const getSubjectById = (id: string) => subjects.find(sub => sub.id === id);
