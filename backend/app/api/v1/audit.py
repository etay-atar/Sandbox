from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Any, List
from app.api import deps
from app.db.session import get_db
from app.models.models import User, AuditLog

router = APIRouter()

@router.get("/logs")
async def get_audit_logs(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_auditor: User = Depends(deps.get_current_auditor_user)
) -> Any:
    """
    (Auditor Only) Retrieve the immutable audit logs for compliance tracking.
    """
    result = await db.execute(
        select(AuditLog, User.username)
        .outerjoin(User, AuditLog.user_id == User.user_id)
        .order_by(desc(AuditLog.timestamp))
        .offset(skip)
        .limit(limit)
    )
    
    logs = []
    for log, username in result.all():
        logs.append({
            "log_id": str(log.log_id),
            "username": username or "Unknown/Service",
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp
        })
        
    return logs
