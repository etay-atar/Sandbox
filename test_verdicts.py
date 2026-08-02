import requests
import os

API_BASE = "http://localhost:8000/api/v1"
login_data = {"username": "e2etester", "password": "Password123!"}
r = requests.post(f"{API_BASE}/auth/login", data=login_data)
token = r.json().get("access_token")
headers = {"Authorization": f"Bearer {token}"}

for filename in ["test_payload_913ee1a5.exe", "test_payload_bb01a168.exe"]:
    filepath = os.path.join(r"C:\Users\itaya\.gemini\antigravity\scratch\Sandbox\backend", filename)
    if not os.path.exists(filepath): continue
    with open(filepath, "rb") as f:
        files = {"file": (filename, f, "application/octet-stream")}
        r = requests.post(f"{API_BASE}/submissions/", files=files, headers=headers)
    sub_id = r.json().get("submission_id")
    print(f"Uploaded {filename}, sub_id={sub_id}")
    
    import time
    status = "QUEUED"
    while status in ["QUEUED", "PROCESSING"]:
        time.sleep(1)
        r_status = requests.get(f"{API_BASE}/submissions/{sub_id}/status", headers=headers)
        status = r_status.json().get("status")
    
    r_report = requests.get(f"{API_BASE}/submissions/{sub_id}/report", headers=headers)
    print(f"{filename} verdict: {r_report.json().get('verdict')}")
