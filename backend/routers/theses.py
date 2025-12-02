from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from auth import get_current_active_user, require_teacher
from models.user import User, UserRole
from models.thesis import Thesis, ThesisType, ThesisStatus

router = APIRouter(prefix="/api/theses", tags=["theses"])


class ThesisBase(BaseModel):
    title: str
    thesis_type: ThesisType
    supervisor_name: str
    consultant_name: Optional[str] = None
    department: str
    start_date: datetime
    submission_deadline: datetime
    defense_date: Optional[datetime] = None
    description: Optional[str] = None


class ThesisCreate(ThesisBase):
    """Schema for creating a thesis - student_id is optional for teachers assigning to students"""
    student_id: Optional[int] = None


class ThesisUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[ThesisStatus] = None
    progress: Optional[float] = None
    defense_date: Optional[datetime] = None
    description: Optional[str] = None
    supervisor_name: Optional[str] = None
    consultant_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ThesisResponse(ThesisBase):
    id: int
    student_id: int
    status: ThesisStatus
    progress: float
    created_at: Optional[datetime] = None
    student_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=List[ThesisResponse])
def get_theses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get theses - students see their own, teachers/admins see all"""
    if current_user.role == UserRole.STUDENT:
        theses = db.query(Thesis).filter(Thesis.student_id == current_user.id).all()
    else:
        theses = db.query(Thesis).all()
    
    result = []
    for thesis in theses:
        result.append(ThesisResponse(
            id=thesis.id,
            student_id=thesis.student_id,
            title=thesis.title,
            thesis_type=thesis.thesis_type,
            status=thesis.status,
            supervisor_name=thesis.supervisor_name,
            consultant_name=thesis.consultant_name,
            department=thesis.department,
            start_date=thesis.start_date,
            submission_deadline=thesis.submission_deadline,
            defense_date=thesis.defense_date,
            progress=thesis.progress,
            description=thesis.description,
            created_at=thesis.created_at,
            student_name=thesis.student.full_name if thesis.student else None
        ))
    return result


@router.get("/{thesis_id}", response_model=ThesisResponse)
def get_thesis(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific thesis"""
    thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    if current_user.role == UserRole.STUDENT and thesis.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return ThesisResponse(
        id=thesis.id,
        student_id=thesis.student_id,
        title=thesis.title,
        thesis_type=thesis.thesis_type,
        status=thesis.status,
        supervisor_name=thesis.supervisor_name,
        consultant_name=thesis.consultant_name,
        department=thesis.department,
        start_date=thesis.start_date,
        submission_deadline=thesis.submission_deadline,
        defense_date=thesis.defense_date,
        progress=thesis.progress,
        description=thesis.description,
        created_at=thesis.created_at,
        student_name=thesis.student.full_name if thesis.student else None
    )


@router.post("/", response_model=ThesisResponse, status_code=status.HTTP_201_CREATED)
def create_thesis(
    thesis: ThesisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create thesis:
    - Students can create their own thesis (student_id = current user)
    - Teachers can create thesis for any student (must provide student_id)
    - Admins can create thesis for any student
    """
    # Determine student_id based on role
    if current_user.role == UserRole.STUDENT:
        # Students can only create their own thesis
        student_id = current_user.id
        
        # Check if student already has an active thesis
        existing = db.query(Thesis).filter(
            Thesis.student_id == student_id,
            Thesis.status.notin_([ThesisStatus.COMPLETED, ThesisStatus.DEFENDED])
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="You already have an active thesis")
    else:
        # Teachers and admins can assign thesis to any student
        if thesis.student_id:
            student_id = thesis.student_id
            # Verify student exists and is actually a student
            from models.user import User as UserModel
            student = db.query(UserModel).filter(UserModel.id == student_id).first()
            if not student:
                raise HTTPException(status_code=404, detail="Student not found")
            if student.role != UserRole.STUDENT:
                raise HTTPException(status_code=400, detail="User is not a student")
        else:
            raise HTTPException(status_code=400, detail="Teachers must provide student_id when creating a thesis")
    
    db_thesis = Thesis(
        student_id=student_id,
        title=thesis.title,
        thesis_type=thesis.thesis_type,
        supervisor_name=thesis.supervisor_name,
        consultant_name=thesis.consultant_name,
        department=thesis.department,
        start_date=thesis.start_date,
        submission_deadline=thesis.submission_deadline,
        defense_date=thesis.defense_date,
        description=thesis.description,
        status=ThesisStatus.REGISTERED,
        progress=0.0
    )
    db.add(db_thesis)
    db.commit()
    db.refresh(db_thesis)
    
    return ThesisResponse(
        id=db_thesis.id,
        student_id=db_thesis.student_id,
        title=db_thesis.title,
        thesis_type=db_thesis.thesis_type,
        status=db_thesis.status,
        supervisor_name=db_thesis.supervisor_name,
        consultant_name=db_thesis.consultant_name,
        department=db_thesis.department,
        start_date=db_thesis.start_date,
        submission_deadline=db_thesis.submission_deadline,
        defense_date=db_thesis.defense_date,
        progress=db_thesis.progress,
        description=db_thesis.description,
        created_at=db_thesis.created_at,
        student_name=db_thesis.student.full_name if db_thesis.student else None
    )


@router.put("/{thesis_id}", response_model=ThesisResponse)
def update_thesis(
    thesis_id: int,
    thesis_update: ThesisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update thesis - students can update their own, teachers/admins can update any"""
    db_thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not db_thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    if current_user.role == UserRole.STUDENT and db_thesis.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = thesis_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_thesis, field, value)
    
    db.commit()
    db.refresh(db_thesis)
    
    return ThesisResponse(
        id=db_thesis.id,
        student_id=db_thesis.student_id,
        title=db_thesis.title,
        thesis_type=db_thesis.thesis_type,
        status=db_thesis.status,
        supervisor_name=db_thesis.supervisor_name,
        consultant_name=db_thesis.consultant_name,
        department=db_thesis.department,
        start_date=db_thesis.start_date,
        submission_deadline=db_thesis.submission_deadline,
        defense_date=db_thesis.defense_date,
        progress=db_thesis.progress,
        description=db_thesis.description,
        created_at=db_thesis.created_at,
        student_name=db_thesis.student.full_name if db_thesis.student else None
    )


@router.delete("/{thesis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_thesis(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete thesis - students can delete their own, teachers/admins can delete any"""
    db_thesis = db.query(Thesis).filter(Thesis.id == thesis_id).first()
    if not db_thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
    
    if current_user.role == UserRole.STUDENT and db_thesis.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_thesis)
    db.commit()
    return None
