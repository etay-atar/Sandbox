"""
Main Application Entry Point
============================
Initializes the FastAPI application and includes routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.api import api_router

def create_app() -> FastAPI:
    """Factory function to safe create the app."""
    application = FastAPI(
        title=settings.PROJECT_NAME,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        version=settings.VERSION,
    )

    # CORS Middleware
    # Allow all origins for development convenience
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API Router
    application.include_router(api_router, prefix=settings.API_V1_STR)

    return application

app = create_app()

@app.get("/")
def root():
    """Health check endpoint."""
    return {"message": "CyberSecurity Sandbox API is Running", "docs": "/docs"}
