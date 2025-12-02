from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.enrollment import EnrollmentStatus


class EnrollmentBase(BaseModel):
    subject_id: int
    semester: str


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    status: Optional[EnrollmentStatus] = None


class EnrollmentResponse(EnrollmentBase):
    id: int
    student_id: int
    status: EnrollmentStatus
    enrolled_date: Optional[datetime] = None
    subject_name: Optional[str] = None
    subject_code: Optional[str] = None

    class Config:
        from_attributes = True
