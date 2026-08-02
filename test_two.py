import os
import time
import requests

API_BASE = "http://localhost:8000/api/v1"
TEST_FILES = ["Suspicious.bat", "Malicious.bat"]

def run_test():
    print("Starting Focused Test...")
    login_data = {"username": "e2etester", "password": "Password123!"}
    r = requests.post(f"{API_BASE}/auth/login", data=login_data)
    token = r.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    tracking = {}
    
    # Upload files
    for filename in TEST_FILES:
        filepath = os.path.join(os.getcwd(), filename)
        
        # Cache buster
        with open(filepath, "a") as fw:
            fw.write(f"\\nREM CACHE_BUSTER_{int(time.time())}\\n")
            
        with open(filepath, "rb") as f:
            files = {"file": (filename, f, "application/octet-stream")}
            r = requests.post(f"{API_BASE}/submissions/", files=files, headers=headers)
            
        if r.status_code == 200:
            sub_id = r.json().get("submission_id")
            tracking[filename] = sub_id
            print(f"[*] Uploaded {filename} -> ID: {sub_id}")
        else:
            print(f"[FAIL] Could not upload {filename}: {r.text}")

    print("\\nWaiting for backend to process...")
    
    for filename, sub_id in tracking.items():
        while True:
            r_status = requests.get(f"{API_BASE}/submissions/{sub_id}/status", headers=headers)
            status = r_status.json().get("status")
            if status.upper() in ["QUEUED", "PROCESSING"]:
                time.sleep(5)
            else:
                break
                
        if status.upper() == "COMPLETED":
            r_report = requests.get(f"{API_BASE}/submissions/{sub_id}/report", headers=headers)
            data = r_report.json()
            verdict = data.get("verdict")
            combined_score = data.get("combined_score")
            print(f"\\n--- {filename} ---")
            print(f"Final Verdict: {verdict}")
            print(f"Static Score: {data.get('static_analysis', {}).get('score')}")
            print(f"Dynamic Score: {data.get('dynamic_analysis', {}).get('risk_score')}")
            print(f"YARA Hits: {data.get('yara_matches')}")
        else:
            print(f"\\n--- {filename} ---")
            print(f"Failed: {status}")

if __name__ == "__main__":
    run_test()
