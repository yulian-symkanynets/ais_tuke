from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from auth import get_current_active_user, require_admin
from models.user import User, UserRole
from models.payment import Payment, PaymentType, PaymentStatus, PaymentMethod
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/payments", tags=["Payments"])


# ============== SCHEMAS ==============

class PaymentBase(BaseModel):
    payment_type: PaymentType
    description: str
    amount: float
    due_date: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(PaymentBase):
    user_id: int  # Required for admin to create payment for a user


class PaymentResponse(BaseModel):
    id: int
    user_id: int
    payment_type: PaymentType
    description: str
    amount: float
    status: PaymentStatus
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    payment_method: Optional[PaymentMethod] = None
    invoice_number: Optional[str] = None
    created_at: Optional[datetime] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class PaymentPayRequest(BaseModel):
    payment_method: PaymentMethod
    
    model_config = ConfigDict(from_attributes=True)


# ============== HELPER FUNCTIONS ==============

def enrich_payment(payment: Payment, db: Session) -> PaymentResponse:
    user = db.query(User).filter(User.id == payment.user_id).first()
    return PaymentResponse(
        id=payment.id,
        user_id=payment.user_id,
        payment_type=payment.payment_type,
        description=payment.description,
        amount=payment.amount,
        status=payment.status,
        due_date=payment.due_date,
        paid_date=payment.paid_date,
        payment_method=payment.payment_method,
        invoice_number=payment.invoice_number,
        created_at=payment.created_at,
        user_name=user.full_name if user else None,
        user_email=user.email if user else None
    )


# ============== ENDPOINTS ==============

@router.get("/me", response_model=List[PaymentResponse])
def get_my_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's payments"""
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    return [enrich_payment(p, db) for p in payments]


@router.get("/all", response_model=List[PaymentResponse])
def get_all_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all payments (admin only)"""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    return [enrich_payment(p, db) for p in payments]


@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get payments - students see their own, admins see all"""
    if current_user.role == UserRole.ADMIN:
        payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    else:
        payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    
    return [enrich_payment(p, db) for p in payments]


@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payment: PaymentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a payment request for a user (admin only)"""
    # Verify target user exists
    target_user = db.query(User).filter(User.id == payment.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Generate invoice number
    payment_count = db.query(Payment).count()
    invoice_number = f"INV-{datetime.now().year}-{payment_count + 1000:04d}"
    
    db_payment = Payment(
        user_id=payment.user_id,
        payment_type=payment.payment_type,
        description=payment.description,
        amount=payment.amount,
        due_date=payment.due_date,
        status=PaymentStatus.PENDING,
        invoice_number=invoice_number
    )
    db.add(db_payment)
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="payment_created",
        details=f"Created payment {invoice_number} for user {target_user.email}: €{payment.amount}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_payment)
    
    return enrich_payment(db_payment, db)


@router.put("/{payment_id}/pay", response_model=PaymentResponse)
def pay_payment(
    payment_id: int,
    pay_request: PaymentPayRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Student confirms payment"""
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Only owner can pay their payment
    if db_payment.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to pay this invoice")
    
    if db_payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Payment already paid")
    
    db_payment.status = PaymentStatus.PAID
    db_payment.paid_date = datetime.now()
    db_payment.payment_method = pay_request.payment_method
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="payment_paid",
        details=f"Paid invoice {db_payment.invoice_number}: €{db_payment.amount} via {pay_request.payment_method.value}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_payment)
    
    return enrich_payment(db_payment, db)


@router.put("/{payment_id}/cancel", response_model=PaymentResponse)
def cancel_payment(
    payment_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Cancel a payment (admin only)"""
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if db_payment.status == PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot cancel a paid payment")
    
    db_payment.status = PaymentStatus.WAIVED
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="payment_cancelled",
        details=f"Cancelled invoice {db_payment.invoice_number}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    db.refresh(db_payment)
    
    return enrich_payment(db_payment, db)


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete payment (admin only)"""
    db_payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not db_payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    db.delete(db_payment)
    db.commit()
    return None


@router.get("/users", response_model=List[dict])
def get_users_for_payment(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get list of users for payment creation (admin only)"""
    users = db.query(User).filter(User.is_active == True).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role.value} for u in users]
