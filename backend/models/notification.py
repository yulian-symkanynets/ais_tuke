from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class NotificationType(str, enum.Enum):
    GRADE = "grade"
    ENROLMENT = "enrolment"
    SCHEDULE = "schedule"
    DEADLINE = "deadline"
    MATERIAL = "material"
    INFO = "info"
    PAYMENT = "payment"
    DORMITORY = "dormitory"
    THESIS = "thesis"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(NotificationType), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications", passive_deletes=True)
