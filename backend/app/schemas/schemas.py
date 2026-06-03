"""
API Schemas (Pydantic Models)
=============================
Defines the structure and validation rules for API request and response bodies.
"""
from pydantic import BaseModel, EmailStr, UUID4
from typing import Optional, List
from datetime import datetime
from app.models.models import UserRole, SubmissionStatus, Verdict

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.ANALYST

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: UUID4
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: UserRole

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None

# --- Submission Schemas ---
class SubmissionBase(BaseModel):
    pass 

class SubmissionCreate(SubmissionBase):
    pass # File is handled via Multipart/Form-Data

class SubmissionResponse(BaseModel):
    submission_id: UUID4
    filename: str
    file_hash_sha256: str
    file_type_magic: Optional[str] = None
    status: SubmissionStatus
    final_verdict: str
    created_at: datetime

    class Config:
        from_attributes = True

class AnalysisStatus(BaseModel):
    status: SubmissionStatus
    progress: int # 0-100

# --- Test Result Schemas (Spec Section 3.2, Table 4) ---
class TestResultResponse(BaseModel):
    test_name: str
    category: str
    test_status: bool
    details: Optional[str] = None

    class Config:
        from_attributes = True

# --- IOC Schemas (Spec Section 3.2, Table 5) ---
class IOCResponse(BaseModel):
    ioc_id: UUID4
    type: str
    value: str
    confidence_score: Optional[int] = None

    class Config:
        from_attributes = True
