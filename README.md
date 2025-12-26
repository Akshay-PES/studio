# Jnanodaya school: The Unified Academic Planner

Welcome to Jnanodaya school, a modern, streamlined academic event planner built with Next.js, Firebase, and Tailwind CSS. This application is designed to help academic departments at PES University manage and display their event schedules in a clear, interactive, and accessible way.

## Key Features

- **Multi-Department Calendars**: A central landing page allows students, faculty, and staff to select their specific department and view a dedicated calendar of events.
- **Interactive Calendar View**: A clean, monthly calendar displays all academic events, color-coded for easy identification. Users can click on any event to see detailed information.
- **Powerful Filtering**: A comprehensive sidebar allows users to filter the calendar view by:
    - Event Category (e.g., Academics, Placement)
    - Event Sub-Type (e.g., ISA, Workshop)
    - Semester or Trimester
    - Department-specific Subjects
    - Section
    - Custom Date Ranges
- **Dedicated Admin Dashboard**: Authorized department administrators have a secure portal to:
    - **Manage Events**: Create, update, and delete events for their department.
    - **Manage Subjects**: Define subjects and map them to specific semesters.
    - **Manage Categories**: Globally manage event categories and their associated sub-types (for authorized admins).
    - **Generate PDF Reports**: Download filtered lists of events as professionally branded PDF documents.
- **Real-Time Data**: The application uses real-time Firebase listeners to ensure the calendar and filter options are always up-to-date with the latest information from the database.
- **Responsive Design**: The entire application, from the public calendar to the admin dashboard, is designed to be fully functional and user-friendly on both desktop and mobile devices.

## Tech Stack

- **Framework**: Next.js (with App Router)
- **Database**: Google Firestore
- **Authentication**: Firebase Authentication
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Deployment**: Firebase Hosting
