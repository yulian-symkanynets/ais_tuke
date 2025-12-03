import os
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from io import BytesIO
from database import get_db
from auth import get_current_active_user, require_admin
from models.user import User, UserRole
from models.document import Document, DocumentType
from models.enrollment import Enrollment
from models.grade import Grade
from models.subject import Subject
from models.activity_log import ActivityLog

router = APIRouter(prefix="/api/documents", tags=["Documents"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ============== SCHEMAS ==============

class DocumentResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    document_type: DocumentType
    description: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    message: str
    
    model_config = ConfigDict(from_attributes=True)


# ============== HELPER FUNCTIONS ==============

def generate_enrollment_proof_html(user: User, db: Session) -> str:
    """Generate HTML for enrollment proof"""
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
    
    subjects_html = ""
    for e in enrollments:
        subject = db.query(Subject).filter(Subject.id == e.subject_id).first()
        if subject:
            subjects_html += f"<tr><td>{subject.code}</td><td>{subject.name}</td><td>{e.semester}</td><td>{e.status.value}</td></tr>"
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Proof of Enrollment - AIS TUKE</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; }}
            h1 {{ color: #c41e3a; }}
            .header {{ border-bottom: 2px solid #c41e3a; padding-bottom: 20px; margin-bottom: 30px; }}
            .info {{ margin: 20px 0; }}
            .info p {{ margin: 5px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #c41e3a; color: white; }}
            .footer {{ margin-top: 50px; font-size: 12px; color: #666; }}
            .stamp {{ margin-top: 30px; padding: 20px; border: 2px solid #c41e3a; display: inline-block; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Technical University of Košice</h1>
            <h2>Proof of Enrollment</h2>
        </div>
        
        <div class="info">
            <p><strong>Student Name:</strong> {user.full_name or 'N/A'}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Student ID:</strong> {user.id}</p>
            <p><strong>Date Issued:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
        </div>
        
        <h3>Enrolled Subjects</h3>
        <table>
            <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Semester</th>
                <th>Status</th>
            </tr>
            {subjects_html}
        </table>
        
        <div class="stamp">
            <p><strong>OFFICIAL DOCUMENT</strong></p>
            <p>AIS TUKE Academic Information System</p>
            <p>{datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
        </div>
        
        <div class="footer">
            <p>This document was generated electronically and is valid without signature.</p>
            <p>Technical University of Košice, Letná 9, 042 00 Košice, Slovakia</p>
        </div>
    </body>
    </html>
    """


def generate_grade_transcript_html(user: User, db: Session) -> str:
    """Generate HTML for grade transcript"""
    grades = db.query(Grade).filter(Grade.student_id == user.id).all()
    
    grades_html = ""
    total_credits = 0
    weighted_sum = 0
    
    for g in grades:
        subject = db.query(Subject).filter(Subject.id == g.subject_id).first()
        if subject:
            credits = subject.credits or 0
            total_credits += credits
            weighted_sum += g.numeric_grade * credits
            grades_html += f"<tr><td>{subject.code}</td><td>{subject.name}</td><td>{credits}</td><td>{g.grade.value}</td><td>{g.numeric_grade:.2f}</td><td>{g.semester}</td></tr>"
    
    gpa = weighted_sum / total_credits if total_credits > 0 else 0
    
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Grade Transcript - AIS TUKE</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; }}
            h1 {{ color: #c41e3a; }}
            .header {{ border-bottom: 2px solid #c41e3a; padding-bottom: 20px; margin-bottom: 30px; }}
            .info {{ margin: 20px 0; }}
            .info p {{ margin: 5px 0; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 10px; text-align: left; }}
            th {{ background-color: #c41e3a; color: white; }}
            .summary {{ margin-top: 30px; padding: 20px; background: #f5f5f5; }}
            .footer {{ margin-top: 50px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Technical University of Košice</h1>
            <h2>Official Grade Transcript</h2>
        </div>
        
        <div class="info">
            <p><strong>Student Name:</strong> {user.full_name or 'N/A'}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Student ID:</strong> {user.id}</p>
            <p><strong>Date Issued:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
        </div>
        
        <h3>Academic Record</h3>
        <table>
            <tr>
                <th>Code</th>
                <th>Subject Name</th>
                <th>Credits</th>
                <th>Grade</th>
                <th>Points</th>
                <th>Semester</th>
            </tr>
            {grades_html}
        </table>
        
        <div class="summary">
            <p><strong>Total Credits:</strong> {total_credits}</p>
            <p><strong>GPA:</strong> {gpa:.2f}</p>
        </div>
        
        <div class="footer">
            <p>This document was generated electronically and is valid without signature.</p>
            <p>Technical University of Košice, Letná 9, 042 00 Košice, Slovakia</p>
        </div>
    </body>
    </html>
    """


# ============== UPLOAD ENDPOINTS ==============

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    document_type: DocumentType = Form(...),
    description: Optional[str] = Form(None),
    assignment_id: Optional[int] = Form(None),
    thesis_id: Optional[int] = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a document"""
    # Validate file type
    allowed_types = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "text/plain"
    ]
    
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: PDF, DOC, DOCX, JPEG, PNG, TXT"
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create document record
    doc = Document(
        user_id=current_user.id,
        filename=unique_filename,
        original_filename=file.filename,
        file_path=file_path,
        file_size=len(content),
        mime_type=file.content_type,
        document_type=document_type,
        description=description,
        assignment_id=assignment_id,
        thesis_id=thesis_id
    )
    db.add(doc)
    
    # Log activity
    log = ActivityLog(
        user_id=current_user.id,
        action="document_uploaded",
        details=f"Uploaded document: {file.filename} ({document_type.value})",
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(log)
    
    db.commit()
    db.refresh(doc)
    
    return DocumentUploadResponse(
        id=doc.id,
        filename=doc.original_filename,
        message="Document uploaded successfully"
    )


@router.get("/my-uploads", response_model=List[DocumentResponse])
def get_my_uploads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all documents uploaded by current user"""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()
    return docs


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete an uploaded document"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only owner or admin can delete
    if doc.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete file from disk
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    
    db.delete(doc)
    db.commit()
    return None


# ============== DOWNLOAD ENDPOINTS ==============

@router.get("/download/uploaded/{document_id}")
def download_uploaded_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download an uploaded document"""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Only owner or admin can download
    if doc.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if not os.path.exists(doc.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    return FileResponse(
        path=doc.file_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )


@router.get("/download/enrollment-proof")
def download_enrollment_proof(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download proof of enrollment as HTML (can be printed to PDF)"""
    html_content = generate_enrollment_proof_html(current_user, db)
    
    return StreamingResponse(
        BytesIO(html_content.encode()),
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename=enrollment_proof_{current_user.id}.html"
        }
    )


@router.get("/download/grade-transcript")
def download_grade_transcript(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download grade transcript as HTML (can be printed to PDF)"""
    html_content = generate_grade_transcript_html(current_user, db)
    
    return StreamingResponse(
        BytesIO(html_content.encode()),
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename=grade_transcript_{current_user.id}.html"
        }
    )


@router.get("/download/invoice/{payment_id}")
def download_invoice(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Download payment invoice as HTML"""
    from models.payment import Payment
    
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    # Only owner or admin can download
    if payment.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    user = db.query(User).filter(User.id == payment.user_id).first()
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice {payment.invoice_number} - AIS TUKE</title>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; }}
            h1 {{ color: #c41e3a; }}
            .header {{ border-bottom: 2px solid #c41e3a; padding-bottom: 20px; margin-bottom: 30px; }}
            .invoice-box {{ border: 1px solid #ddd; padding: 20px; margin: 20px 0; }}
            .info p {{ margin: 5px 0; }}
            .amount {{ font-size: 24px; color: #c41e3a; font-weight: bold; }}
            .status {{ padding: 5px 15px; border-radius: 5px; display: inline-block; }}
            .status-paid {{ background: #22c55e; color: white; }}
            .status-pending {{ background: #f97316; color: white; }}
            .footer {{ margin-top: 50px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Technical University of Košice</h1>
            <h2>Invoice</h2>
        </div>
        
        <div class="invoice-box">
            <div class="info">
                <p><strong>Invoice Number:</strong> {payment.invoice_number}</p>
                <p><strong>Date:</strong> {payment.created_at.strftime('%B %d, %Y') if payment.created_at else 'N/A'}</p>
                <p><strong>Due Date:</strong> {payment.due_date.strftime('%B %d, %Y') if payment.due_date else 'N/A'}</p>
            </div>
        </div>
        
        <div class="info">
            <h3>Bill To:</h3>
            <p><strong>Name:</strong> {user.full_name if user else 'N/A'}</p>
            <p><strong>Email:</strong> {user.email if user else 'N/A'}</p>
        </div>
        
        <div class="invoice-box">
            <h3>Payment Details</h3>
            <p><strong>Type:</strong> {payment.payment_type.value}</p>
            <p><strong>Description:</strong> {payment.description}</p>
            <p class="amount">Amount: €{payment.amount:.2f}</p>
            <p><strong>Status:</strong> 
                <span class="status {'status-paid' if payment.status.value == 'paid' else 'status-pending'}">
                    {payment.status.value.upper()}
                </span>
            </p>
            {'<p><strong>Paid Date:</strong> ' + payment.paid_date.strftime('%B %d, %Y') + '</p>' if payment.paid_date else ''}
            {'<p><strong>Payment Method:</strong> ' + payment.payment_method.value + '</p>' if payment.payment_method else ''}
        </div>
        
        <div class="footer">
            <p>This document was generated electronically.</p>
            <p>Technical University of Košice, Letná 9, 042 00 Košice, Slovakia</p>
        </div>
    </body>
    </html>
    """
    
    return StreamingResponse(
        BytesIO(html_content.encode()),
        media_type="text/html",
        headers={
            "Content-Disposition": f"attachment; filename=invoice_{payment.invoice_number}.html"
        }
    )

