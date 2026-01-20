"""
Test: Storage Service
=====================
Tests the MinIO storage service wrapper.
Uses 'unittest.mock' to mock the actual MinIO client, preventing real network calls.
"""
from unittest import mock
import io
from app.services.storage import StorageService

def test_storage_upload():
    """
    Test that the upload_file method correctly calls the MinIO client.
    """
    # Mock the MinIO client inside the StorageService
    with mock.patch("app.services.storage.Minio") as MockMinio:
        # Mock instance
        mock_client = MockMinio.return_value
        mock_client.bucket_exists.return_value = True

        service = StorageService()
        
        file_content = b"test malicious content"
        filename = "virus.exe"
        
        service.upload_file(file_content, filename)
        
        # Verify put_object was called
        mock_client.put_object.assert_called_once()
        args, kwargs = mock_client.put_object.call_args
        
        assert kwargs["bucket_name"] == service.bucket
        assert kwargs["object_name"] == filename
        # Verify length
        assert kwargs["length"] == len(file_content)

def test_ensure_bucket_creation():
    """
    Test that the bucket is created if it does not exist.
    """
    with mock.patch("app.services.storage.Minio") as MockMinio:
        mock_client = MockMinio.return_value
        # Simulate bucket NOT existing
        mock_client.bucket_exists.return_value = False
        
        service = StorageService()
        
        mock_client.make_bucket.assert_called_once_with(service.bucket)
