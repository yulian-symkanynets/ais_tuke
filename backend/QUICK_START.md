# AIS TUKE Backend - Quick Start Guide

## Prerequisites
- Python 3.13+
- pip

## Setup

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Create and activate virtual environment
```bash
python -m venv venv
source venv/bin/activate  # On macOS/Linux
# or
.\venv\Scripts\activate   # On Windows
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize database with sample data
```bash
python init_db.py
```

### 5. Start the server
```bash
uvicorn main:app --reload
```

The API will be available at: http://127.0.0.1:8000

## API Documentation
- Swagger UI: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Test Accounts

| Role    | Email             | Password    |
|---------|-------------------|-------------|
| Student | student@tuke.sk   | student123  |
| Teacher | teacher@tuke.sk   | teacher123  |
| Admin   | admin@tuke.sk     | admin123    |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Subjects
- `GET /api/subjects/` - List all subjects
- `POST /api/subjects/` - Create subject (teachers only)
- `PUT /api/subjects/{id}` - Update subject (teachers only)
- `DELETE /api/subjects/{id}` - Delete subject (teachers only)

### Enrollments
- `GET /api/enrollments/` - List enrollments
- `POST /api/enrollments/` - Enroll in subject (students only)
- `DELETE /api/enrollments/{id}` - Withdraw from subject

### Schedules
- `GET /api/schedules/` - List schedules
- `POST /api/schedules/` - Create schedule (teachers only)
- `PUT /api/schedules/{id}` - Update schedule (teachers only)
- `DELETE /api/schedules/{id}` - Delete schedule (teachers only)

### Grades
- `GET /api/grades/` - List grades
- `POST /api/grades/` - Add grade (teachers only)
- `PUT /api/grades/{id}` - Update grade (teachers only)
- `DELETE /api/grades/{id}` - Delete grade (teachers only)

### Payments
- `GET /api/payments/` - List payments
- `POST /api/payments/` - Create payment
- `PUT /api/payments/{id}` - Update payment

### Dormitories
- `GET /api/dormitories/` - List dormitories
- `POST /api/dormitories/applications` - Apply for dormitory (students only)
- `GET /api/dormitories/applications` - List applications

### Theses
- `GET /api/theses/` - List theses
- `POST /api/theses/` - Register thesis (students only)
- `PUT /api/theses/{id}` - Update thesis

### Notifications
- `GET /api/notifications/` - List notifications
- `PUT /api/notifications/{id}/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Project Structure

```
backend/
├── __init__.py
├── main.py              # FastAPI app entry point
├── database.py          # Database configuration
├── auth.py              # Authentication utilities
├── init_db.py           # Database initialization script
├── requirements.txt     # Python dependencies
├── models/              # SQLAlchemy models
│   ├── __init__.py
│   ├── user.py
│   ├── subject.py
│   ├── enrollment.py
│   ├── schedule.py
│   ├── grade.py
│   ├── payment.py
│   ├── dormitory.py
│   ├── thesis.py
│   └── notification.py
├── routers/             # API route handlers
│   ├── __init__.py
│   ├── auth.py
│   ├── subjects.py
│   ├── enrollments.py
│   ├── schedules.py
│   ├── grades.py
│   ├── payments.py
│   ├── dormitories.py
│   ├── theses.py
│   └── notifications.py
└── schemas/             # Pydantic schemas
    ├── __init__.py
    ├── user.py
    ├── subject.py
    └── enrollment.py
```

## Role-Based Access

### Students can:
- View all subjects
- Enroll in subjects
- View their own enrollments, grades, payments
- Apply for dormitories
- Register thesis
- View notifications

### Teachers can:
- Create, update, delete subjects (their own)
- Create, update, delete schedules (for their subjects)
- Add, update, delete grades (for their subjects)
- View all enrollments

### Admins can:
- All teacher permissions
- Manage dormitories
- Delete any resource
