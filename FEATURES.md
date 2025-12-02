# AIS TUKE - Features Overview

## Role-Based Functionality

### 🎓 Student Features

#### Subjects Page
- ✅ View all available subjects
- ✅ Search subjects by name or code
- ✅ See enrolled student count
- ✅ Enroll in subjects
- ✅ View enrollment status

#### Schedule Page
- ✅ View weekly class schedule from database
- ✅ See schedules organized by day
- ✅ View class details: time, room, subject, type
- ✅ Filter by semester

#### Other Pages
- View own grades
- View own enrollments
- View dormitory applications
- View thesis progress
- View payments
- View notifications

### 👨‍🏫 Teacher Features

#### Subjects Page
- ✅ Create new subjects
- ✅ View all subjects
- ✅ Delete subjects they created
- ✅ See enrolled student count per subject

#### Schedule Page
- ✅ Create new schedule entries
- ✅ View all schedules
- ✅ Manage class schedules for their subjects
- ✅ Set day, time, room, and class type

#### Other Pages
- Manage enrollments (approve/reject)
- Create and manage grades
- View all student data for their subjects

### 🔑 Authentication

- ✅ Login/Register system
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Protected routes

## Database Integration

All pages now fetch data from the backend API:

- ✅ **Subjects** - `/api/subjects/`
- ✅ **Schedules** - `/api/schedules/`
- ✅ **Enrollments** - `/api/enrollments/`
- ✅ **Grades** - `/api/grades/`
- ✅ **Payments** - `/api/payments/`
- ✅ **Dormitories** - `/api/dormitories/`
- ✅ **Theses** - `/api/theses/`
- ✅ **Notifications** - `/api/notifications/`

## Key Features

1. **Dynamic Data Loading**: All data is fetched from the database in real-time
2. **Role-Based UI**: Different interfaces for students vs teachers
3. **CRUD Operations**: Full Create, Read, Update, Delete for authorized users
4. **Responsive Design**: Works on desktop and mobile devices
5. **Search & Filter**: Easy to find subjects and schedules

