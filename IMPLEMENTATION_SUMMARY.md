# Implementation Summary

## What Was Implemented

### 1. ✅ Subjects Page - Teacher Can Add Subjects

**Location**: `src/components/SubjectsPage.tsx`

**Features for Teachers**:
- **"Add Subject" button** appears at the top right (only for teachers/admins)
- Dialog form to create new subjects with:
  - Subject code (e.g., "WEBTECH")
  - Subject name (e.g., "Web Technologies")
  - Credits (number)
  - Semester (Winter/Summer)
  - Description (optional)
- View all subjects they've created
- Delete subjects they created

**Features for Students**:
- View all available subjects
- Search subjects by name or code
- See enrollment count per subject
- Enroll in subjects
- View enrolled status

**Data Source**: Fetches from `/api/subjects/` endpoint

### 2. ✅ Schedule Page - Database-Driven Schedules

**Location**: `src/components/SchedulePage.tsx`

**Features for Teachers**:
- **"Add Schedule" button** appears at the top right (only for teachers/admins)
- Dialog form to create new schedule entries with:
  - Select subject (from their subjects)
  - Day of week
  - Time (e.g., "08:00-09:40")
  - Room (e.g., "PK6 C303")
  - Class type (Lecture/Lab/Seminar/Practical)
  - Semester (e.g., "Winter 2025/26")
- View all schedules they've created

**Features for Students**:
- View weekly class schedule organized by day
- See all schedules from database
- View class details:
  - Subject name and code
  - Time
  - Room
  - Class type (Lecture/Lab/etc.)
- Filter by semester (future feature)

**Data Source**: Fetches from `/api/schedules/` endpoint

## How It Works

### Teacher Workflow

1. **Add Subject**:
   - Go to Subjects page
   - Click "Add Subject" button
   - Fill in subject details
   - Click "Create Subject"
   - Subject appears in the list

2. **Add Schedule**:
   - Go to Schedule page
   - Click "Add Schedule" button
   - Select a subject they teach
   - Set day, time, room, class type, semester
   - Click "Create Schedule"
   - Schedule appears in the weekly view

### Student Workflow

1. **View Subjects**:
   - Go to Subjects page
   - Browse all available subjects
   - Search if needed
   - Enroll in subjects

2. **View Schedules**:
   - Go to Schedule page
   - See all class schedules organized by day
   - View details for each class

## Database Structure

### Subjects Table
- `id`, `code`, `name`, `credits`, `semester`
- Linked to `teacher_id`
- Teachers can only edit/delete their own subjects

### Schedules Table
- `id`, `subject_id`, `day`, `time`, `room`, `class_type`, `semester`
- Linked to subjects
- Teachers can only create schedules for subjects they teach

## API Endpoints Used

- `GET /api/subjects/` - Get all subjects
- `POST /api/subjects/` - Create subject (teachers only)
- `DELETE /api/subjects/{id}` - Delete subject (teachers only)
- `GET /api/schedules/` - Get all schedules
- `POST /api/schedules/` - Create schedule (teachers only)

## Role-Based Access

- **Students**: Can view subjects and schedules, enroll in subjects
- **Teachers**: Can create/edit/delete subjects and schedules (for their subjects only)
- **Admins**: Can manage all subjects and schedules

## Testing

1. **As Teacher**:
   - Login: `teacher@tuke.sk` / `teacher123`
   - Create a subject on Subjects page
   - Create schedules on Schedule page

2. **As Student**:
   - Login: `student@tuke.sk` / `student123`
   - View subjects on Subjects page
   - View schedules on Schedule page
   - Enroll in subjects

