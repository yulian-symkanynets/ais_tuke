from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_active_user, require_student, require_teacher
from models.user import User, UserRole
from models.enrollment import Enrollment, EnrollmentStatus
from models.subject import Subject
from schemas.enrollment import EnrollmentCreate, EnrollmentUpdate, EnrollmentResponse

router = APIRouter(prefix="/api/enrollments", tags=["enrollments"])


@router.get("/", response_model=List[EnrollmentResponse])
def get_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get enrollments - students see their own, teachers see all"""
    if current_user.role == UserRole.STUDENT:
        enrollments = db.query(Enrollment).filter(Enrollment.student_id == current_user.id).all()
    else:
        enrollments = db.query(Enrollment).all()
    
    result = []
    for enrollment in enrollments:
        result.append(EnrollmentResponse(
            id=enrollment.id,
            student_id=enrollment.student_id,
            subject_id=enrollment.subject_id,
            status=enrollment.status,
            enrolled_date=enrollment.enrolled_date,
            semester=enrollment.semester,
            subject_name=enrollment.subject.name if enrollment.subject else None,
            subject_code=enrollment.subject.code if enrollment.subject else None
        ))
    return result


@router.post("/", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
def create_enrollment(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Enroll in a subject - only students can enroll"""
    # Check if subject exists
    subject = db.query(Subject).filter(Subject.id == enrollment.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.subject_id == enrollment.subject_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled in this subject")
    
    db_enrollment = Enrollment(
        student_id=current_user.id,
        subject_id=enrollment.subject_id,
        semester=enrollment.semester,
        status=EnrollmentStatus.CONFIRMED  # Auto-confirm for now
    )
    db.add(db_enrollment)
    db.commit()
    db.refresh(db_enrollment)
    
    return EnrollmentResponse(
        id=db_enrollment.id,
        student_id=db_enrollment.student_id,
        subject_id=db_enrollment.subject_id,
        status=db_enrollment.status,
        enrolled_date=db_enrollment.enrolled_date,
        semester=db_enrollment.semester,
        subject_name=db_enrollment.subject.name if db_enrollment.subject else None,
        subject_code=db_enrollment.subject.code if db_enrollment.subject else None
    )


@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
    enrollment_id: int,
    enrollment_update: EnrollmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update enrollment status - only teachers can approve/reject"""
    db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not db_enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    if enrollment_update.status:
        db_enrollment.status = enrollment_update.status
    
    db.commit()
    db.refresh(db_enrollment)
    
    return EnrollmentResponse(
        id=db_enrollment.id,
        student_id=db_enrollment.student_id,
        subject_id=db_enrollment.subject_id,
        status=db_enrollment.status,
        enrolled_date=db_enrollment.enrolled_date,
        semester=db_enrollment.semester,
        subject_name=db_enrollment.subject.name if db_enrollment.subject else None,
        subject_code=db_enrollment.subject.code if db_enrollment.subject else None
    )


@router.delete("/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Withdraw from enrollment - students can withdraw their own"""
    db_enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not db_enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    # Students can only delete their own enrollments
    if current_user.role == UserRole.STUDENT and db_enrollment.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this enrollment")
    
    db.delete(db_enrollment)
    db.commit()
    return None
