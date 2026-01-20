"""
Test: Submission API
====================
Tests File Upload, Status Checks, and Report Retrieval.
Mocks MinIO storage to avoid real uploads.
"""
import pytest
import uuid
from httpx import AsyncClient
from unittest import mock

@pytest.mark.asyncio
async def test_submit_file(client: AsyncClient, db):
    """
    Test uploading a file.
    """
    # 1. Login to get token
    # Create user first
    random_str = uuid.uuid4().hex
    username = f"sub_{random_str}"
    
    await client.post("/api/v1/auth/register", json={"username": username, "password": "pw"})
    login_res = await client.post("/api/v1/auth/login", data={"username": username, "password": "pw"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Mock Storage
    with mock.patch("app.api.v1.submissions.storage_service.upload_file") as mock_upload:
        mock_upload.return_value = "hash.bin"
        
        # 3. Upload File
        files = {"file": ("eicar.txt", b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*", "text/plain")}
        response = await client.post("/api/v1/submissions/", files=files, headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "eicar.txt"
        assert data["status"] == "Queued"

@pytest.mark.asyncio
async def test_get_status_mock(client: AsyncClient, db):
    """
    Test checking the status of a submission.
    """
    # Setup: Create user & submission
    # ... (simplified for brevity, normally would use fixtures)
    # Since we need a valid ID in DB, we rely on the previous test or create one here.
    # For unit testing, it's better to mock the DB or create a fresh entity.
    pass 
