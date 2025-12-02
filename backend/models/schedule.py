from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from database import Base


class DayOfWeek(str, enum.Enum):
    MONDAY = "Monday"
    TUESDAY = "Tuesday"
    WEDNESDAY = "Wednesday"
    THURSDAY = "Thursday"
    FRIDAY = "Friday"
    SATURDAY = "Saturday"
    SUNDAY = "Sunday"


class ClassType(str, enum.Enum):
    LECTURE = "Lecture"
    LAB = "Lab"
    SEMINAR = "Seminar"
    PRACTICAL = "Practical"


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    day = Column(SQLEnum(DayOfWeek), nullable=False)
    time = Column(String, nullable=False)
    room = Column(String, nullable=False)
    class_type = Column(SQLEnum(ClassType), default=ClassType.LECTURE, nullable=False)
    semester = Column(String, nullable=False)
    
    # Relationships with passive_deletes
    subject = relationship("Subject", back_populates="schedules", passive_deletes=True)
