from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from database import get_db
from auth import get_current_active_user
from models.user import User
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/activity", tags=["Activity"])


# ============== SCHEMAS ==============

class ActivityLogResponse(BaseModel):
    id: int
    user_id: int
    action: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============== ENDPOINTS ==============

@router.get("/me", response_model=List[ActivityLogResponse])
def get_my_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's activity logs"""
    logs = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.timestamp.desc()).limit(limit).all()
    
    return [ActivityLogResponse(
        id=log.id,
        user_id=log.user_id,
        action=log.action,
        details=log.details,
        ip_address=log.ip_address,
        user_agent=log.user_agent,
        timestamp=log.timestamp
    ) for log in logs]


# Helper function to log activity (can be imported by other modules)
def log_activity(
    db: Session,
    user_id: int,
    action: str,
    details: str = None,
    ip_address: str = None,
    user_agent: str = None
):
    """Helper function to log user activity"""
    log = ActivityLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(log)
    db.commit()
    return log

