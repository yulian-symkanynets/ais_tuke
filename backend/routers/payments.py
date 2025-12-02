from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from auth import get_current_active_user
from models.user import User, UserRole
from models.payment import Payment, PaymentType, PaymentStatus, PaymentMethod

router = APIRouter(prefix="/api/payments", tags=["payments"])


class PaymentBase(BaseModel):
    payment_type: PaymentType
    description: str
    amount: float
    due_date: Optional[datetime] = None


class PaymentCreate(PaymentBase):
    user_id: Optional[int] = None


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    payment_method: Optional[PaymentMethod] = None
    paid_date: Optional[datetime] = None


class PaymentResponse(PaymentBase):
    id: int
    user_id: int
    status: PaymentStatus
    paid_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    invoice_number: Optional[str] = None
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payments - students see their own, admins see all"""
    if current_user.role == UserRole.STUDENT:
        payments = db.query(Payment).filter(Payment.user_id == current_user.id).all()
    else:
        payments = db.query(Payment).all()
    
    return payments


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create payment"""
    user_id = payment.user_id if current_user.role == UserRole.ADMIN and payment.user_id else current_user.id
    
    # Generate invoice number
    payment_count = db.query(Payment).count()
    invoice_number = f"INV-{datetime.now().year}-{payment_count + 1000:04d}"
    
    db_payment = Payment(
        user_id=user_id,
        payment_type=payment.payment_type,
        description=payment.description,
        amount=payment.amount,
        due_date=payment.due_date,
        status=PaymentStatus.PENDING,
        invoice_number=invoice_number
    )
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    
    return db_payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_update: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update payment"""
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if current_user.role == UserRole.STUDENT and db_payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = payment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payment, field, value)
    
    db.commit()
    db.refresh(db_payment)
    
    return db_payment


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete payment - only admins"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete payments")
    
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(db_payment)
    db.commit()
    return None
