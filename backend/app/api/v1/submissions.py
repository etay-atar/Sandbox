"""
Submission API Routes
=====================
Endpoints for submitting files and checking analysis status.
Includes 'Mock' logic for simulating analysis delay.
"""
from typing import Any, List
import hashlib
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.api import deps
from app.db.session import get_db
from app.models.models import User, Submission, SubmissionStatus, Verdict
from app.schemas import schemas
from app.services.storage import storage_service

router = APIRouter()

@router.get("/", response_model=List[schemas.SubmissionResponse])
async def get_submissions(
    skip: int = 0,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve recent submissions.
    """
    result = await db.execute(
        select(Submission)
        .order_by(desc(Submission.created_at))
        .offset(skip)
        .limit(limit)
    )
    submissions = result.scalars().all()
    return submissions

@router.post("/", response_model=schemas.SubmissionResponse)
async def submit_file(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
    file: UploadFile = File(...)
) -> Any:
    """
    Upload a file for analysis.
    Steps:
    1. Read file & Calculate Hash.
    2. Check Deduplication (if hash exists).
    3. Upload to MinIO.
    4. Create DB Entry.
    5. Push to Queue (Mock: Just set status to Queued).
    """
    # 1. Read File
    contents = await file.read()
    sha256_hash = hashlib.sha256(contents).hexdigest()
    
    # 2. Deduplication Check
    result = await db.execute(select(Submission).where(Submission.file_hash_sha256 == sha256_hash))
    existing_submission = result.scalars().first()
    if existing_submission:
        # In a real system, we might return the old report, or create a new submission pointing to existing file.
        # For simplicity, we return existing submission metadata
        return existing_submission

    # 3. Upload to MinIO
    # We use the hash as the object name to enforce uniqueness in storage
    storage_filename = f"{sha256_hash}.bin"
    storage_service.upload_file(contents, storage_filename)
    
    # 4. Create DB Entry
    submission = Submission(
        filename=file.filename,
        file_hash_sha256=sha256_hash,
        user_id=current_user.user_id,
        status=SubmissionStatus.QUEUED,
        final_verdict=Verdict.PENDING
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    # 5. Push to Queue (TODO: Implement Celery)
    # For MOCK purposes: We will leave it as QUEUED. 
    # A background script or the 'status' endpoint could simulate progress.
    
    return submission

@router.get("/{submission_id}/status", response_model=schemas.AnalysisStatus)
async def get_submission_status(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the status of a submission.
    MOCK: Randomly advances the status for demonstration purposes if it's not complete.
    """
    import random # For mock logic
    
    try:
        # Convert str to UUID
        import uuid
        u_id = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    result = await db.execute(select(Submission).where(Submission.submission_id == u_id))
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    # --- MOCK LOGIC START ---
    # Simulate progress if we check status. 
    if submission.status == SubmissionStatus.QUEUED:
        submission.status = SubmissionStatus.PROCESSING
        await db.commit()
        return {"status": SubmissionStatus.PROCESSING, "progress": 10}
        
    if submission.status == SubmissionStatus.PROCESSING:
        # Simulate work done
        # Ideally this should be done by the worker, but allowed for 'Mock Backend' requirement.
        roll = random.randint(1, 10)
        if roll > 7:
            submission.status = SubmissionStatus.COMPLETED
            submission.final_verdict = Verdict.MALICIOUS
            await db.commit()
            return {"status": SubmissionStatus.COMPLETED, "progress": 100}
        else:
             return {"status": SubmissionStatus.PROCESSING, "progress": 50}
    # --- MOCK LOGIC END ---

    return {"status": submission.status, "progress": 100 if submission.status == SubmissionStatus.COMPLETED else 0}

@router.get("/{submission_id}/report", response_model=dict)
async def get_submission_report(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Retrieve the final analysis report.
    MOCK: Returns a static dummy report if completed.
    """
    try:
        import uuid
        u_id = uuid.UUID(submission_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid UUID")

    result = await db.execute(select(Submission).where(Submission.submission_id == u_id))
    submission = result.scalars().first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if submission.status != SubmissionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Analysis still in progress")
        
    # MOCK REPORT DATA
    return {
        "submission_id": str(submission.submission_id),
        "verdict": submission.final_verdict,
        "score": 98.5 if submission.final_verdict == Verdict.MALICIOUS else 0.0,
        "static_analysis": {
            "has_pe_header": True,
            "suspicious_imports": ["VirtualAlloc", "WriteProcessMemory"],
            "entropy": 7.8
        },
        "dynamic_analysis": {
            "network_connections": ["192.168.1.105", "evil-site.com"],
            "file_changes": ["C:\\Windows\\Temp\\malware.exe"]
        },
        "ai_analysis": {
            "model": "MalConv-v1",
            "confidence": 0.99
        }
    }
