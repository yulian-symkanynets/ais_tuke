from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_active_user, require_teacher
from models.user import User, UserRole
from models.schedule import Schedule, DayOfWeek, ClassType
from models.subject import Subject

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


class ScheduleBase(BaseModel):
    subject_id: int
    day: DayOfWeek
    time: str
    room: str
    class_type: ClassType = ClassType.LECTURE
    semester: str


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    day: Optional[DayOfWeek] = None
    time: Optional[str] = None
    room: Optional[str] = None
    class_type: Optional[ClassType] = None


class ScheduleResponse(ScheduleBase):
    id: int
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[ScheduleResponse])
def get_schedules(
    semester: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get schedules - all users can view"""
    query = db.query(Schedule)
    if semester:
        query = query.filter(Schedule.semester == semester)
    
    schedules = query.all()
    result = []
    for schedule in schedules:
        result.append(ScheduleResponse(
            id=schedule.id,
            subject_id=schedule.subject_id,
            day=schedule.day,
            time=schedule.time,
            room=schedule.room,
            class_type=schedule.class_type,
            semester=schedule.semester,
            subject_name=schedule.subject.name if schedule.subject else None,
            subject_code=schedule.subject.code if schedule.subject else None
        ))
    return result


@router.post("/", response_model=ScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create schedule - only teachers"""
    subject = db.query(Subject).filter(Subject.id == schedule.subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    if subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_schedule = Schedule(
        subject_id=schedule.subject_id,
        day=schedule.day,
        time=schedule.time,
        room=schedule.room,
        class_type=schedule.class_type,
        semester=schedule.semester
    )
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    
    return ScheduleResponse(
        id=db_schedule.id,
        subject_id=db_schedule.subject_id,
        day=db_schedule.day,
        time=db_schedule.time,
        room=db_schedule.room,
        class_type=db_schedule.class_type,
        semester=db_schedule.semester,
        subject_name=db_schedule.subject.name if db_schedule.subject else None,
        subject_code=db_schedule.subject.code if db_schedule.subject else None
    )


@router.put("/{schedule_id}", response_model=ScheduleResponse)
def update_schedule(
    schedule_id: int,
    schedule_update: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update schedule - only teachers"""
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if db_schedule.subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = schedule_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_schedule, field, value)
    
    db.commit()
    db.refresh(db_schedule)
    
    return ScheduleResponse(
        id=db_schedule.id,
        subject_id=db_schedule.subject_id,
        day=db_schedule.day,
        time=db_schedule.time,
        room=db_schedule.room,
        class_type=db_schedule.class_type,
        semester=db_schedule.semester,
        subject_name=db_schedule.subject.name if db_schedule.subject else None,
        subject_code=db_schedule.subject.code if db_schedule.subject else None
    )


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete schedule - only teachers"""
    db_schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    if db_schedule.subject.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_schedule)
    db.commit()
    return None
