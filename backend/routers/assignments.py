from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from auth import get_current_active_user, require_teacher
from models.user import User, UserRole
from models.subject import Subject
from models.assignment import Assignment, StudentSubmission
from models.enrollment import Enrollment, EnrollmentStatus

router = APIRouter(prefix="/api/assignments", tags=["Assignments"])


# ============== SCHEMAS ==============

class AssignmentBase(BaseModel):
    subject_id: int
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_points: float = 100.0


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: Optional[float] = None
    
    model_config = ConfigDict(from_attributes=True)


class AssignmentResponse(AssignmentBase):
    id: int
    teacher_id: Optional[int] = None
    created_at: Optional[datetime] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    teacher_name: Optional[str] = None
    submission_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)


class SubmissionBase(BaseModel):
    assignment_id: int
    text_answer: Optional[str] = None
    file_url: Optional[str] = None


class SubmissionCreate(SubmissionBase):
    pass


class SubmissionGrade(BaseModel):
    grade: float
    feedback: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: Optional[datetime] = None
    file_url: Optional[str] = None
    text_answer: Optional[str] = None
    grade: Optional[float] = None
    feedback: Optional[str] = None
    student_name: Optional[str] = None
    assignment_title: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============== ASSIGNMENT ENDPOINTS ==============

@router.get("/", response_model=List[AssignmentResponse])
def get_assignments(
    subject_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get assignments - filtered by subject if provided"""
    query = db.query(Assignment)
    
    if subject_id:
        query = query.filter(Assignment.subject_id == subject_id)
    
    # Students only see assignments for subjects they're enrolled in
    if current_user.role == UserRole.STUDENT:
        enrolled_subject_ids = db.query(Enrollment.subject_id).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.status == EnrollmentStatus.CONFIRMED
        ).all()
        enrolled_ids = [s[0] for s in enrolled_subject_ids]
        query = query.filter(Assignment.subject_id.in_(enrolled_ids))
    
    assignments = query.order_by(Assignment.due_date.desc()).all()
    
    result = []
    for a in assignments:
        submission_count = db.query(StudentSubmission).filter(
            StudentSubmission.assignment_id == a.id
        ).count()
        
        result.append(AssignmentResponse(
            id=a.id,
            subject_id=a.subject_id,
            teacher_id=a.teacher_id,
            title=a.title,
            description=a.description,
            due_date=a.due_date,
            max_points=a.max_points,
            created_at=a.created_at,
            subject_name=a.subject.name if a.subject else None,
            subject_code=a.subject.code if a.subject else None,
            teacher_name=a.teacher.full_name if a.teacher else None,
            submission_count=submission_count
        ))
    return result


@router.get("/subject/{subject_id}", response_model=List[AssignmentResponse])
def get_subject_assignments(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all assignments for a specific subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    assignments = db.query(Assignment).filter(
        Assignment.subject_id == subject_id
    ).order_by(Assignment.due_date.desc()).all()
    
    result = []
    for a in assignments:
        submission_count = db.query(StudentSubmission).filter(
            StudentSubmission.assignment_id == a.id
        ).count()
        
        result.append(AssignmentResponse(
            id=a.id,
            subject_id=a.subject_id,
            teacher_id=a.teacher_id,
            title=a.title,
            description=a.description,
            due_date=a.due_date,
            max_points=a.max_points,
            created_at=a.created_at,
            subject_name=a.subject.name if a.subject else None,
            subject_code=a.subject.code if a.subject else None,
            teacher_name=a.teacher.full_name if a.teacher else None,
            submission_count=submission_count
        ))
    return result


@router.get("/{assignment_id}", response_model=AssignmentResponse)
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific assignment"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    submission_count = db.query(StudentSubmission).filter(
        StudentSubmission.assignment_id == assignment.id
    ).count()
    
    return AssignmentResponse(
        id=assignment.id,
        subject_id=assignment.subject_id,
        teacher_id=assignment.teacher_id,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        max_points=assignment.max_points,
        created_at=assignment.created_at,
        subject_name=assignment.subject.name if assignment.subject else None,
        subject_code=assignment.subject.code if assignment.subject else None,
        teacher_name=assignment.teacher.full_name if assignment.teacher else None,
        submission_count=submission_count
    )


@router.post("/", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED)
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create assignment - only teachers"""
    subject = db.query(Subject).filter(Subject.id == assignment.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if teacher owns the subject
    if subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to create assignments for this subject")
    
    db_assignment = Assignment(
        subject_id=assignment.subject_id,
        teacher_id=current_user.id,
        title=assignment.title,
        description=assignment.description,
        due_date=assignment.due_date,
        max_points=assignment.max_points
    )
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return AssignmentResponse(
        id=db_assignment.id,
        subject_id=db_assignment.subject_id,
        teacher_id=db_assignment.teacher_id,
        title=db_assignment.title,
        description=db_assignment.description,
        due_date=db_assignment.due_date,
        max_points=db_assignment.max_points,
        created_at=db_assignment.created_at,
        subject_name=db_assignment.subject.name if db_assignment.subject else None,
        subject_code=db_assignment.subject.code if db_assignment.subject else None,
        teacher_name=current_user.full_name,
        submission_count=0
    )


@router.put("/{assignment_id}", response_model=AssignmentResponse)
def update_assignment(
    assignment_id: int,
    assignment_update: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update assignment - only teachers"""
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if db_assignment.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = assignment_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    
    submission_count = db.query(StudentSubmission).filter(
        StudentSubmission.assignment_id == db_assignment.id
    ).count()
    
    return AssignmentResponse(
        id=db_assignment.id,
        subject_id=db_assignment.subject_id,
        teacher_id=db_assignment.teacher_id,
        title=db_assignment.title,
        description=db_assignment.description,
        due_date=db_assignment.due_date,
        max_points=db_assignment.max_points,
        created_at=db_assignment.created_at,
        subject_name=db_assignment.subject.name if db_assignment.subject else None,
        subject_code=db_assignment.subject.code if db_assignment.subject else None,
        teacher_name=db_assignment.teacher.full_name if db_assignment.teacher else None,
        submission_count=submission_count
    )


@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete assignment - only teachers"""
    db_assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    if db_assignment.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_assignment)
    db.commit()
    return None


# ============== SUBMISSION ENDPOINTS ==============

@router.get("/{assignment_id}/submissions", response_model=List[SubmissionResponse])
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all submissions for an assignment - teachers see all, students see their own"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    query = db.query(StudentSubmission).filter(StudentSubmission.assignment_id == assignment_id)
    
    if current_user.role == UserRole.STUDENT:
        query = query.filter(StudentSubmission.student_id == current_user.id)
    
    submissions = query.all()
    
    result = []
    for s in submissions:
        result.append(SubmissionResponse(
            id=s.id,
            assignment_id=s.assignment_id,
            student_id=s.student_id,
            submitted_at=s.submitted_at,
            file_url=s.file_url,
            text_answer=s.text_answer,
            grade=s.grade,
            feedback=s.feedback,
            student_name=s.student.full_name if s.student else None,
            assignment_title=s.assignment.title if s.assignment else None
        ))
    return result


@router.post("/submissions/", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_assignment(
    submission: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Submit assignment - only students"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can submit assignments")
    
    assignment = db.query(Assignment).filter(Assignment.id == submission.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Check if already submitted
    existing = db.query(StudentSubmission).filter(
        StudentSubmission.assignment_id == submission.assignment_id,
        StudentSubmission.student_id == current_user.id
    ).first()
    
    if existing:
        # Update existing submission
        existing.text_answer = submission.text_answer
        existing.file_url = submission.file_url
        existing.submitted_at = datetime.now()
        db.commit()
        db.refresh(existing)
        
        return SubmissionResponse(
            id=existing.id,
            assignment_id=existing.assignment_id,
            student_id=existing.student_id,
            submitted_at=existing.submitted_at,
            file_url=existing.file_url,
            text_answer=existing.text_answer,
            grade=existing.grade,
            feedback=existing.feedback,
            student_name=current_user.full_name,
            assignment_title=assignment.title
        )
    
    # Create new submission
    db_submission = StudentSubmission(
        assignment_id=submission.assignment_id,
        student_id=current_user.id,
        text_answer=submission.text_answer,
        file_url=submission.file_url
    )
    db.add(db_submission)
    db.commit()
    db.refresh(db_submission)
    
    return SubmissionResponse(
        id=db_submission.id,
        assignment_id=db_submission.assignment_id,
        student_id=db_submission.student_id,
        submitted_at=db_submission.submitted_at,
        file_url=db_submission.file_url,
        text_answer=db_submission.text_answer,
        grade=db_submission.grade,
        feedback=db_submission.feedback,
        student_name=current_user.full_name,
        assignment_title=assignment.title
    )


@router.put("/submissions/{submission_id}/grade", response_model=SubmissionResponse)
def grade_submission(
    submission_id: int,
    grade_data: SubmissionGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Grade a submission - only teachers"""
    db_submission = db.query(StudentSubmission).filter(StudentSubmission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    assignment = db_submission.assignment
    if assignment.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to grade this submission")
    
    db_submission.grade = grade_data.grade
    db_submission.feedback = grade_data.feedback
    
    db.commit()
    db.refresh(db_submission)
    
    return SubmissionResponse(
        id=db_submission.id,
        assignment_id=db_submission.assignment_id,
        student_id=db_submission.student_id,
        submitted_at=db_submission.submitted_at,
        file_url=db_submission.file_url,
        text_answer=db_submission.text_answer,
        grade=db_submission.grade,
        feedback=db_submission.feedback,
        student_name=db_submission.student.full_name if db_submission.student else None,
        assignment_title=db_submission.assignment.title if db_submission.assignment else None
    )


@router.get("/my-submissions/", response_model=List[SubmissionResponse])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's submissions"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students have submissions")
    
    submissions = db.query(StudentSubmission).filter(
        StudentSubmission.student_id == current_user.id
    ).all()
    
    result = []
    for s in submissions:
        result.append(SubmissionResponse(
            id=s.id,
            assignment_id=s.assignment_id,
            student_id=s.student_id,
            submitted_at=s.submitted_at,
            file_url=s.file_url,
            text_answer=s.text_answer,
            grade=s.grade,
            feedback=s.feedback,
            student_name=current_user.full_name,
            assignment_title=s.assignment.title if s.assignment else None
        ))
    return result

