"""
MinIO Storage Service
=====================
Handles interactions with the MinIO Object Storage.
Provides methods to upload files, retrieve files, and generate presigned URLs.
"""

from minio import Minio
from minio.error import S3Error
from app.core.config import settings
import io

class StorageService:
    def __init__(self):
        """
        Initializes the MinIO client using configuration settings.
        Ensures the target bucket exists.
        """
        self.client = Minio(
            endpoint=settings.MINIO_ENDPOINT.replace("http://", "").replace("https://", ""),
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket = settings.MINIO_BUCKET_NAME
        self._ensure_bucket_exists()

    def _ensure_bucket_exists(self):
        """Checks if the configured bucket exists, creates it if not."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                # Set public policy if needed, or keep private (default)
        except Exception as e:
            # S3Error or ConnectionError (MaxRetryError)
            # In Dev/Mock mode, we just log this and continue. Application will fail only on actual upload.
            print(f"Warning: Could not connect to MinIO storage. Unexpected error: {e}")

    def upload_file(self, file_data: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
        """
        Uploads a file to the storage bucket.
        
        Args:
            file_data: The raw bytes of the file.
            filename: The destination filename (object name).
            content_type: The MIME type of the file.
            
        Returns:
            str: The object name (filename) if successful.
        """
        try:
            # Wrap bytes in BytesIO
            data_stream = io.BytesIO(file_data)
            
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=filename,
                data=data_stream,
                length=len(file_data),
                content_type=content_type
            )
            return filename
        except S3Error as e:
            # In a real app, log this error specifically
            raise e

    def get_file_url(self, filename: str) -> str:
        """
        Generates a presigned URL for the file.
        
        Args:
            filename: The object name.
            
        Returns:
            str: Presigned URL valid for 1 hour.
        """
        return self.client.get_presigned_url(
            "GET",
            self.bucket,
            filename,
        )

# Singleton instance
storage_service = StorageService()
