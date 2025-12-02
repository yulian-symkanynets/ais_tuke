from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from auth import get_current_active_user, require_teacher
from models.user import User, UserRole
from models.subject import Subject, Semester
from models.enrollment import Enrollment
from schemas.subject import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter(prefix="/api/subjects", tags=["subjects"])


@router.get("/", response_model=List[SubjectResponse])
def get_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all subjects - available to all authenticated users"""
    query = db.query(Subject)
    
    if semester:
        query = query.filter(Subject.semester == semester)
    
    subjects = query.offset(skip).limit(limit).all()
    
    # Add enrollment count for each subject
    result = []
    for subject in subjects:
        enrolled_count = db.query(func.count(Enrollment.id)).filter(
            Enrollment.subject_id == subject.id,
            Enrollment.status == "confirmed"
        ).scalar() or 0
        
        result.append(SubjectResponse(
            id=subject.id,
            code=subject.code,
            name=subject.name,
            credits=subject.credits,
            semester=subject.semester,
            description=subject.description,
            teacher_id=subject.teacher_id,
            teacher_name=subject.teacher.full_name if subject.teacher else None,
            enrolled_count=enrolled_count
        ))
    
    return result


@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    enrolled_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.subject_id == subject.id,
        Enrollment.status == "confirmed"
    ).scalar() or 0
    
    return SubjectResponse(
        id=subject.id,
        code=subject.code,
        name=subject.name,
        credits=subject.credits,
        semester=subject.semester,
        description=subject.description,
        teacher_id=subject.teacher_id,
        teacher_name=subject.teacher.full_name if subject.teacher else None,
        enrolled_count=enrolled_count
    )


@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(
    subject: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create a new subject - only teachers and admins can create"""
    # Check if subject code already exists
    existing = db.query(Subject).filter(Subject.code == subject.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    # Use current user as teacher (ignore teacher_id from request for security)
    teacher_id = current_user.id
    
    # Handle semester - it should already be the correct enum from schema
    semester_value = subject.semester
    
    # Create subject
    db_subject = Subject(
        code=subject.code,
        name=subject.name,
        credits=subject.credits,
        semester=semester_value,
        description=subject.description,
        teacher_id=teacher_id
    )
    
    try:
        db.add(db_subject)
        db.commit()
        db.refresh(db_subject)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    
    return SubjectResponse(
        id=db_subject.id,
        code=db_subject.code,
        name=db_subject.name,
        credits=db_subject.credits,
        semester=db_subject.semester,
        description=db_subject.description,
        teacher_id=db_subject.teacher_id,
        teacher_name=db_subject.teacher.full_name if db_subject.teacher else None,
        enrolled_count=0
    )


@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(
    subject_id: int,
    subject_update: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update a subject - only teachers can update"""
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Only the teacher who created it or admin can update
    if db_subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to update this subject")
    
    update_data = subject_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_subject, field, value)
    
    db.commit()
    db.refresh(db_subject)
    
    enrolled_count = db.query(func.count(Enrollment.id)).filter(
        Enrollment.subject_id == db_subject.id,
        Enrollment.status == "confirmed"
    ).scalar() or 0
    
    return SubjectResponse(
        id=db_subject.id,
        code=db_subject.code,
        name=db_subject.name,
        credits=db_subject.credits,
        semester=db_subject.semester,
        description=db_subject.description,
        teacher_id=db_subject.teacher_id,
        teacher_name=db_subject.teacher.full_name if db_subject.teacher else None,
        enrolled_count=enrolled_count
    )


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete a subject - cascade deletes enrollments, schedules, grades"""
    db_subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Only the teacher who created it or admin can delete
    if db_subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this subject")
    
    # Delete the subject - cascade will handle related records
    db.delete(db_subject)
    db.commit()
    return None
