from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_active_user
from models.user import User, UserRole
from models.subject import Subject
from models.enrollment import Enrollment, EnrollmentStatus
from models.schedule import Schedule
from models.grade import Grade
from models.notification import Notification

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


# Response schemas
class DashboardSubject(BaseModel):
    id: int
    code: str
    name: str
    credits: int
    teacher_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class DashboardScheduleItem(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    day: str
    time: str
    room: str
    class_type: str
    
    class Config:
        from_attributes = True


class DashboardExam(BaseModel):
    id: int
    subject_code: str
    subject_name: str
    date: str
    time: str
    room: str
    type: str
    
    class Config:
        from_attributes = True


class DashboardNotification(BaseModel):
    id: int
    type: str
    title: str
    message: str
    read: bool
    created_at: str
    
    class Config:
        from_attributes = True


class DashboardNews(BaseModel):
    id: int
    title: str
    summary: str
    date: str
    category: str
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    enrolled_subjects: int
    total_credits: int
    average_grade: Optional[float] = None
    unread_notifications: int
    upcoming_exams: int


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get dashboard statistics for current user"""
    # Count enrolled subjects
    enrolled_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.status == EnrollmentStatus.CONFIRMED
    ).scalar() or 0
    
    # Calculate total credits (assume 6 credits per subject)
    total_credits = enrolled_count * 6
    
    # Calculate average grade
    grades = db.query(Grade).filter(Grade.student_id == current_user.id).all()
    avg_grade = None
    if grades:
        avg_grade = round(sum(g.numeric_grade for g in grades) / len(grades), 2)
    
    # Count unread notifications
    unread = db.query(func.count(Notification.id)).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).scalar() or 0
    
    return DashboardStats(
        enrolled_subjects=enrolled_count,
        total_credits=total_credits,
        average_grade=avg_grade,
        unread_notifications=unread,
        upcoming_exams=2  # Placeholder
    )


@router.get("/subjects", response_model=List[DashboardSubject])
def get_dashboard_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get enrolled subjects for dashboard"""
    if current_user.role == UserRole.STUDENT:
        # Get enrolled subjects
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.CONFIRMED
        ).all()
        
        subjects = []
        for enrollment in enrollments:
            if enrollment.subject:
                subjects.append(DashboardSubject(
                    id=enrollment.subject.id,
                    code=enrollment.subject.code,
                    name=enrollment.subject.name,
                    credits=enrollment.subject.credits,
                    teacher_name=enrollment.subject.teacher.full_name if enrollment.subject.teacher else None
                ))
        return subjects
    else:
        # Teachers see their own subjects
        teacher_subjects = db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
        return [
            DashboardSubject(
                id=s.id,
                code=s.code,
                name=s.name,
                credits=s.credits,
                teacher_name=current_user.full_name
            )
            for s in teacher_subjects
        ]


@router.get("/schedule", response_model=List[DashboardScheduleItem])
def get_dashboard_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get schedule for dashboard - today and upcoming classes"""
    if current_user.role == UserRole.STUDENT:
        # Get schedules for enrolled subjects
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.CONFIRMED
        ).all()
        
        subject_ids = [e.subject_id for e in enrollments]
        schedules = db.query(Schedule).filter(Schedule.subject_id.in_(subject_ids)).all() if subject_ids else []
    else:
        # Teachers see schedules for their subjects
        teacher_subjects = db.query(Subject).filter(Subject.teacher_id == current_user.id).all()
        subject_ids = [s.id for s in teacher_subjects]
        schedules = db.query(Schedule).filter(Schedule.subject_id.in_(subject_ids)).all() if subject_ids else []
    
    result = []
    for schedule in schedules:
        result.append(DashboardScheduleItem(
            id=schedule.id,
            subject_code=schedule.subject.code if schedule.subject else "",
            subject_name=schedule.subject.name if schedule.subject else "",
            day=schedule.day.value if hasattr(schedule.day, 'value') else str(schedule.day),
            time=schedule.time,
            room=schedule.room,
            class_type=schedule.class_type.value if hasattr(schedule.class_type, 'value') else str(schedule.class_type)
        ))
    
    return result


@router.get("/exams", response_model=List[DashboardExam])
def get_dashboard_exams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get upcoming exams for dashboard"""
    # Return sample exam data (in a real app, this would come from an exams table)
    if current_user.role == UserRole.STUDENT:
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.CONFIRMED
        ).limit(3).all()
        
        exams = []
        for i, enrollment in enumerate(enrollments):
            if enrollment.subject:
                exam_date = datetime.now() + timedelta(days=30 + i * 7)
                exams.append(DashboardExam(
                    id=i + 1,
                    subject_code=enrollment.subject.code,
                    subject_name=enrollment.subject.name,
                    date=exam_date.strftime("%B %d, %Y"),
                    time="09:00",
                    room=f"PK6 A{100 + i}",
                    type="Final Exam"
                ))
        return exams
    
    return []


@router.get("/notifications", response_model=List[DashboardNotification])
def get_dashboard_notifications(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get recent notifications for dashboard"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(limit).all()
    
    result = []
    for notif in notifications:
        result.append(DashboardNotification(
            id=notif.id,
            type=notif.type.value if hasattr(notif.type, 'value') else str(notif.type),
            title=notif.title,
            message=notif.message,
            read=notif.read,
            created_at=notif.created_at.strftime("%b %d, %Y %H:%M") if notif.created_at else ""
        ))
    
    return result


@router.get("/news", response_model=List[DashboardNews])
def get_dashboard_news(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get university news for dashboard"""
    # Return sample news data
    news = [
        DashboardNews(
            id=1,
            title="Winter Semester 2025/26 Registration Open",
            summary="Registration for the winter semester is now open. Please complete your enrollment by September 15.",
            date="November 15, 2025",
            category="Academic"
        ),
        DashboardNews(
            id=2,
            title="Library Extended Hours",
            summary="The university library will have extended hours during the exam period.",
            date="November 10, 2025",
            category="Services"
        ),
        DashboardNews(
            id=3,
            title="Career Fair Next Week",
            summary="Join us for the annual career fair featuring top tech companies.",
            date="November 8, 2025",
            category="Events"
        ),
        DashboardNews(
            id=4,
            title="New Computer Lab Opening",
            summary="A new state-of-the-art computer lab is opening in Building PK6.",
            date="November 5, 2025",
            category="Facilities"
        ),
    ]
    return news

