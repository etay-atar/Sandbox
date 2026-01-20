import requests

url = "http://localhost:8000/api/v1/submissions/"
files = {'file': ('uat_test.txt', 'This is a User Acceptance Test file content.', 'text/plain')}
# We need to register/login first to get a token, or assumes auth is disabled? 
# Wait, auth is enabled. The script needs a token.
# Let's just use the same creds: Analyst/password123

auth_url = "http://localhost:8000/api/v1/auth/login"
session = requests.Session()
data = {"username": "Analyst", "password": "password123"}
r = session.post(auth_url, data=data) 
token = r.json()['access_token']

headers = {'Authorization': f"Bearer {token}"}
r_upload = session.post(url, files=files, headers=headers)
print(f"Upload Status: {r_upload.status_code}")
print(r_upload.json())
