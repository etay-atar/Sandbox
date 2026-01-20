"""
API Dependencies
================
Reusable dependencies for FastAPI endpoints (Authentication, DB Session).
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.core.security import verify_password
from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import TokenData

# OAuth2 scheme tells FastAPI that we use a Bearer token in the Authorization header.
# "tokenUrl" points to the endpoint that issues the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Validates the JWT token and retrieves the current user.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
        
    # Query DB for user
    result = await db.execute(select(User).where(User.username == token_data.username))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
        
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Wrapper to ensure user is active (can extend to check 'is_active' flag later).
    """
    return current_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency that enforces Admin role.
    """
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have enough privileges"
        )
    return current_user
