from pydantic import BaseModel, ConfigDict
from typing import Optional
from models.subject import Semester


class SubjectBase(BaseModel):
    code: str
    name: str
    credits: int
    semester: Semester
    description: Optional[str] = None


class SubjectCreate(SubjectBase):
    """Schema for creating a subject - teacher_id is optional, will use current user if not provided"""
    teacher_id: Optional[int] = None


class SubjectUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    credits: Optional[int] = None
    semester: Optional[Semester] = None
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class SubjectResponse(SubjectBase):
    id: int
    teacher_id: Optional[int] = None
    teacher_name: Optional[str] = None
    enrolled_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)
