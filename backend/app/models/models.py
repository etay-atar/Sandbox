"""
Database Models
===============
Defines the SQLAlchemy ORM models for the application.
"""
import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.db.session import Base

# Enums (must correspond to Database Enums)
class UserRole(str, enum.Enum):
    ANALYST = "Analyst"
    ADMIN = "Admin"
    SERVICE = "Service"

class SubmissionStatus(str, enum.Enum):
    QUEUED = "Queued"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"

class Verdict(str, enum.Enum):
    MALICIOUS = "Malicious"
    BENIGN = "Benign"
    SUSPICIOUS = "Suspicious"
    PENDING = "Pending"

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, default=UserRole.ANALYST) # Using String for simplicity, can use Enum object
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    submissions = relationship("Submission", back_populates="owner")

class Submission(Base):
    __tablename__ = "submissions"

    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    
    filename = Column(String, nullable=False)
    file_hash_sha256 = Column(String(64), index=True, nullable=False)
    status = Column(String, default=SubmissionStatus.QUEUED, index=True) 
    final_verdict = Column(String, default=Verdict.PENDING)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owner = relationship("User", back_populates="submissions")
