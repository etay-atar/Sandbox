import os
import asyncio
import tempfile
import traceback
from celery import Celery
from app.core.config import settings
from app.core.analysis.static_analyzer import StaticAnalyzer
from app.core.analysis.ai_analyzer import AIAnalyzer
from app.core.analysis.dynamic_analyzer import DynamicAnalyzer
from app.models.models import Submission, SubmissionStatus, Verdict, AnalysisResult
from app.db.session import SessionLocal
from app.services.storage import storage_service

# Initialize Celery app using Redis
celery_app = Celery(
    "sandbox_worker",
    broker=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/0",
    backend=f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}/1"
)

# Optional configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

real_analyzer = StaticAnalyzer()
ai_analyzer = AIAnalyzer()
dynamic_analyzer = DynamicAnalyzer()

async def async_analyze_submission(submission_id_str: str, file_hash: str, filename: str):
    """
    Async helper to perform analysis and update the database.
    """
    import uuid
    sub_id = uuid.UUID(submission_id_str)
    
    try:
        # Download file from MinIO to temp file
        object_name = f"{file_hash}.bin"
        file_data = storage_service.download_file(object_name)
        
        if not file_data:
            raise Exception("File not found in storage.")
            
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(file_data)
            tmp_path = tmp.name
            
        # Run Analysis
        static_task = real_analyzer.analyze(tmp_path, filename)
        ai_task = ai_analyzer.analyze(tmp_path, filename)
        dynamic_task = dynamic_analyzer.analyze(tmp_path, filename)
        static_data, ai_data, dynamic_data = await asyncio.gather(static_task, ai_task, dynamic_task)
        
        # Cleanup
        try:
            os.unlink(tmp_path)
        except Exception as e:
            print(f"Failed to delete temp file {tmp_path}: {e}")
            pass
            
        async with SessionLocal() as session:
            # Re-fetch submission inside session
            from sqlalchemy import select
            result = await session.execute(select(Submission).where(Submission.submission_id == sub_id))
            submission = result.scalars().first()
            
            if not submission:
                print(f"Submission {sub_id} not found in DB.")
                return

            # Combine final verdict logic
            final_verdict = static_data.get("verdict", Verdict.BENIGN)
            ai_score = ai_data.get("ai_analysis", {}).get("threat_score", 0.0)
            
            # Dynamic triggers
            dyn_status = dynamic_data.get("status")
            dyn_risk = dynamic_data.get("risk_score", 0.0)
            
            if final_verdict != Verdict.MALICIOUS: # Don't downgrade if YARA caught it
                # High AI score OR High Dynamic Risk Score elevates to Malicious
                if ai_score >= 0.85 or dyn_risk >= 70.0:
                    final_verdict = Verdict.MALICIOUS
                elif ai_score >= 0.6 or dyn_risk >= 40.0:
                    final_verdict = Verdict.SUSPICIOUS

            # Save Results
            result_entry = AnalysisResult(
                submission_id=submission.submission_id,
                analyzer_engine="Hybrid Engine (Static + AI + Dynamic)",
                static_analysis=static_data.get("static_analysis"),
                yara_matches=static_data.get("yara_matches"),
                ai_analysis=ai_data.get("ai_analysis"),
                dynamic_analysis=dynamic_data
            )
            session.add(result_entry)
            
            # Update Submission
            submission.status = SubmissionStatus.COMPLETED
            submission.final_verdict = final_verdict
            
            await session.commit()
            return f"Analysis complete for {sub_id}"

    except Exception as e:
        error_msg = str(e)
        traceback.print_exc()
        # Fallback update to FAILED state
        try:
            async with SessionLocal() as session:
                from sqlalchemy import select
                result = await session.execute(select(Submission).where(Submission.submission_id == sub_id))
                submission = result.scalars().first()
                if submission:
                    submission.status = SubmissionStatus.FAILED
                    submission.final_verdict = f"ERROR: {error_msg}"
                    await session.commit()
        except Exception as db_err:
            print(f"Failed to mark submission as failed: {db_err}")
            
        return f"Analysis failed for {sub_id}: {error_msg}"


@celery_app.task(name="analyze_file")
def analyze_file_task(submission_id_str: str, file_hash: str, filename: str):
    """
    Celery task that acts as a synchronous wrapper to call the async analysis code.
    """
    # Create an event loop and run the async helper
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(async_analyze_submission(submission_id_str, file_hash, filename))
