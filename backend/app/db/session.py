"""
Database Session Configuration
==============================
This module sets up the standard SQLAlchemy 'Engine' and 'SessionLocal'.
Since we are using FastAPI, we prioritize AsyncIO to avoid blocking the event loop 
during database queries.
"""

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.core.config import settings

# 1. Create the Async Engine
# echo=True will log generated SQL queries to the console (useful for debugging)
engine = create_async_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    echo=True, # Set to False in production
    future=True
)

# 2. Create the Session Factory
# This factory generates new AsyncSession instances for each request.
SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# 3. Create the Declarative Base
# All database models will inherit from this Base class.
Base = declarative_base()

# 4. Dependency Injection
# This function is used by FastAPI "Depends()" to provide a database session
# to any endpoint that needs it. It assumes control of the session lifecycle (open -> yield -> close).
async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            # Ensure the session is closed even if an error occurs
            await session.close()
