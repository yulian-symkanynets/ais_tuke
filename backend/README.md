# AIS TUKE Backend API

Backend API for the AIS TUKE Student Portal Dashboard with DuckDB database integration.

## Features

- **Complete REST API** for all portal pages
- **DuckDB Database** for data persistence
- **FastAPI Framework** with automatic API documentation
- **CORS Support** for frontend integration
- **Type-safe models** using Pydantic

## API Endpoints

### Health & Meta
- `GET /health` - Health check
- `GET /api/semesters` - List available semesters

### Grades
- `GET /api/grades` - List all grades (optional filter: `?semester=Winter 2025/26`)
- `GET /api/grades/stats` - Get grade statistics

### Subjects
- `GET /api/subjects` - List all subjects

### Schedule
- `GET /api/schedule` - Get weekly schedule

### Enrolment
- `GET /api/enrolment/periods` - List enrolment periods
- `GET /api/enrolment/subjects` - List enrolled subjects

### Thesis
- `GET /api/thesis` - Get thesis information
- `GET /api/thesis/milestones` - Get thesis milestones
- `GET /api/thesis/documents` - Get thesis documents

### Dormitory
- `GET /api/dormitory/list` - List available dormitories
- `GET /api/dormitory/application` - Get current application

### Payments
- `GET /api/payments` - List all payments
- `GET /api/payments/balance` - Get payment balance

### Notifications
- `GET /api/notifications` - List notifications

### News
- `GET /api/news` - List news items

### Dashboard
- `GET /api/dashboard/exams` - Get upcoming exams
- `GET /api/dashboard/subjects` - Get active subjects (optional: `?count=4`)
- `GET /api/dashboard/schedule` - Get this week's schedule (optional: `?total=5`)
- `GET /api/dashboard/notifications` - Get recent notifications (optional: `?count=5`)
- `GET /api/dashboard/news` - Get news items (optional: `?count=4`)

### Profile & Settings
- `GET /api/profile` - Get student profile
- `GET /api/settings` - Get user settings

## Installation

1. Install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

2. Initialize the database:
```bash
python database.py
```

## Running the Server

Start the development server:
```bash
cd backend
python main.py
```

The API will be available at `http://127.0.0.1:8000`

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: http://127.0.0.1:8000/docs
- **ReDoc**: http://127.0.0.1:8000/redoc

## Database

The application uses **DuckDB**, a fast in-process SQL database. The database file is created at `backend/ais_tuke.db`.

To reset the database, simply delete the file and run `python database.py` again.

## Development

The backend is built with:
- **FastAPI** 0.115.0 - Modern web framework
- **Uvicorn** 0.32.0 - ASGI server
- **Pydantic** 2.9.2 - Data validation
- **DuckDB** 1.1.3 - Embedded database

## CORS Configuration

The API allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:5173`
- `http://localhost:3000`
- `http://127.0.0.1:3000`
