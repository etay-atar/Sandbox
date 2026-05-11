import asyncio
import logging
import sys

# Configure logging to output to console
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

from app.core.analysis.dynamic_analyzer import DynamicAnalyzer

async def test():
    analyzer = DynamicAnalyzer()
    print("[*] Testing VirtualBox Orchestration...")
    
    # We will test using the safe payload
    result = await analyzer.analyze(r"C:\Users\itaya\.gemini\antigravity\scratch\Sandbox\safe_test_payload.bat", "safe_test_payload.bat")
    
    import json
    print("\n--- FINAL RESULT ---")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    # Ensure app path is in sys.path
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
    
    asyncio.run(test())
