"""
Repository Pattern
==================
Abstracts database access logic. This allows us to switch DBs or mock data easily.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import Type, TypeVar, Generic, Optional, List
from app.db.session import Base
import uuid

ModelType = TypeVar("ModelType", bound=Base)

class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get_by_id(self, id: uuid.UUID) -> Optional[ModelType]:
        """Fetch a record by its UUID primary key."""
        result = await self.session.execute(select(self.model).filter(self.model.user_id == id if hasattr(self.model, 'user_id') else self.model.submission_id == id))
        return result.scalars().first()

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch all records with pagination."""
        result = await self.session.execute(select(self.model).offset(skip).limit(limit))
        return result.scalars().all()

    async def create(self, **kwargs) -> ModelType:
        """Create and commit a new record."""
        obj = self.model(**kwargs)
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, db_obj: ModelType, **kwargs) -> ModelType:
        """Update fields on an existing record."""
        for key, value in kwargs.items():
            setattr(db_obj, key, value)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj
