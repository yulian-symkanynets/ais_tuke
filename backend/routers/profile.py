from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, ConfigDict
from database import get_db
from auth import get_current_active_user, get_password_hash, verify_password
from models.user import User, UserRole
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/profile", tags=["Profile"])


# ============== SCHEMAS ==============

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    theme: str = "light"
    language: str = "en"
    notifications_enabled: bool = True
    two_factor_enabled: bool = False
    
    model_config = ConfigDict(from_attributes=True)


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    profile_picture_url: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str
    
    model_config = ConfigDict(from_attributes=True)


# ============== ENDPOINTS ==============

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's profile"""
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        phone=current_user.phone,
        address=current_user.address,
        profile_picture_url=current_user.profile_picture_url,
        theme=current_user.theme or "light",
        language=current_user.language or "en",
        notifications_enabled=current_user.notifications_enabled if current_user.notifications_enabled is not None else True,
        two_factor_enabled=current_user.two_factor_enabled if current_user.two_factor_enabled is not None else False
    )


@router.put("/me", response_model=UserProfileResponse)
def update_my_profile(
    profile_update: UserProfileUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user's profile"""
    # Check if email is being changed and if it's already taken
    if profile_update.email and profile_update.email != current_user.email:
        existing = db.query(User).filter(User.email == profile_update.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    # Update fields
    update_data = profile_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    # Log the activity
    log = ActivityLog(
        user_id=current_user.id,
        action="profile_updated",
        details=f"Updated fields: {', '.join(update_data.keys())}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    db.refresh(current_user)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active,
        phone=current_user.phone,
        address=current_user.address,
        profile_picture_url=current_user.profile_picture_url,
        theme=current_user.theme or "light",
        language=current_user.language or "en",
        notifications_enabled=current_user.notifications_enabled if current_user.notifications_enabled is not None else True,
        two_factor_enabled=current_user.two_factor_enabled if current_user.two_factor_enabled is not None else False
    )


@router.put("/me/password")
def change_password(
    password_update: UserPasswordUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user's password"""
    # Verify current password
    if not verify_password(password_update.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check new password confirmation
    if password_update.new_password != password_update.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match")
    
    # Validate new password length
    if len(password_update.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Hash and save new password
    current_user.hashed_password = get_password_hash(password_update.new_password)
    
    # Log the activity
    log = ActivityLog(
        user_id=current_user.id,
        action="password_changed",
        details="Password was changed",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "Password changed successfully"}
