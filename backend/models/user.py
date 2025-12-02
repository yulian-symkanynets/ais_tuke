from sqlalchemy import Boolean, Column, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships - cascade delete for owned records
    enrollments = relationship("Enrollment", back_populates="student", foreign_keys="Enrollment.student_id", cascade="all, delete-orphan", passive_deletes=True)
    grades = relationship("Grade", back_populates="student", foreign_keys="Grade.student_id", cascade="all, delete-orphan", passive_deletes=True)
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    dormitory_applications = relationship("DormitoryApplication", back_populates="student", cascade="all, delete-orphan", passive_deletes=True)
    theses = relationship("Thesis", back_populates="student", cascade="all, delete-orphan", passive_deletes=True)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan", passive_deletes=True)
    
    # For teachers - no cascade delete (subjects should remain if teacher is deleted)
    taught_subjects = relationship("Subject", back_populates="teacher", foreign_keys="Subject.teacher_id")
    given_grades = relationship("Grade", back_populates="teacher", foreign_keys="Grade.teacher_id")
