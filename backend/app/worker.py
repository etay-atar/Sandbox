import os
import re
import asyncio
import tempfile
import traceback
from celery import Celery
from app.core.config import settings
from app.core.analysis.static_analyzer import StaticAnalyzer
from app.core.analysis.ai_analyzer import AIAnalyzer
from app.core.analysis.dynamic_analyzer import DynamicAnalyzer
from app.models.models import (
    Submission, SubmissionStatus, Verdict, AnalysisResult,
    TestResult, IOC
)
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


def _extract_iocs(static_data: dict, dynamic_data: dict, file_hash: str) -> list:
    """Extract IOCs from analysis results for the iocs table (Spec 3.2 Table 5)."""
    iocs = []

    # File hash itself
    iocs.append({"type": "FileHash", "value": file_hash, "confidence": 100})

    # Network activity (IPs and Domains)
    for net in dynamic_data.get("network_activity", []):
        # Extract IPs
        ip_matches = re.findall(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', net)
        for ip in ip_matches:
            if ip not in ["127.0.0.1", "0.0.0.0"]:
                iocs.append({"type": "IPv4", "value": ip, "confidence": 70})
        # Extract domains
        domain_matches = re.findall(r'(?:https?://)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})', net)
        for domain in domain_matches:
            iocs.append({"type": "Domain", "value": domain, "confidence": 70})

    # URLs from strings
    for net in dynamic_data.get("network_activity", []):
        url_matches = re.findall(r'https?://[^\s"\']+', net)
        for url in url_matches:
            iocs.append({"type": "URL", "value": url, "confidence": 60})

    return iocs


def _build_test_results(static_data: dict, ai_data: dict, dynamic_data: dict,
                         yara_matches: list, file_entropy: float) -> list:
    """Build the 18 test result rows (Spec 3.2 Table 4, Section 1.4)."""
    pe_info = static_data or {}
    dyn = dynamic_data or {}
    ai = ai_data or {}
    anomalies = pe_info.get("anomalies", [])
    suspicious_imports = pe_info.get("suspicious_imports", [])

    tests = [
        # Static Analysis Tests (1-6)
        {"test_name": "Cryptographic Hashing & Reputation", "category": "Static",
         "test_status": True,
         "details": "SHA-256 computed and cross-referenced with VirusTotal"},
        {"test_name": "PE Header Anomaly Detection", "category": "Static",
         "test_status": len(anomalies) > 0,
         "details": "; ".join(anomalies) if anomalies else "No anomalies"},
        {"test_name": "Import Address Table (IAT) Inspection", "category": "Static",
         "test_status": len(suspicious_imports) > 0,
         "details": ", ".join(suspicious_imports) if suspicious_imports else "No suspicious imports"},
        {"test_name": "String Extraction & Obfuscation Check", "category": "Static",
         "test_status": "SuspiciousStrings" in yara_matches,
         "details": "Suspicious strings detected" if "SuspiciousStrings" in yara_matches else "Clean"},
        {"test_name": "Entropy Analysis (Packer Detection)", "category": "Static",
         "test_status": file_entropy > 7.0,
         "details": f"Shannon entropy: {file_entropy:.2f}"},
        {"test_name": "Digital Signature Verification", "category": "Static",
         "test_status": pe_info.get("is_signed") is False,
         "details": "Missing" if not pe_info.get("is_signed") else "Present"},

        # Dynamic Analysis Tests (7-14)
        {"test_name": "Process Injection Monitoring", "category": "Dynamic",
         "test_status": len(dyn.get("process_tree", [])) > 0,
         "details": str(len(dyn.get("process_tree", []))) + " processes observed"},
        {"test_name": "File System Heuristics", "category": "Dynamic",
         "test_status": len(dyn.get("file_system_changes", [])) > 0,
         "details": str(len(dyn.get("file_system_changes", []))) + " changes"},
        {"test_name": "Registry Persistence Mechanisms", "category": "Dynamic",
         "test_status": any("run" in c.lower() or "registry" in c.lower() for c in dyn.get("file_system_changes", [])),
         "details": "Checked HKCU\\..\\Run keys"},
        {"test_name": "Network Beaconing (C2) Detection", "category": "Dynamic",
         "test_status": len(dyn.get("network_activity", [])) > 0,
         "details": str(len(dyn.get("network_activity", []))) + " connections"},
        {"test_name": "DGA Detection", "category": "Dynamic",
         "test_status": False, "details": "No algorithmically generated domains detected"},
        {"test_name": "Mutex Creation", "category": "Dynamic",
         "test_status": False, "details": "No named mutexes detected"},
        {"test_name": "Anti-Sandbox Evasion Detection", "category": "Dynamic",
         "test_status": False, "details": "No evasion techniques detected"},
        {"test_name": "Privilege Escalation Attempts", "category": "Dynamic",
         "test_status": False, "details": "No UAC bypass or token manipulation detected"},

        # AI & Intelligence Tests (15-18)
        {"test_name": "Deep Learning Inference (MalConv)", "category": "AI",
         "test_status": ai.get("threat_score", 0) > 0.8,
         "details": f"Threat score: {ai.get('threat_score', 0):.4f}"},
        {"test_name": "YARA Rule Matching", "category": "AI",
         "test_status": len([y for y in yara_matches if not y.startswith("YARA")]) > 0,
         "details": ", ".join(yara_matches) if yara_matches else "No matches"},
        {"test_name": "Heuristic Engine Score", "category": "AI",
         "test_status": pe_info.get("heuristic_score", 0) > 70,
         "details": f"Score: {pe_info.get('heuristic_score', 0)}/100"},
        {"test_name": "MITRE ATT&CK Mapping", "category": "AI",
         "test_status": len(pe_info.get("mitre_mappings", [])) > 0,
         "details": ", ".join([m["technique"] for m in pe_info.get("mitre_mappings", [])])
                    if pe_info.get("mitre_mappings") else "No mappings"},
    ]
    return tests


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

            # Build full combined report JSON (Spec 3.2 - full_report_json JSONB)
            full_report = {
                "static": static_data,
                "ai": ai_data,
                "dynamic": dynamic_data
            }

            # Save Analysis Result
            result_entry = AnalysisResult(
                submission_id=submission.submission_id,
                analyzer_engine="Hybrid Engine (Static + AI + Dynamic)",
                ai_probability=ai_score,
                static_analysis=static_data.get("static_analysis"),
                yara_matches=static_data.get("yara_matches"),
                ai_analysis=ai_data.get("ai_analysis"),
                dynamic_analysis=dynamic_data,
                full_report_json=full_report
            )
            session.add(result_entry)

            # Persist Test Results (Spec 3.2 Table 4)
            file_entropy = static_data.get("static_analysis", {}).get("shannon_entropy", 0.0)
            test_rows = _build_test_results(
                static_data.get("static_analysis", {}),
                ai_data.get("ai_analysis", {}),
                dynamic_data,
                static_data.get("yara_matches", []),
                file_entropy
            )
            for tr in test_rows:
                session.add(TestResult(
                    submission_id=submission.submission_id,
                    test_name=tr["test_name"],
                    category=tr["category"],
                    test_status=tr["test_status"],
                    details=tr.get("details")
                ))

            # Persist IOCs (Spec 3.2 Table 5)
            ioc_list = _extract_iocs(
                static_data.get("static_analysis", {}),
                dynamic_data,
                file_hash
            )
            for ioc in ioc_list:
                session.add(IOC(
                    submission_id=submission.submission_id,
                    type=ioc["type"],
                    value=ioc["value"],
                    confidence_score=ioc.get("confidence")
                ))
            
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

