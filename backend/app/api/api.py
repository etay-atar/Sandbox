from fastapi import APIRouter
from app.api.v1 import auth, submissions, admin, audit

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(submissions.router, prefix="/submissions", tags=["submissions"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(audit.router, prefix="/audit", tags=["audit"])
