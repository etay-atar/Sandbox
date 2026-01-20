import requests
import json

auth_url = "http://localhost:8000/api/v1/auth/login"
session = requests.Session()
data = {"username": "Analyst", "password": "password123"}
r = session.post(auth_url, data=data) 
token = r.json()['access_token']
headers = {'Authorization': f"Bearer {token}"}

# List Submissions
r_list = session.get("http://localhost:8000/api/v1/submissions/", headers=headers)
print("--- Submissions List ---")
print(json.dumps(r_list.json(), indent=2))
