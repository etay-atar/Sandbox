"""
Auth API Routes
===============
Endpoints for User Registration and Authentication.
"""
from typing import Any
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api import deps
from app.core import security
from app.core.config import settings
from app.db.session import get_db
from app.models.models import User
from app.schemas import schemas

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login_access_token(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # 1. Check user exists
    result = await db.execute(select(User).where(User.username == form_data.username))
    user = result.scalars().first()
    
    # 2. Validate password
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    # 3. Create Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.post("/register", response_model=schemas.UserResponse)
async def register_user(
    *,
    db: AsyncSession = Depends(get_db),
    user_in: schemas.UserCreate,
) -> Any:
    """
    Create new user.
    """
    # 1. Check if username exists
    result = await db.execute(select(User).where(User.username == user_in.username))
    if result.scalars().first():
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
        
    # 2. Create User
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
