from typing import Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database import get_db
from auth import get_current_active_user
from models.user import User
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/settings", tags=["Settings"])


# ============== SCHEMAS ==============

class UserSettingsResponse(BaseModel):
    theme: str
    language: str
    timezone: str
    notifications_enabled: bool
    two_factor_enabled: bool
    
    model_config = ConfigDict(from_attributes=True)


class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    timezone: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    two_factor_enabled: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)


# ============== ENDPOINTS ==============

@router.get("/me", response_model=UserSettingsResponse)
def get_my_settings(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's settings"""
    return UserSettingsResponse(
        theme=current_user.theme or "light",
        language=current_user.language or "en",
        timezone=current_user.timezone or "Europe/Bratislava",
        notifications_enabled=current_user.notifications_enabled if current_user.notifications_enabled is not None else True,
        two_factor_enabled=current_user.two_factor_enabled if current_user.two_factor_enabled is not None else False
    )


@router.put("/me", response_model=UserSettingsResponse)
def update_my_settings(
    settings_update: UserSettingsUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's settings"""
    update_data = settings_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Log the activity
    log = ActivityLog(
        user_id=current_user.id,
        action="settings_changed",
        details=f"Updated settings: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    db.refresh(current_user)
    
    return UserSettingsResponse(
        theme=current_user.theme or "light",
        language=current_user.language or "en",
        timezone=current_user.timezone or "Europe/Bratislava",
        notifications_enabled=current_user.notifications_enabled if current_user.notifications_enabled is not None else True,
        two_factor_enabled=current_user.two_factor_enabled if current_user.two_factor_enabled is not None else False
    )


# ============== TIMEZONE OPTIONS ==============

TIMEZONES = [
    {"value": "Europe/Bratislava", "label": "Europe/Bratislava (CET)"},
    {"value": "Europe/Prague", "label": "Europe/Prague (CET)"},
    {"value": "Europe/London", "label": "Europe/London (GMT)"},
    {"value": "Europe/Paris", "label": "Europe/Paris (CET)"},
    {"value": "Europe/Berlin", "label": "Europe/Berlin (CET)"},
    {"value": "America/New_York", "label": "America/New York (EST)"},
    {"value": "America/Los_Angeles", "label": "America/Los Angeles (PST)"},
    {"value": "Asia/Tokyo", "label": "Asia/Tokyo (JST)"},
    {"value": "UTC", "label": "UTC"},
]


@router.get("/timezones")
def get_timezones():
    """Get available timezones"""
    return TIMEZONES
