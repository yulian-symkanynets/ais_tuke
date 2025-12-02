from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class ThesisType(str, enum.Enum):
    BACHELOR = "Bachelor Thesis"
    MASTER = "Master Thesis"
    DOCTORAL = "Doctoral Thesis"


class ThesisStatus(str, enum.Enum):
    REGISTERED = "Registered"
    IN_PROGRESS = "In Progress"
    SUBMITTED = "Submitted"
    DEFENDED = "Defended"
    COMPLETED = "Completed"


class Thesis(Base):
    __tablename__ = "theses"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    thesis_type = Column(SQLEnum(ThesisType), nullable=False)
    status = Column(SQLEnum(ThesisStatus), default=ThesisStatus.REGISTERED, nullable=False)
    supervisor_name = Column(String, nullable=False)
    consultant_name = Column(String, nullable=True)
    department = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    submission_deadline = Column(DateTime, nullable=False)
    defense_date = Column(DateTime, nullable=True)
    progress = Column(Float, default=0.0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    student = relationship("User", back_populates="theses", passive_deletes=True)
