from fastapi import APIRouter
from app.api.v1 import auth, submissions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
# Or /submissions? Spec said /api/submit (POST). So prefix is correct.
