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
from app.core.analysis.mock_analyzer import MockAnalyzer
from app.core.analysis.static_analyzer import StaticAnalyzer
from app.models.models import AnalysisResult

# Configuration (Could be moved to settings)
ANALYSIS_MODE = "REAL"  # Options: MOCK, REAL

mock_analyzer = MockAnalyzer()
real_analyzer = StaticAnalyzer()

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
    
    # Only return existing if it succeeded or is processing.
    # If it failed, we want to try again (ignore it).
    if existing_submission and existing_submission.status != SubmissionStatus.FAILED:
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
    
    # 5. Trigger Analysis (Hybrid Strategy)
    # In a real async system, this would be a Celery task.
    # Here we await it directly for simplicity, or background task.
    
    analyzer = real_analyzer if ANALYSIS_MODE == "REAL" else mock_analyzer
    
    # Run Analysis
    try:
        # We need the temp file path or download from MinIO. 
        # For efficiency in this monolithic demo, we can save temp file.
        import os
        import tempfile
        
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name
            
        analysis_data = await analyzer.analyze(tmp_path, file.filename)
        
        # Cleanup (Best Effort)
        try:
            os.unlink(tmp_path)
        except Exception as cleanup_error:
            # On Windows, this is common if scanners lock the file. 
            # We log it but do NOT fail the submission.
            print(f"Warning: Could not delete temp file {tmp_path}: {cleanup_error}")
        
        # Save Results
        result_entry = AnalysisResult(
            submission_id=submission.submission_id,
            analyzer_engine=analysis_data["engine"],
            static_analysis=analysis_data.get("static_analysis"),
            yara_matches=analysis_data.get("yara_matches"),
            ai_analysis=analysis_data.get("ai_analysis")
        )
        db.add(result_entry)
        
        # Update Submission
        submission.status = SubmissionStatus.COMPLETED
        submission.final_verdict = analysis_data.get("verdict", Verdict.PENDING)
        
        await db.commit()
        
    except Exception as e:
        import traceback
        # Use absolute path for debug log
        error_log_path = r"C:\Users\itaya\.gemini\antigravity\scratch\Sandbox\backend\debug_error.txt"
        with open(error_log_path, "w") as f:
            f.write(traceback.format_exc())
            f.write(str(e))
        print(f"Analysis Failed: {e}")
        submission.status = SubmissionStatus.FAILED
        submission.final_verdict = f"ERROR: {str(e)}"
        await db.commit()

    return submission

@router.get("/{submission_id}/status", response_model=schemas.AnalysisStatus)
async def get_submission_status(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get the status of a submission.
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

    return {
        "status": submission.status,
        "progress": 100 if submission.status in [SubmissionStatus.COMPLETED, SubmissionStatus.FAILED] else 50
    }

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
        
    if submission.status == SubmissionStatus.FAILED:
        return {
            "submission_id": str(submission.submission_id),
            "status": "Failed",
            "error": submission.final_verdict
        }

    if submission.status != SubmissionStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Analysis still in progress")
        
    # Check for real analysis result
    result_query = await db.execute(select(AnalysisResult).where(AnalysisResult.submission_id == u_id))
    analysis_result = result_query.scalars().first()
    
    if analysis_result:
        return {
            "submission_id": str(submission.submission_id),
            "filename": submission.filename,
            "file_sha256": submission.file_hash_sha256,
            "verdict": submission.final_verdict,
            "engine": analysis_result.analyzer_engine,
            "static_analysis": analysis_result.static_analysis,
            "yara_matches": analysis_result.yara_matches,
            "ai_analysis": analysis_result.ai_analysis
        }

    # Fallback to MOCK REPORT DATA (Legacy)
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
