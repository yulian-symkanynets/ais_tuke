from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from models.user import User
from models.subject import Subject
from models.enrollment import Enrollment
from models.schedule import Schedule
from models.grade import Grade
from models.payment import Payment
from models.dormitory import Dormitory, DormitoryApplication
from models.thesis import Thesis
from models.notification import Notification

# Import routers
from routers import auth, subjects, enrollments, schedules, grades, payments, dormitories, theses, notifications
from routers import dashboard

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AIS TUKE - Academic Information System",
    description="Backend API for the AIS TUKE student portal",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(subjects.router)
app.include_router(enrollments.router)
app.include_router(schedules.router)
app.include_router(grades.router)
app.include_router(payments.router)
app.include_router(dormitories.router)
app.include_router(theses.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Welcome to AIS TUKE API", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "api": "AIS TUKE"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
