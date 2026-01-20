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

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

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
    status: SubmissionStatus
    final_verdict: Verdict
    created_at: datetime
    # We might add file_hash_sha256 if needed

    class Config:
        from_attributes = True

class AnalysisStatus(BaseModel):
    status: SubmissionStatus
    progress: int # 0-100
