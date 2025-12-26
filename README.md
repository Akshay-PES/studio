# Jnanodaya School - The Unified Academic Planner

Welcome to the Jnanodaya School Academic Planner, a modern, streamlined application built to manage and display school-wide event schedules in a clear, interactive, and accessible way. Built with Next.js, Firebase, and Tailwind CSS, this platform serves students, faculty, and administrators.

![Jnanodaya School Planner Screenshot](https://placehold.co/800x400.png)

---

## 1. Core Concepts

This application is designed around two main user experiences:

*   **Public Calendar View**: An interactive, filterable calendar for students and parents to view all academic events.
*   **Admin Dashboard**: A secure, role-based portal for school administrators to manage all data, including events, subjects, and categories.

## 2. Key Features

### For Students & Public View

*   **Central Landing Page**: A welcoming entry point where users can select their standard to view the relevant calendar.
*   **Interactive Monthly Calendar**: A clean, responsive calendar that displays all events. Events are color-coded for at-a-glance understanding.
*   **Detailed Event Popups**: Clicking on any event reveals a dialog with comprehensive details, including time, location, subject, and description.
*   **Powerful Filtering System**: A persistent sidebar allows users to create a personalized view by filtering events based on:
    *   Event Category (e.g., Academics, Examination)
    *   Event Sub-Type (e.g., Unit Test, Holiday)
    *   Standard (e.g., 1st, 2nd, 10th)
    *   Global Subjects (e.g., Mathematics, Science)
    *   Class Section (e.g., Section A, Section B)
    *   Custom Date Ranges
*   **Dynamic Color-Coding**: Users can switch between color-coding events by **Category** or by **Subject**.

### For Administrators

*   **Secure Role-Based Access**:
    *   **Super Admin** (e.g., Principal): Has full control over the entire system, including managing global settings like event categories.
    *   **Department Admin** (e.g., Class Teacher): Manages events and views data specific to their assigned standard.
*   **Comprehensive Admin Dashboard**: A tab-based interface for all management tasks:
    *   **Manage Events**: Create, update, and delete events for any standard (Super Admin) or a specific standard (Department Admin).
    *   **Manage Global Subjects**: Create, edit, and delete subjects that are shared across all standards. Each subject is automatically assigned a unique color for easy identification.
    *   **Manage Global Categories**: Super Admins can define event categories and their associated sub-types (e.g., "Examination" category with "Unit Test" and "Final Exam" as sub-types).
    *   **Generate PDF Reports**: Filter events by category, sub-type, and date range to generate and download professionally branded PDF reports.
*   **Real-Time Updates**: The system uses real-time listeners to ensure the calendar and admin data are always synchronized with the database.

## 3. Tech Stack

*   **Framework**: Next.js (with App Router)
*   **Database**: Google Firestore
*   **Authentication**: Firebase Authentication
*   **Styling**: Tailwind CSS
*   **UI Components**: shadcn/ui, Lucide React
*   **Deployment**: Firebase Hosting

---

## 4. Admin Setup & Guide

To get started with administering the Jnanodaya School planner, follow these steps.

### Step 1: Create Admin Users in Firebase

You must create user accounts in the Firebase Console first.

1.  Navigate to your Firebase project.
2.  Go to **Authentication** -> **Users** tab and click **"Add user"**.
3.  Create the users you need. For example:
    *   A **Super Admin**: `principal@jsb.edu`
    *   A **Department Admin**: `teacher.std5@jsb.edu`

### Step 2: Assign Roles in Firestore

After creating the users, you must assign them roles in your Firestore database.

1.  Go to your **Firestore Database**.
2.  Select the `users` collection.
3.  Click **"Add document"**.
4.  For the **Document ID**, paste the UID of the user you created in Authentication.
5.  Add the fields for the user.

**Example for Super Admin (Principal):**

*   `email` (string): `principal@jsb.edu`
*   `role` (string): `super_admin`
    *(Do not add a `departmentId` for the super_admin)*

**Example for Department Admin (5th Standard Teacher):**

*   `email` (string): `teacher.std5@jsb.edu`
*   `role` (string): `department_admin`
*   `departmentId` (string): `std-5`

### Step 3: Log In and Manage

Once the roles are assigned, the users can log in through the **"Admin Login"** link on the homepage. The application will automatically detect their role and grant them the appropriate permissions and dashboard view.

---

This README provides a complete overview of the Jnanodaya School Academic Planner. For a more student-focused guide on how to use the public calendar and its features, please refer to the `docs/student-guide.md` file.
