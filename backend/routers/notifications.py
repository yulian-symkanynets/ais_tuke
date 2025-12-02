from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from auth import get_current_active_user
from models.user import User
from models.notification import Notification, NotificationType

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationBase(BaseModel):
    type: NotificationType
    title: str
    message: str


class NotificationCreate(NotificationBase):
    user_id: Optional[int] = None


class NotificationResponse(NotificationBase):
    id: int
    user_id: int
    read: bool
    created_at: str
    
    class Config:
        from_attributes = True


@router.get("/", response_model=List[NotificationResponse])
def get_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if unread_only:
        query = query.filter(Notification.read == False)
    
    notifications = query.order_by(Notification.created_at.desc()).all()
    result = []
    for notif in notifications:
        result.append(NotificationResponse(
            id=notif.id,
            user_id=notif.user_id,
            type=notif.type,
            title=notif.title,
            message=notif.message,
            read=notif.read,
            created_at=notif.created_at.strftime("%b %d, %Y %H:%M") if notif.created_at else ""
        ))
    return result


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create notification"""
    user_id = notification.user_id if notification.user_id else current_user.id
    
    db_notification = Notification(
        user_id=user_id,
        type=notification.type,
        title=notification.title,
        message=notification.message
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    
    return NotificationResponse(
        id=db_notification.id,
        user_id=db_notification.user_id,
        type=db_notification.type,
        title=db_notification.title,
        message=db_notification.message,
        read=db_notification.read,
        created_at=db_notification.created_at.strftime("%b %d, %Y %H:%M") if db_notification.created_at else ""
    )


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark notification as read"""
    db_notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if db_notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_notification.read = True
    db.commit()
    db.refresh(db_notification)
    
    return NotificationResponse(
        id=db_notification.id,
        user_id=db_notification.user_id,
        type=db_notification.type,
        title=db_notification.title,
        message=db_notification.message,
        read=db_notification.read,
        created_at=db_notification.created_at.strftime("%b %d, %Y %H:%M") if db_notification.created_at else ""
    )


@router.put("/read-all", status_code=status.HTTP_200_OK)
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Mark all notifications as read"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.read == False
    ).update({"read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete notification"""
    db_notification = db.query(Notification).filter(Notification.id == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    if db_notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(db_notification)
    db.commit()
    return None
