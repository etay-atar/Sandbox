"""
Test: Auth API
==============
Tests Login and Registration endpoints.
"""
import pytest
import uuid
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, db):
    """
    Test that a new user can register successfully.
    """
    random_str = uuid.uuid4().hex
    username = f"user_{random_str}"
    email = f"{random_str}@example.com"
    
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "password": "newpassword123",
            "email": email,
            "role": "Analyst"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == username
    assert "user_id" in data

@pytest.mark.asyncio
async def test_login_user(client: AsyncClient, db):
    """
    Test that a registered user can login and receive a token.
    Prereq: Register the user first.
    """
    random_str = uuid.uuid4().hex
    username = f"login_{random_str}"
    
    # 1. Register
    await client.post(
        "/api/v1/auth/register",
        json={
            "username": username,
            "password": "password123"
        }
    )
    
    # 2. Login
    response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": username,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
