from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class PaymentType(str, enum.Enum):
    TUITION = "Tuition Fee"
    DORMITORY = "Dormitory"
    ADMINISTRATIVE = "Administrative Fee"
    DORMITORY_DEPOSIT = "Dormitory Deposit"
    OTHER = "Other"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    WAIVED = "waived"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    BANK_TRANSFER = "Bank Transfer"
    CREDIT_CARD = "Credit/Debit Card"
    CASH = "Cash"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    payment_type = Column(SQLEnum(PaymentType), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    due_date = Column(DateTime, nullable=True)
    paid_date = Column(DateTime, nullable=True)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    invoice_number = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payments", passive_deletes=True)
