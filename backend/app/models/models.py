"""
Database Models
===============
Defines the SQLAlchemy ORM models for the application.
"""
import uuid
import enum
from sqlalchemy import Column, String, Boolean, DateTime, Enum, ForeignKey, JSON, Float, Integer, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone

from app.db.session import Base

# Enums (must correspond to Database Enums)
class UserRole(str, enum.Enum):
    ANALYST = "Analyst"
    ADMIN = "Admin"
    SERVICE = "Service"
    AUDITOR = "Auditor"

class SubmissionStatus(str, enum.Enum):
    QUEUED = "Queued"
    PROCESSING = "Processing"
    COMPLETED = "Completed"
    FAILED = "Failed"
    RETRYING = "Retrying"

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
    file_type_magic = Column(String(50), nullable=True)  # Actual file type detected by magic bytes
    status = Column(String, default=SubmissionStatus.QUEUED, index=True) 
    final_verdict = Column(String, default=Verdict.PENDING)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    owner = relationship("User", back_populates="submissions")
    analysis_result = relationship("AnalysisResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    test_results = relationship("TestResult", back_populates="submission", cascade="all, delete-orphan")
    iocs = relationship("IOC", back_populates="submission", cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), unique=True, nullable=False)
    
    # Analysis Configuration
    analyzer_engine = Column(String, default="MOCK") # MOCK or REAL
    
    # High-level AI probability (0.0 to 1.0)
    ai_probability = Column(Float, nullable=True)
    
    # Structured Data
    static_analysis = Column(JSON, nullable=True) # PE Headers, Hashes, Strings
    yara_matches = Column(JSON, nullable=True)    # List of rule hits
    ai_analysis = Column(JSON, nullable=True)     # Threat Score, Entropy
    dynamic_analysis = Column(JSON, nullable=True) # Phase 3: Sandbox execution behavioral logs
    full_report_json = Column(JSONB, nullable=True) # Complete unstructured output (spec 3.2)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    submission = relationship("Submission", back_populates="analysis_result")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False, index=True) # e.g. "FILE_UPLOAD", "REPORT_VIEW", "LOGIN"
    details = Column(String, nullable=True) # Extra info (like submission_id or filename)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    user = relationship("User")

# --- Spec Section 3.2, Table 4: Test Results ---
class TestCategory(str, enum.Enum):
    STATIC = "Static"
    DYNAMIC = "Dynamic"
    AI = "AI"

class TestResult(Base):
    __tablename__ = "test_results"

    test_result_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False)

    test_name = Column(String(100), nullable=False)   # e.g., "Check Mutex Creation"
    category = Column(String, nullable=False)          # Static, Dynamic, AI
    test_status = Column(Boolean, nullable=False)      # TRUE if malicious behavior observed
    details = Column(String, nullable=True)            # Extra context

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    submission = relationship("Submission", back_populates="test_results")

# --- Spec Section 3.2, Table 5: IOCs ---
class IOCType(str, enum.Enum):
    IPV4 = "IPv4"
    IPV6 = "IPv6"
    DOMAIN = "Domain"
    URL = "URL"
    FILE_HASH = "FileHash"
    MUTEX = "Mutex"
    REGISTRY_KEY = "RegistryKey"

class IOC(Base):
    __tablename__ = "iocs"

    ioc_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), ForeignKey("submissions.submission_id", ondelete="CASCADE"), nullable=False)

    type = Column(String, nullable=False)              # IPv4, Domain, FileHash, etc.
    value = Column(String(1024), nullable=False)       # The actual indicator value
    confidence_score = Column(Integer, nullable=True)  # 0-100

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    submission = relationship("Submission", back_populates="iocs")

# --- Performance Indexes (Spec Section 3.3) ---
# Partial index for workers to quickly find active jobs
idx_submissions_active = Index(
    'idx_submissions_status_active',
    Submission.status,
    postgresql_where=(Submission.status.in_([SubmissionStatus.QUEUED, SubmissionStatus.PROCESSING]))
)
