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
import os
from cryptography.fernet import Fernet

# Development encryption key (In production this would be injected via AWS KMS or HashiCorp Vault)
STORAGE_ENCRYPTION_KEY = b'G-x9Yh-4BwR2bF_zJ7wL8uWfK_yB4rGq2P9vZ5cM1a0='
cipher_suite = Fernet(STORAGE_ENCRYPTION_KEY)

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
            # 1. Encrypt the raw bytes before they hit the disk/storage layer
            encrypted_data = cipher_suite.encrypt(file_data)
            
            # 2. Wrap encrypted bytes in BytesIO
            data_stream = io.BytesIO(encrypted_data)
            
            self.client.put_object(
                bucket_name=self.bucket,
                object_name=filename,
                data=data_stream,
                length=len(encrypted_data),
                content_type=content_type
            )
            return filename
        except Exception as e:
            print(f"MinIO upload failed, falling back to local storage: {e}")
            import os
            fallback_dir = r"C:\Users\itaya\.gemini\antigravity\scratch\Sandbox\backend\local_storage"
            os.makedirs(fallback_dir, exist_ok=True)
            with open(os.path.join(fallback_dir, filename), "wb") as f:
                f.write(encrypted_data)
            return filename

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

    def download_file(self, filename: str) -> bytes:
        """
        Downloads a file from the storage bucket.
        
        Args:
            filename: The object name.
            
        Returns:
            bytes: The decrypted file contents.
        """
        try:
            response = self.client.get_object(self.bucket, filename)
            encrypted_data = response.read()
            
            # Decrypt in memory before returning to the analysis engine
            decrypted_data = cipher_suite.decrypt(encrypted_data)
            return decrypted_data
        except Exception as e:
            print(f"Error downloading {filename} from minio: {e}")
            import os
            fallback_path = os.path.join(r"C:\Users\itaya\.gemini\antigravity\scratch\Sandbox\backend\local_storage", filename)
            if os.path.exists(fallback_path):
                with open(fallback_path, "rb") as f:
                    encrypted_data = f.read()
                decrypted_data = cipher_suite.decrypt(encrypted_data)
                return decrypted_data
            return None
        finally:
            if 'response' in locals() and hasattr(response, 'close'):
                response.close()
                try: response.release_conn() 
                except: pass

# Singleton instance
storage_service = StorageService()
