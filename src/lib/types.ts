
export interface EventCategory {
  id: string; // Firestore document ID
  name: string; // User-defined category name
  color: string; // Hex color code
  subTypes?: string[]; // Array of sub-type names
}

export interface Subject {
  id: string; // Firestore document ID
  name: string;
  color: string; // Hex color code
  departmentId: string; // e.g., "std-1", "std-2"
  semester?: number; // Optional standard number
}

export interface AcademicEvent {
  id: string;
  title: string;
  category: string; // Stores the NAME of the category
  subType?: string;
  subjectId?: string; // Reference to Subject id
  semester?: number;
  section?: string;
  start: Date;
  end: Date;
  faculty?: string;
  description?: string;
  location?: string;
  attendees?: string[]; // Array of user IDs or names
  departmentId: string; // e.g., "std-1", "std-2"
}

export interface UserProfile {
  uid: string;
  email: string;
  role: "department_admin" | "super_admin";
  departmentId?: string; // e.g., "std-1", "std-2". Optional for super_admin
}

// Kept for legacy compatibility if needed, but UserProfile is preferred
export interface User {
  id: string;
  role: UserRole[];
  enrolledSubjects?: string[]; // Array of Subject IDs
  facultySubjects?: string[]; // Array of Subject IDs
  calendarFilters?: CalendarFilters;
}

export type UserRole = "student" | "faculty" | "admin" | "placement_coordinator" | "guest";

export interface CalendarFilters {
  categories: string[]; // Array of category names
  subjects: string[]; // Array of Subject IDs
  subTypes: string[]; // Array of selected sub-types
  semesters: number[];
  sections: string[];
  dateRange?: { start?: Date; end?: Date };
}

export type ColorCodingMode = "category" | "subject";
