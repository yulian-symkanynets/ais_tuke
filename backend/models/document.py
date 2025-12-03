from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class DocumentType(str, enum.Enum):
    ASSIGNMENT = "assignment"
    THESIS_MATERIAL = "thesis_material"
    DORMITORY_APPLICATION = "dormitory_application"
    ENROLLMENT_PROOF = "enrollment_proof"
    GRADE_TRANSCRIPT = "grade_transcript"
    TUITION_INVOICE = "tuition_invoice"
    OTHER = "other"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    document_type = Column(SQLEnum(DocumentType), nullable=False)
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now())
    
    # Optional reference to related entities
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="SET NULL"), nullable=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="documents", passive_deletes=True)

