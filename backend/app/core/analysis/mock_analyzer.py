import random
import asyncio
import hashlib
from typing import Dict, Any
from app.core.analysis.base import AnalysisEngine
from app.models.models import Verdict

class MockAnalyzer(AnalysisEngine):
    """
    Simulates analysis with random delays and verdicts.
    Keeps the exact logic from Phase 1.
    """

    async def analyze(self, file_path: str, file_name: str) -> Dict[str, Any]:
        # Simulate processing time
        await asyncio.sleep(10)  # 10 seconds delay
        
        # Simple Logic: "malware" in name = Malicious
        if "eicar" in file_name.lower() or "malware" in file_name.lower():
            verdict = Verdict.MALICIOUS
            score = 100
        else:
            verdict = random.choice([Verdict.BENIGN, Verdict.SUSPICIOUS, Verdict.PENDING])
            score = random.randint(0, 50)

        # Mock Report Structure
        return {
            "engine": "MockAnalyzer",
            "verdict": verdict,
            "score": score,
            "details": {
                "file_name": file_name,
                "simulated_processing_time": "10s",
                "random_factor": random.random()
            }
        }
