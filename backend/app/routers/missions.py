"""
Missions router — full CRUD for user-managed missions.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.enums import Frequency
from app.models.mission import Mission
from app.models.user import User
from app.schemas.mission import (
    MissionCreateRequest,
    MissionResponse,
    MissionUpdateRequest,
)

router = APIRouter()


@router.get("/", response_model=list[MissionResponse])
async def list_missions(
    frequency: Frequency | None = Query(default=None),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List all active missions, optionally filtered by frequency."""
    stmt = select(Mission).where(
        Mission.user_id == user.id,
        Mission.is_active == True,  # noqa: E712
    )
    if frequency:
        stmt = stmt.where(Mission.frequency == frequency)

    stmt = stmt.order_by(Mission.created_at.desc())
    result = await session.execute(stmt)
    return result.scalars().all()


@router.post(
    "/",
    response_model=MissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_mission(
    body: MissionCreateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Create a new mission."""
    mission = Mission(
        user_id=user.id,
        title=body.title,
        description=body.description,
        frequency=body.frequency,
        mission_type=body.mission_type,
        target_count=body.target_count,
    )
    session.add(mission)
    await session.commit()
    return mission


@router.put("/{mission_id}", response_model=MissionResponse)
async def update_mission(
    mission_id: uuid.UUID,
    body: MissionUpdateRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Update an existing mission's fields."""
    result = await session.execute(
        select(Mission).where(Mission.id == mission_id, Mission.user_id == user.id)
    )
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(mission, key, value)

    session.add(mission)
    await session.commit()
    return mission


@router.delete("/{mission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mission(
    mission_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Soft-delete a mission by setting is_active = False."""
    result = await session.execute(
        select(Mission).where(Mission.id == mission_id, Mission.user_id == user.id)
    )
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    mission.is_active = False
    session.add(mission)
    await session.commit()
