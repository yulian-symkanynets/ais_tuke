from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class EnrollmentStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    WITHDRAWN = "withdrawn"
    REJECTED = "rejected"


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.PENDING, nullable=False)
    enrolled_date = Column(DateTime, server_default=func.now())
    semester = Column(String, nullable=False)
    
    # Relationships with passive_deletes for cascade
    student = relationship("User", foreign_keys=[student_id], back_populates="enrollments", passive_deletes=True)
    subject = relationship("Subject", back_populates="enrollments", passive_deletes=True)
