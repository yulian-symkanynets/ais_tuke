"""Initialize database with sample data"""
import os
from pathlib import Path
from datetime import datetime, timedelta

# Remove existing database to start fresh
db_path = Path("./ais_tuke.db")
if db_path.exists():
    os.remove(db_path)
    print(f"Removed existing database: {db_path}")

from database import SessionLocal, engine, Base
from models.user import User, UserRole
from models.subject import Subject, Semester
from models.dormitory import Dormitory
from models.schedule import Schedule, DayOfWeek, ClassType
from models.enrollment import Enrollment, EnrollmentStatus
from models.grade import Grade, GradeLetter
from models.payment import Payment, PaymentType, PaymentStatus
from models.notification import Notification, NotificationType
import bcrypt


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    db = SessionLocal()
    
    try:
        # Create users
        print("Creating users...")
        
        student = User(
            email="student@tuke.sk",
            hashed_password=get_password_hash("student123"),
            full_name="John Student",
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student)
        
        student2 = User(
            email="student2@tuke.sk",
            hashed_password=get_password_hash("student123"),
            full_name="Jane Doe",
            role=UserRole.STUDENT,
            is_active=True
        )
        db.add(student2)
        
        teacher = User(
            email="teacher@tuke.sk",
            hashed_password=get_password_hash("teacher123"),
            full_name="Dr. Maria Teacher",
            role=UserRole.TEACHER,
            is_active=True
        )
        db.add(teacher)
        
        admin = User(
            email="admin@tuke.sk",
            hashed_password=get_password_hash("admin123"),
            full_name="Admin User",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        
        db.commit()
        db.refresh(student)
        db.refresh(student2)
        db.refresh(teacher)
        db.refresh(admin)
        print(f"  Created student (id={student.id}), student2 (id={student2.id}), teacher (id={teacher.id}), admin (id={admin.id})")
        
        # Create subjects
        print("Creating subjects...")
        subjects_data = [
            {"code": "WEBTECH", "name": "Web Technologies", "credits": 6, "semester": Semester.WINTER, "description": "Introduction to web development including HTML, CSS, JavaScript, and modern frameworks", "teacher_id": teacher.id},
            {"code": "DBSYS", "name": "Database Systems", "credits": 5, "semester": Semester.WINTER, "description": "SQL, database design, normalization, and database management systems", "teacher_id": teacher.id},
            {"code": "PROG101", "name": "Programming Fundamentals", "credits": 6, "semester": Semester.WINTER, "description": "Introduction to programming concepts using Python", "teacher_id": teacher.id},
            {"code": "ALGO", "name": "Algorithms and Data Structures", "credits": 6, "semester": Semester.SUMMER, "description": "Algorithm design, analysis, and common data structures", "teacher_id": teacher.id},
            {"code": "NETW", "name": "Computer Networks", "credits": 5, "semester": Semester.SUMMER, "description": "Network protocols, architecture, and security", "teacher_id": teacher.id},
        ]
        
        created_subjects = []
        for subj_data in subjects_data:
            subj = Subject(**subj_data)
            db.add(subj)
            created_subjects.append(subj)
        
        db.commit()
        for subj in created_subjects:
            db.refresh(subj)
        print(f"  Created {len(created_subjects)} subjects")
        
        # Create schedules
        print("Creating schedules...")
        schedules_data = [
            {"subject_id": created_subjects[0].id, "day": DayOfWeek.MONDAY, "time": "08:00-09:40", "room": "PK6 C303", "class_type": ClassType.LECTURE, "semester": "Winter 2025/26"},
            {"subject_id": created_subjects[0].id, "day": DayOfWeek.WEDNESDAY, "time": "10:00-11:40", "room": "PK6 Lab1", "class_type": ClassType.LAB, "semester": "Winter 2025/26"},
            {"subject_id": created_subjects[1].id, "day": DayOfWeek.TUESDAY, "time": "08:00-09:40", "room": "PK6 B201", "class_type": ClassType.LECTURE, "semester": "Winter 2025/26"},
            {"subject_id": created_subjects[1].id, "day": DayOfWeek.THURSDAY, "time": "10:00-11:40", "room": "PK6 Lab2", "class_type": ClassType.LAB, "semester": "Winter 2025/26"},
            {"subject_id": created_subjects[2].id, "day": DayOfWeek.THURSDAY, "time": "14:00-15:40", "room": "PK6 A101", "class_type": ClassType.LECTURE, "semester": "Winter 2025/26"},
            {"subject_id": created_subjects[2].id, "day": DayOfWeek.FRIDAY, "time": "08:00-09:40", "room": "PK6 Lab3", "class_type": ClassType.LAB, "semester": "Winter 2025/26"},
        ]
        
        for sched_data in schedules_data:
            sched = Schedule(**sched_data)
            db.add(sched)
        
        db.commit()
        print(f"  Created {len(schedules_data)} schedule entries")
        
        # Create enrollments for student
        print("Creating enrollments...")
        for subj in created_subjects[:3]:
            enrollment = Enrollment(
                student_id=student.id,
                subject_id=subj.id,
                semester="Winter 2025/26",
                status=EnrollmentStatus.CONFIRMED
            )
            db.add(enrollment)
        
        # Also enroll student2 in some subjects
        for subj in created_subjects[:2]:
            enrollment = Enrollment(
                student_id=student2.id,
                subject_id=subj.id,
                semester="Winter 2025/26",
                status=EnrollmentStatus.CONFIRMED
            )
            db.add(enrollment)
        
        db.commit()
        print(f"  Created enrollments for students")
        
        # Create grades
        print("Creating grades...")
        grades_data = [
            {"student_id": student.id, "subject_id": created_subjects[0].id, "teacher_id": teacher.id, "grade": GradeLetter.A, "numeric_grade": 1.0, "semester": "Winter 2024/25", "notes": "Excellent work"},
            {"student_id": student.id, "subject_id": created_subjects[1].id, "teacher_id": teacher.id, "grade": GradeLetter.B, "numeric_grade": 1.5, "semester": "Winter 2024/25", "notes": "Very good"},
            {"student_id": student2.id, "subject_id": created_subjects[0].id, "teacher_id": teacher.id, "grade": GradeLetter.C, "numeric_grade": 2.0, "semester": "Winter 2024/25", "notes": "Good"},
        ]
        
        for grade_data in grades_data:
            grade = Grade(**grade_data)
            db.add(grade)
        
        db.commit()
        print(f"  Created {len(grades_data)} grades")
        
        # Create dormitories
        print("Creating dormitories...")
        dormitories_data = [
            {"name": "Jedlíkova", "address": "Jedlíkova 5, Košice", "available_rooms": 25, "total_rooms": 100, "monthly_rent": 85.0, "amenities": "WiFi, Laundry, Kitchen, Study rooms"},
            {"name": "Boženy Němcovej", "address": "Boženy Němcovej 10, Košice", "available_rooms": 15, "total_rooms": 80, "monthly_rent": 95.0, "amenities": "WiFi, Gym, Kitchen, Parking"},
            {"name": "Medická", "address": "Medická 2, Košice", "available_rooms": 30, "total_rooms": 120, "monthly_rent": 75.0, "amenities": "WiFi, Laundry, Kitchen"},
        ]
        
        for dorm_data in dormitories_data:
            dorm = Dormitory(**dorm_data)
            db.add(dorm)
        
        db.commit()
        print(f"  Created {len(dormitories_data)} dormitories")
        
        # Create payments
        print("Creating payments...")
        payments_data = [
            {"user_id": student.id, "payment_type": PaymentType.TUITION, "description": "Tuition Fee - Winter 2025/26", "amount": 500.0, "status": PaymentStatus.PENDING, "due_date": datetime.now() + timedelta(days=30), "invoice_number": "INV-2025-0001"},
            {"user_id": student.id, "payment_type": PaymentType.DORMITORY, "description": "Dormitory Fee - October 2025", "amount": 85.0, "status": PaymentStatus.PAID, "paid_date": datetime.now() - timedelta(days=5), "invoice_number": "INV-2025-0002"},
            {"user_id": student.id, "payment_type": PaymentType.ADMINISTRATIVE, "description": "Student Card Fee", "amount": 10.0, "status": PaymentStatus.PAID, "paid_date": datetime.now() - timedelta(days=60), "invoice_number": "INV-2025-0003"},
        ]
        
        for payment_data in payments_data:
            payment = Payment(**payment_data)
            db.add(payment)
        
        db.commit()
        print(f"  Created {len(payments_data)} payments")
        
        # Create notifications
        print("Creating notifications...")
        notifications_data = [
            {"user_id": student.id, "type": NotificationType.GRADE, "title": "New Grade Posted", "message": "Your grade for Web Technologies has been posted: A (1.0)"},
            {"user_id": student.id, "type": NotificationType.SCHEDULE, "title": "Schedule Change", "message": "Database Systems lecture moved to room B202 starting next week."},
            {"user_id": student.id, "type": NotificationType.PAYMENT, "title": "Payment Reminder", "message": "Your tuition fee is due in 30 days. Please make the payment on time."},
            {"user_id": student.id, "type": NotificationType.ENROLMENT, "title": "Enrollment Confirmed", "message": "Your enrollment in Programming Fundamentals has been confirmed."},
            {"user_id": student.id, "type": NotificationType.INFO, "title": "Library Hours Extended", "message": "The university library will be open 24/7 during the exam period."},
        ]
        
        for notif_data in notifications_data:
            notif = Notification(**notif_data)
            db.add(notif)
        
        db.commit()
        print(f"  Created {len(notifications_data)} notifications")
        
        print("\n" + "="*50)
        print("Database initialized successfully!")
        print("="*50)
        print("\nTest accounts:")
        print("  Student: student@tuke.sk / student123")
        print("  Student2: student2@tuke.sk / student123")
        print("  Teacher: teacher@tuke.sk / teacher123")
        print("  Admin:   admin@tuke.sk / admin123")
        print("\nStart the server with: uvicorn main:app --reload")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
