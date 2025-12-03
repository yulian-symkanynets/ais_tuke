from sqlalchemy import Column, Integer, String, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from database import Base


class Semester(str, enum.Enum):
    WINTER = "Winter"
    SUMMER = "Summer"


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    credits = Column(Integer, nullable=False)
    semester = Column(SQLEnum(Semester), nullable=False)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships - cascade delete for child records
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="taught_subjects")
    enrollments = relationship("Enrollment", back_populates="subject", cascade="all, delete-orphan", passive_deletes=True)
    schedules = relationship("Schedule", back_populates="subject", cascade="all, delete-orphan", passive_deletes=True)
    grades = relationship("Grade", back_populates="subject", cascade="all, delete-orphan", passive_deletes=True)
    assignments = relationship("Assignment", back_populates="subject", cascade="all, delete-orphan", passive_deletes=True)
