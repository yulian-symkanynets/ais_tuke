from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=False)
    max_points = Column(Float, default=100.0)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    subject = relationship("Subject", back_populates="assignments", passive_deletes=True)
    teacher = relationship("User", back_populates="created_assignments", passive_deletes=True)
    submissions = relationship("StudentSubmission", back_populates="assignment", cascade="all, delete-orphan", passive_deletes=True)


class StudentSubmission(Base):
    __tablename__ = "student_submissions"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    submitted_at = Column(DateTime, server_default=func.now())
    file_url = Column(String, nullable=True)
    text_answer = Column(Text, nullable=True)
    grade = Column(Float, nullable=True)
    feedback = Column(Text, nullable=True)
    
    # Relationships
    assignment = relationship("Assignment", back_populates="submissions", passive_deletes=True)
    student = relationship("User", back_populates="submissions", passive_deletes=True)

