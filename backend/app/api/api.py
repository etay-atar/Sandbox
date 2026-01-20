from fastapi import APIRouter
from app.api.v1 import auth, submissions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(submissions.router, prefix="/submit", tags=["submissions"]) # Note: prefix is /submit to match spec
# Or /submissions? Spec said /api/submit (POST). So prefix is correct.
