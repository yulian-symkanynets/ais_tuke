from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class Dormitory(Base):
    __tablename__ = "dormitories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    available_rooms = Column(Integer, default=0)
    total_rooms = Column(Integer, nullable=False)
    monthly_rent = Column(Float, nullable=False)
    amenities = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships - cascade delete applications when dormitory is deleted
    applications = relationship("DormitoryApplication", back_populates="dormitory", cascade="all, delete-orphan", passive_deletes=True)


class ApplicationStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class DormitoryApplication(Base):
    __tablename__ = "dormitory_applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dormitory_id = Column(Integer, ForeignKey("dormitories.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String, nullable=True)
    room_type = Column(String, nullable=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    move_in_date = Column(DateTime, nullable=True)
    deposit_paid = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    student = relationship("User", back_populates="dormitory_applications", passive_deletes=True)
    dormitory = relationship("Dormitory", back_populates="applications", passive_deletes=True)
