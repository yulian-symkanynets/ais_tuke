from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from auth import get_current_active_user, require_student, require_role
from models.user import User, UserRole
from models.dormitory import Dormitory, DormitoryApplication, ApplicationStatus

router = APIRouter(prefix="/api/dormitories", tags=["Dormitories"])


# ============== SCHEMAS ==============

class DormitoryBase(BaseModel):
    name: str
    address: str
    available_rooms: int
    total_rooms: int
    monthly_rent: float
    amenities: Optional[str] = None


class DormitoryCreate(DormitoryBase):
    pass


class DormitoryUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    available_rooms: Optional[int] = None
    total_rooms: Optional[int] = None
    monthly_rent: Optional[float] = None
    amenities: Optional[str] = None
    is_active: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class DormitoryResponse(DormitoryBase):
    id: int
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class DormitoryApplicationBase(BaseModel):
    dormitory_id: int
    room_type: Optional[str] = None


class DormitoryApplicationCreate(DormitoryApplicationBase):
    pass


class DormitoryApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    room_number: Optional[str] = None
    move_in_date: Optional[datetime] = None
    deposit_paid: Optional[bool] = None

    model_config = ConfigDict(from_attributes=True)


class DormitoryApplicationResponse(BaseModel):
    id: int
    student_id: int
    dormitory_id: int
    status: ApplicationStatus
    room_number: Optional[str] = None
    room_type: Optional[str] = None
    move_in_date: Optional[datetime] = None
    deposit_paid: bool
    created_at: Optional[datetime] = None
    dormitory_name: Optional[str] = None
    student_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============== APPLICATION ENDPOINTS (Must be before /{dormitory_id}) ==============

@router.get("/applications/", response_model=List[DormitoryApplicationResponse])
def get_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get applications - students see their own, admins see all"""
    if current_user.role == UserRole.STUDENT:
        applications = db.query(DormitoryApplication).filter(
            DormitoryApplication.student_id == current_user.id
        ).all()
    else:
        applications = db.query(DormitoryApplication).all()
    
    result = []
    for app in applications:
        result.append(DormitoryApplicationResponse(
            id=app.id,
            student_id=app.student_id,
            dormitory_id=app.dormitory_id,
            status=app.status,
            room_number=app.room_number,
            room_type=app.room_type,
            move_in_date=app.move_in_date,
            deposit_paid=app.deposit_paid,
            created_at=app.created_at,
            dormitory_name=app.dormitory.name if app.dormitory else None,
            student_name=app.student.full_name if app.student else None
        ))
    return result


@router.post("/applications/", response_model=DormitoryApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    application: DormitoryApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Apply for dormitory - only students"""
    dormitory = db.query(Dormitory).filter(Dormitory.id == application.dormitory_id).first()
    if not dormitory:
        raise HTTPException(status_code=404, detail="Dormitory not found")
    
    if dormitory.available_rooms <= 0:
        raise HTTPException(status_code=400, detail="No rooms available")
    
    # Check if already has pending application
    existing = db.query(DormitoryApplication).filter(
        DormitoryApplication.student_id == current_user.id,
        DormitoryApplication.status == ApplicationStatus.PENDING
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already have a pending application")
    
    db_application = DormitoryApplication(
        student_id=current_user.id,
        dormitory_id=application.dormitory_id,
        room_type=application.room_type,
        status=ApplicationStatus.PENDING
    )
    db.add(db_application)
    db.commit()
    db.refresh(db_application)
    
    return DormitoryApplicationResponse(
        id=db_application.id,
        student_id=db_application.student_id,
        dormitory_id=db_application.dormitory_id,
        status=db_application.status,
        room_number=db_application.room_number,
        room_type=db_application.room_type,
        move_in_date=db_application.move_in_date,
        deposit_paid=db_application.deposit_paid,
        created_at=db_application.created_at,
        dormitory_name=db_application.dormitory.name if db_application.dormitory else None,
        student_name=current_user.full_name
    )


@router.put("/applications/{application_id}", response_model=DormitoryApplicationResponse)
def update_application(
    application_id: int,
    application_update: DormitoryApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update application - admins can approve/reject"""
    db_application = db.query(DormitoryApplication).filter(
        DormitoryApplication.id == application_id
    ).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user.role == UserRole.STUDENT and db_application.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = application_update.model_dump(exclude_unset=True)
    
    # If approving, decrease available rooms
    if application_update.status == ApplicationStatus.APPROVED and db_application.status != ApplicationStatus.APPROVED:
        dormitory = db_application.dormitory
        if dormitory and dormitory.available_rooms > 0:
            dormitory.available_rooms -= 1
    
    for field, value in update_data.items():
        setattr(db_application, field, value)
    
    db.commit()
    db.refresh(db_application)
    
    return DormitoryApplicationResponse(
        id=db_application.id,
        student_id=db_application.student_id,
        dormitory_id=db_application.dormitory_id,
        status=db_application.status,
        room_number=db_application.room_number,
        room_type=db_application.room_type,
        move_in_date=db_application.move_in_date,
        deposit_paid=db_application.deposit_paid,
        created_at=db_application.created_at,
        dormitory_name=db_application.dormitory.name if db_application.dormitory else None,
        student_name=db_application.student.full_name if db_application.student else None
    )


@router.delete("/applications/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Cancel/delete application"""
    db_application = db.query(DormitoryApplication).filter(
        DormitoryApplication.id == application_id
    ).first()
    if not db_application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if current_user.role == UserRole.STUDENT and db_application.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If was approved, increase available rooms
    if db_application.status == ApplicationStatus.APPROVED:
        dormitory = db_application.dormitory
        if dormitory:
            dormitory.available_rooms += 1
    
    db.delete(db_application)
    db.commit()
    return None


# ============== DORMITORY ENDPOINTS ==============

@router.get("/", response_model=List[DormitoryResponse])
def get_dormitories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all active dormitories"""
    dormitories = db.query(Dormitory).filter(Dormitory.is_active == True).all()
    return dormitories


@router.get("/{dormitory_id}", response_model=DormitoryResponse)
def get_dormitory(
    dormitory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific dormitory"""
    dormitory = db.query(Dormitory).filter(Dormitory.id == dormitory_id).first()
    if not dormitory:
        raise HTTPException(status_code=404, detail="Dormitory not found")
    return dormitory


@router.post("/", response_model=DormitoryResponse, status_code=status.HTTP_201_CREATED)
def create_dormitory(
    dormitory: DormitoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create dormitory - only admins"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create dormitories")
    
    db_dormitory = Dormitory(**dormitory.model_dump())
    db.add(db_dormitory)
    db.commit()
    db.refresh(db_dormitory)
    return db_dormitory


@router.put("/{dormitory_id}", response_model=DormitoryResponse)
def update_dormitory(
    dormitory_id: int,
    dormitory_update: DormitoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update dormitory - only admins"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update dormitories")
    
    db_dormitory = db.query(Dormitory).filter(Dormitory.id == dormitory_id).first()
    if not db_dormitory:
        raise HTTPException(status_code=404, detail="Dormitory not found")
    
    update_data = dormitory_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_dormitory, field, value)
    
    db.commit()
    db.refresh(db_dormitory)
    return db_dormitory


@router.delete("/{dormitory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dormitory(
    dormitory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete dormitory - only admins, cascade deletes applications"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can delete dormitories")
    
    db_dormitory = db.query(Dormitory).filter(Dormitory.id == dormitory_id).first()
    if not db_dormitory:
        raise HTTPException(status_code=404, detail="Dormitory not found")
    
    db.delete(db_dormitory)
    db.commit()
    return None
