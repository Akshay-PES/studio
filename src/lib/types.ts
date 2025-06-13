export type EventCategoryName = "Experiential Learning" | "Quality Control" | "Placement" | "Academics" | "Others";

export interface EventCategory {
  id: string;
  name: EventCategoryName;
  color: string; // Hex color code
  subTypes?: string[]; // Original sub-types
}

export interface Subject {
  id: string; // e.g., "data_visualisation_e1"
  name: string; // e.g., "Data Visualisation E1"
  category: EventCategoryName; // Primary category
  color: string; // Hex color code
  faculty?: string;
  semester?: string;
  courseCode?: string;
}

export interface AcademicEvent {
  id: string;
  title: string;
  category: EventCategoryName;
  subType?: string; // Original sub-type
  subjectId?: string; // Reference to Subject id
  start: Date;
  end: Date;
  faculty?: string;
  description?: string;
  location?: string;
  attendees?: string[]; // Array of user IDs or names
}

export interface User {
  id: string;
  role: UserRole[];
  enrolledSubjects?: string[]; // Array of Subject IDs
  facultySubjects?: string[]; // Array of Subject IDs
  calendarFilters?: CalendarFilters;
}

export type UserRole = "student" | "faculty" | "admin" | "placement_coordinator" | "guest";

export interface CalendarFilters {
  categories: EventCategoryName[];
  subjects: string[]; // Array of Subject IDs
  dateRange?: { start?: Date; end?: Date };
  // userRole?: UserRole; // Simplified for now
  // faculty?: string; // Simplified for now
}

export type ColorCodingMode = "category" | "subject";
