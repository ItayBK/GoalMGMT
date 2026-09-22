"""
Users router — profile and settings.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.user import UserProfileResponse, UserUpdateRequest

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_profile(user: User = Depends(get_current_user)):
    """Return the current user's profile."""
    return user


@router.put("/me", response_model=UserProfileResponse)
async def update_profile(
    body: UserUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update user settings (e.g., timezone)."""
    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
