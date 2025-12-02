# AIS TUKE - Setup Instructions

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment (if not already done):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Initialize the database with sample data:
```bash
python init_db.py
```

5. Start the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://127.0.0.1:8000`
API documentation: `http://127.0.0.1:8000/docs`

## Frontend Setup

1. Install dependencies (from project root):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Sample Accounts

After running `init_db.py`, you can use these accounts:

- **Student Account:**
  - Email: `student@tuke.sk`
  - Password: `student123`

- **Teacher Account:**
  - Email: `teacher@tuke.sk`
  - Password: `teacher123`

## Features

### Role-Based Access Control

- **Students** can:
  - View all subjects
  - Enroll in subjects
  - View their own grades, enrollments, payments, dormitory applications, and thesis
  - View notifications

- **Teachers** can:
  - Create, edit, and delete subjects
  - View all enrollments and manage them (approve/reject)
  - Create and manage grades for their subjects
  - Create schedules for their subjects
  - View all student data for their subjects

- **Admins** can:
  - All teacher capabilities
  - Manage all entities in the system
  - Create dormitories
  - Manage all users

### Available Pages

1. **Dashboard** - Overview of academic activities
2. **Subjects** - Browse and manage courses (role-dependent UI)
3. **Enrolment** - Manage course enrollments
4. **Schedule** - View class schedules
5. **Grades** - View academic grades
6. **Dormitory** - Manage accommodation applications
7. **Thesis** - Track thesis progress
8. **Payments** - Manage payments and fees
9. **Notifications** - View and manage notifications

## API Endpoints

All API endpoints are prefixed with `/api/`:

- `/api/auth/login` - User login
- `/api/auth/register` - User registration
- `/api/auth/me` - Get current user info
- `/api/subjects/` - CRUD for subjects
- `/api/enrollments/` - CRUD for enrollments
- `/api/schedules/` - CRUD for schedules
- `/api/grades/` - CRUD for grades
- `/api/payments/` - CRUD for payments
- `/api/dormitories/` - CRUD for dormitories
- `/api/theses/` - CRUD for theses
- `/api/notifications/` - CRUD for notifications

See `http://127.0.0.1:8000/docs` for full API documentation.

