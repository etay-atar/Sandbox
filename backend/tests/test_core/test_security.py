"""
Test: Security Utilities
========================
Tests password hashing and JWT token generation.
"""
from datetime import timedelta
from jose import jwt
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

def test_password_hashing():
    """Verify that password hashing works and verification succeeds."""
    password = "supersecretpassword"
    hashed = get_password_hash(password)
    
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)

def test_jwt_token_generation():
    """Verify that a JWT token is generated and can be decoded."""
    data = {"sub": "testuser@example.com"}
    token = create_access_token(data=data, expires_delta=timedelta(minutes=5))
    
    decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    
    assert decoded["sub"] == "testuser@example.com"
    assert "exp" in decoded
