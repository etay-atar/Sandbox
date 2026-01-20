"""
Pytest Configuration
====================
Sets up the test environment, including:
1. AsyncIO event loop management.
2. Database fixtures (Creating/Dropping tables).
3. FastAPI TestClient (AsyncClient).
"""
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.session import Base
from app.main import app, create_app
from app.core.config import settings

# Use an in-memory SQLite database for testing to ensure isolation
# OR use a separate Postgres test DB. Ideally Postgres to match prod.
# For this mock setup, we will use the same connection string but maybe distinct DB?
# Using 'sqlite+aiosqlite:///:memory:' is easiest for unit tests but specific postgres features won't work.
# We will use the main DB config with a force rollup or allow side-effects for now for simplicity, 
# OR use a mock session.
# Let's use the configured database but we should handle cleanup.

import pytest_asyncio

@pytest_asyncio.fixture(scope="function")
async def db_engine():
    engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, future=True)
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="function")
async def db(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Creates a new database session for a test function.
    Rolls back transaction at the end to keep tests isolated.
    """
    async_session = async_sessionmaker(db_engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        await session.begin()
        yield session
        await session.rollback()

from app.db.session import get_db

@pytest_asyncio.fixture(scope="function")
async def client(db) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
        await asyncio.sleep(0.1)
    app.dependency_overrides.clear()
