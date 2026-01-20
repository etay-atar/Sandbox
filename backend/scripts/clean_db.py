import asyncio
from sqlalchemy import text
from app.db.session import engine
from app.models.models import Base

async def clean_db():
    async with engine.begin() as conn:
        # Disable foreign key checks for truncation (specific to Postgres can be tricky, using CASCADE)
        await conn.execute(text("TRUNCATE TABLE users, submissions CASCADE;"))
    print("Database cleaned.")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(clean_db())
