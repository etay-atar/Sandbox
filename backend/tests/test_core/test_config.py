"""
Test: Core Configuration
========================
Tests the loading of environment variables and the construction of the database URI.
Documentation is included for every test case.
"""

import os
from unittest import mock
from app.core.config import Settings

def test_config_defaults():
    """
    Test that default values are set correctly when no environment variables are present.
    """
    # Create a new Settings object
    settings = Settings()
    
    assert settings.PROJECT_NAME == "CyberSecurity Sandbox"
    assert settings.POSTGRES_SERVER == "localhost"
    # Check constructed URI
    assert "postgresql+asyncpg://sandbox_user:sandbox_password@localhost:5432/sandbox_db" == settings.SQLALCHEMY_DATABASE_URI

def test_config_env_override():
    """
    Test that environment variables correctly override the defaults.
    """
    with mock.patch.dict(os.environ, {
        "POSTGRES_USER": "test_user",
        "POSTGRES_DB": "test_db",
        "POSTGRES_PORT": "5433"
    }):
        settings = Settings()
        assert settings.POSTGRES_USER == "test_user"
        assert settings.POSTGRES_DB == "test_db"
        assert "postgresql+asyncpg://test_user:sandbox_password@localhost:5433/test_db" == settings.SQLALCHEMY_DATABASE_URI
