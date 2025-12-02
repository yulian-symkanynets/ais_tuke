from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class GradeLetter(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    FX = "FX"


class Grade(Base):
    __tablename__ = "grades"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    grade = Column(SQLEnum(GradeLetter), nullable=False)
    numeric_grade = Column(Float, nullable=False)
    semester = Column(String, nullable=False)
    date = Column(DateTime, server_default=func.now())
    notes = Column(String, nullable=True)
    
    # Relationships with passive_deletes
    student = relationship("User", foreign_keys=[student_id], back_populates="grades", passive_deletes=True)
    subject = relationship("Subject", back_populates="grades", passive_deletes=True)
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="given_grades")
