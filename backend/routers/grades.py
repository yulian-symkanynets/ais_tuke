from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database import get_db
from auth import get_current_active_user, require_teacher
from models.user import User, UserRole
from models.grade import Grade, GradeLetter
from models.subject import Subject
from models.enrollment import Enrollment, EnrollmentStatus

router = APIRouter(prefix="/api/grades", tags=["Grades"])

GRADE_TO_NUMERIC = {
    "A": 1.0,
    "B": 1.5,
    "C": 2.0,
    "D": 3.0,
    "E": 4.0,
    "FX": 5.0,
}


class GradeBase(BaseModel):
    student_id: int
    subject_id: int
    grade: GradeLetter
    semester: str
    notes: Optional[str] = None


class GradeCreate(GradeBase):
    pass


class GradeUpdate(BaseModel):
    grade: Optional[GradeLetter] = None
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class GradeResponse(BaseModel):
    id: int
    student_id: int
    subject_id: int
    teacher_id: Optional[int] = None
    grade: GradeLetter
    numeric_grade: float
    semester: str
    date: str
    notes: Optional[str] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    student_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=List[GradeResponse])
def get_grades(
    student_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get grades - students see their own, teachers see all"""
    query = db.query(Grade)
    
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Grade.student_id == current_user.id)
    elif student_id:
        query = query.filter(Grade.student_id == student_id)
    
    if subject_id:
        query = query.filter(Grade.subject_id == subject_id)
    if semester:
        query = query.filter(Grade.semester == semester)
    
    grades = query.all()
    result = []
    for grade in grades:
        result.append(GradeResponse(
            id=grade.id,
            student_id=grade.student_id,
            subject_id=grade.subject_id,
            teacher_id=grade.teacher_id,
            grade=grade.grade,
            numeric_grade=grade.numeric_grade,
            semester=grade.semester,
            date=grade.date.strftime("%b %d, %Y") if grade.date else "",
            notes=grade.notes,
            subject_name=grade.subject.name if grade.subject else None,
            subject_code=grade.subject.code if grade.subject else None,
            student_name=grade.student.full_name if grade.student else None
        ))
    return result


@router.post("/", response_model=GradeResponse, status_code=status.HTTP_201_CREATED)
def create_grade(
    grade: GradeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create grade - only teachers"""
    subject = db.query(Subject).filter(Subject.id == grade.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to grade this subject")
    
    numeric_grade = GRADE_TO_NUMERIC.get(grade.grade.value, 5.0)
    
    db_grade = Grade(
        student_id=grade.student_id,
        subject_id=grade.subject_id,
        grade=grade.grade,
        semester=grade.semester,
        notes=grade.notes,
        teacher_id=current_user.id,
        numeric_grade=numeric_grade
    )
    db.add(db_grade)
    db.commit()
    db.refresh(db_grade)
    
    return GradeResponse(
        id=db_grade.id,
        student_id=db_grade.student_id,
        subject_id=db_grade.subject_id,
        teacher_id=db_grade.teacher_id,
        grade=db_grade.grade,
        numeric_grade=db_grade.numeric_grade,
        semester=db_grade.semester,
        date=db_grade.date.strftime("%b %d, %Y") if db_grade.date else "",
        notes=db_grade.notes,
        subject_name=db_grade.subject.name if db_grade.subject else None,
        subject_code=db_grade.subject.code if db_grade.subject else None,
        student_name=db_grade.student.full_name if db_grade.student else None
    )


@router.put("/{grade_id}", response_model=GradeResponse)
def update_grade(
    grade_id: int,
    grade_update: GradeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update grade - only teachers"""
    db_grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not db_grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    if db_grade.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if grade_update.grade:
        db_grade.grade = grade_update.grade
        db_grade.numeric_grade = GRADE_TO_NUMERIC.get(grade_update.grade.value, 5.0)
    if grade_update.notes is not None:
        db_grade.notes = grade_update.notes
    
    db.commit()
    db.refresh(db_grade)
    
    return GradeResponse(
        id=db_grade.id,
        student_id=db_grade.student_id,
        subject_id=db_grade.subject_id,
        teacher_id=db_grade.teacher_id,
        grade=db_grade.grade,
        numeric_grade=db_grade.numeric_grade,
        semester=db_grade.semester,
        date=db_grade.date.strftime("%b %d, %Y") if db_grade.date else "",
        notes=db_grade.notes,
        subject_name=db_grade.subject.name if db_grade.subject else None,
        subject_code=db_grade.subject.code if db_grade.subject else None,
        student_name=db_grade.student.full_name if db_grade.student else None
    )


@router.delete("/{grade_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_grade(
    grade_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete grade - only teachers"""
    db_grade = db.query(Grade).filter(Grade.id == grade_id).first()
    if not db_grade:
        raise HTTPException(status_code=404, detail="Grade not found")
    
    if db_grade.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_grade)
    db.commit()
    return None


class EnrolledStudentResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


@router.get("/subject/{subject_id}/students", response_model=List[EnrolledStudentResponse])
def get_enrolled_students(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get students enrolled in a subject - for teachers to assign grades"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    enrollments = db.query(Enrollment).filter(
        Enrollment.subject_id == subject_id,
        Enrollment.status == EnrollmentStatus.CONFIRMED
    ).all()
    
    students = []
    for e in enrollments:
        if e.student:
            students.append(EnrolledStudentResponse(
                id=e.student.id,
                email=e.student.email,
                full_name=e.student.full_name
            ))
    return students
