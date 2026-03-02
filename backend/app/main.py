"""
Main Application Entry Point
============================
Initializes the FastAPI application and includes routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
import os

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

@app.get("/", include_in_schema=False)
def root():
    """Project landing page with links to docs."""
    html_content = """
    <html>
        <head>
            <title>Sandbox Project Docs</title>
        </head>
        <body style="background-color: #0f172a; color: #f8fafc; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
            <div style="text-align: center; background-color: #1e293b; padding: 3rem; border-radius: 1rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); border: 1px solid #334155;">
                <h2 style="color: #38bdf8; margin-bottom: 2rem;">CyberSecurity Sandbox</h2>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="/docs" style="display: block; padding: 1rem 2rem; background-color: #0ea5e9; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: bold;">API swagger (/docs)</a>
                    <a href="/guide" style="display: block; padding: 1rem 2rem; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 0.5rem; font-weight: bold;">Onboarding Guide</a>
                </div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/guide", include_in_schema=False)
def get_guide():
    """Serves the static ONBOARDING_GUIDE.html."""
    file_path = os.path.join(os.path.dirname(__file__), "..", "ONBOARDING_GUIDE.html")
    if os.path.exists(file_path):
        return FileResponse(file_path)
    return HTMLResponse(content="Guide not found", status_code=404)
