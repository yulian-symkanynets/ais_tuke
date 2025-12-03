import secrets
import time
import hmac
import hashlib
import base64
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from database import get_db
from auth import get_current_active_user
from models.user import User
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/auth/2fa", tags=["Two-Factor Authentication"])


# ============== SCHEMAS ==============

class TwoFASetupResponse(BaseModel):
    secret: str
    qr_url: str
    
    model_config = ConfigDict(from_attributes=True)


class TwoFAVerifyRequest(BaseModel):
    code: str
    
    model_config = ConfigDict(from_attributes=True)


class TwoFAStatusResponse(BaseModel):
    enabled: bool
    
    model_config = ConfigDict(from_attributes=True)


# ============== TOTP IMPLEMENTATION ==============

def generate_secret() -> str:
    """Generate a random base32 secret for TOTP"""
    # Generate 20 random bytes and encode as base32
    random_bytes = secrets.token_bytes(20)
    return base64.b32encode(random_bytes).decode('utf-8').rstrip('=')


def generate_totp(secret: str, time_step: int = 30) -> str:
    """Generate a TOTP code from secret"""
    # Pad secret to correct length
    secret = secret.upper()
    padding = 8 - (len(secret) % 8)
    if padding != 8:
        secret += '=' * padding
    
    try:
        key = base64.b32decode(secret)
    except Exception:
        return ""
    
    # Get current time counter
    counter = int(time.time()) // time_step
    counter_bytes = counter.to_bytes(8, byteorder='big')
    
    # Generate HMAC-SHA1
    hmac_hash = hmac.new(key, counter_bytes, hashlib.sha1).digest()
    
    # Dynamic truncation
    offset = hmac_hash[-1] & 0x0F
    code = ((hmac_hash[offset] & 0x7F) << 24 |
            (hmac_hash[offset + 1] & 0xFF) << 16 |
            (hmac_hash[offset + 2] & 0xFF) << 8 |
            (hmac_hash[offset + 3] & 0xFF))
    
    # Get 6 digits
    otp = code % 1000000
    return str(otp).zfill(6)


def verify_totp(secret: str, code: str, window: int = 1) -> bool:
    """Verify a TOTP code with a time window"""
    if not secret or not code:
        return False
    
    # Check current and adjacent time steps
    for offset in range(-window, window + 1):
        expected = generate_totp_with_offset(secret, offset)
        if expected and code == expected:
            return True
    return False


def generate_totp_with_offset(secret: str, offset: int = 0, time_step: int = 30) -> str:
    """Generate TOTP with time offset"""
    secret = secret.upper()
    padding = 8 - (len(secret) % 8)
    if padding != 8:
        secret += '=' * padding
    
    try:
        key = base64.b32decode(secret)
    except Exception:
        return ""
    
    counter = (int(time.time()) // time_step) + offset
    counter_bytes = counter.to_bytes(8, byteorder='big')
    
    hmac_hash = hmac.new(key, counter_bytes, hashlib.sha1).digest()
    
    offset_byte = hmac_hash[-1] & 0x0F
    code = ((hmac_hash[offset_byte] & 0x7F) << 24 |
            (hmac_hash[offset_byte + 1] & 0xFF) << 16 |
            (hmac_hash[offset_byte + 2] & 0xFF) << 8 |
            (hmac_hash[offset_byte + 3] & 0xFF))
    
    otp = code % 1000000
    return str(otp).zfill(6)


def generate_qr_url(secret: str, email: str, issuer: str = "AIS TUKE") -> str:
    """Generate otpauth URL for QR code"""
    return f"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30"


# ============== ENDPOINTS ==============

@router.get("/status", response_model=TwoFAStatusResponse)
def get_2fa_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get 2FA status for current user"""
    return TwoFAStatusResponse(enabled=current_user.two_factor_enabled)


@router.post("/enable", response_model=TwoFASetupResponse)
def enable_2fa(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Enable 2FA and get setup information"""
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    # Generate new secret
    secret = generate_secret()
    qr_url = generate_qr_url(secret, current_user.email)
    
    # Store secret temporarily (not enabled yet until verified)
    current_user.two_factor_secret = secret
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="2fa_setup_initiated",
        details="Started 2FA setup",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    
    return TwoFASetupResponse(secret=secret, qr_url=qr_url)


@router.post("/verify-setup")
def verify_2fa_setup(
    verify_request: TwoFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Verify 2FA setup with a code"""
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    
    if current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    # Verify the code
    if not verify_totp(current_user.two_factor_secret, verify_request.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Enable 2FA
    current_user.two_factor_enabled = True
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="2fa_enabled",
        details="Two-factor authentication enabled",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "Two-factor authentication enabled successfully"}


@router.post("/disable")
def disable_2fa(
    verify_request: TwoFAVerifyRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Disable 2FA"""
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    
    # Verify the code before disabling
    if not verify_totp(current_user.two_factor_secret, verify_request.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Disable 2FA
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="2fa_disabled",
        details="Two-factor authentication disabled",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent")
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "Two-factor authentication disabled successfully"}


@router.post("/verify")
def verify_2fa_login(
    verify_request: TwoFAVerifyRequest,
    email: str,
    db: Session = Depends(get_db)
):
    """Verify 2FA code during login"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled for this user")
    
    if not verify_totp(user.two_factor_secret, verify_request.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    return {"valid": True}


@router.get("/current-code")
def get_current_code(
    current_user: User = Depends(get_current_active_user)
):
    """Get current TOTP code (for testing/demo purposes only)"""
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    code = generate_totp(current_user.two_factor_secret)
    return {"code": code, "valid_for": 30 - (int(time.time()) % 30)}

