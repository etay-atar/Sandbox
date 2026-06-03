import asyncio
import os
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.models import Submission

# Async DB setup
engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, echo=False)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def purge_old_binaries(days: int = 30):
    """
    Finds all submissions older than `days` and deletes their corresponding binaries from MinIO/Storage.
    The metadata in the database remains intact.
    """
    print(f"Starting purge of binaries older than {days} days...")
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Import storage service here to avoid circular imports if run directly
    from app.services.storage import storage_service
    
    async with AsyncSessionLocal() as db:
        # Find submissions older than cutoff
        result = await db.execute(
            select(Submission).where(Submission.created_at < cutoff_date)
        )
        old_submissions = result.scalars().all()
        
        purged_count = 0
        for sub in old_submissions:
            filename = f"{sub.file_hash_sha256}.bin"
            try:
                # Assuming MinioClient has a remove_object method or storage_service has a delete method
                # We'll use the raw client to delete
                storage_service.client.remove_object(storage_service.bucket_name, filename)
                print(f"Deleted {filename} from storage.")
                purged_count += 1
            except Exception as e:
                # Object might already be deleted or not found
                pass
                
        print(f"Purge complete. {purged_count} binaries removed.")

if __name__ == "__main__":
    asyncio.run(purge_old_binaries())
