from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Any, List
from app.api import deps
from app.db.session import get_db
from app.models.models import User, AuditLog
from app.schemas import schemas

router = APIRouter()

@router.get("/vm-pool")
async def get_vm_pool_status(
    current_admin: User = Depends(deps.get_current_admin_user)
) -> Any:
    """
    (Admin Only) Returns the health status of Sandbox VMs.
    Currently returns mock data as actual VM orchestration is pending Phase 4/5.
    """
    return {
        "active_vms": 3,
        "total_vms": 5,
        "status": "Healthy"
    }

@router.get("/users", response_model=List[schemas.UserResponse])
async def get_all_users(
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
) -> Any:
    """
    (Admin Only) Retrieve all users.
    """
    result = await db.execute(select(User))
    return result.scalars().all()

@router.put("/users/{user_id}/role", response_model=schemas.UserResponse)
async def update_user_role(
    user_id: str,
    role_in: schemas.UserRoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
) -> Any:
    """
    (Admin Only) Update a user's role.
    """
    if str(current_admin.user_id) == str(user_id):
        raise HTTPException(status_code=400, detail="Administrators cannot modify their own role.")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    old_role = user.role
    user.role = role_in.role
    
    audit_log = AuditLog(
        user_id=current_admin.user_id,
        action="USER_ROLE_UPDATED",
        details=f"Changed role for {user.username} from {old_role} to {role_in.role}"
    )
    db.add(audit_log)
    
    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_admin: User = Depends(deps.get_current_admin_user)
) -> Any:
    """
    (Admin Only) Delete a user permanently.
    """
    if str(current_admin.user_id) == str(user_id):
        raise HTTPException(status_code=400, detail="Administrators cannot delete their own account.")

    result = await db.execute(select(User).where(User.user_id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    audit_log = AuditLog(
        user_id=current_admin.user_id,
        action="USER_DELETED",
        details=f"Deleted user account: {user.username}"
    )
    db.add(audit_log)
    await db.delete(user)
    await db.commit()
    
    return {"status": "ok", "message": "User deleted"}
