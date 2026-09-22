"""
Mission Logs router — tracks completion of missions per period.

Handles both BOOLEAN (toggle) and COUNTER (increment) mission types.
"""

import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.enums import Frequency, MissionType
from app.models.mission import Mission
from app.models.mission_log import MissionLog
from app.models.user import User
from app.schemas.log import LogIncrementRequest, MissionLogResponse

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _get_period_bounds(freq: Frequency, ref: date | None = None) -> tuple[date, date]:
    """
    Return (period_start, period_end) for the given frequency relative to `ref`.
    """
    today = ref or date.today()

    if freq == Frequency.DAILY:
        return today, today

    if freq == Frequency.WEEKLY:
        start = today - timedelta(days=today.weekday())  # Monday
        end = start + timedelta(days=6)  # Sunday
        return start, end

    # MONTHLY
    start = today.replace(day=1)
    # Last day of month
    if today.month == 12:
        end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
    return start, end


async def _get_or_create_log(
    mission: Mission,
    user_id: uuid.UUID,
    session: AsyncSession,
) -> MissionLog:
    """Return the existing log for this period, or create a fresh one."""
    p_start, p_end = _get_period_bounds(mission.frequency)

    result = await session.execute(
        select(MissionLog).where(
            MissionLog.mission_id == mission.id,
            MissionLog.period_start == p_start,
        )
    )
    log = result.scalar_one_or_none()

    if not log:
        log = MissionLog(
            mission_id=mission.id,
            user_id=user_id,
            period_start=p_start,
            period_end=p_end,
        )
        session.add(log)
        await session.flush()

    return log


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[MissionLogResponse])
async def list_logs(
    start: date = Query(..., description="Period start date"),
    end: date = Query(..., description="Period end date"),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Fetch all logs for the current user within a date range."""
    result = await session.execute(
        select(MissionLog)
        .where(
            MissionLog.user_id == user.id,
            MissionLog.period_start >= start,
            MissionLog.period_end <= end,
        )
        .order_by(MissionLog.period_start.desc())
    )
    return result.scalars().all()


@router.post("/{mission_id}/toggle", response_model=MissionLogResponse)
async def toggle_mission(
    mission_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Toggle a BOOLEAN mission's completion for the current period."""
    result = await session.execute(
        select(Mission).where(Mission.id == mission_id, Mission.user_id == user.id)
    )
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    if mission.mission_type != MissionType.BOOLEAN:
        raise HTTPException(
            status_code=400,
            detail="Use the /increment endpoint for COUNTER missions",
        )

    log = await _get_or_create_log(mission, user.id, session)
    log.is_completed = not log.is_completed
    log.completed_at = datetime.now(timezone.utc) if log.is_completed else None

    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


@router.post("/{mission_id}/increment", response_model=MissionLogResponse)
async def increment_mission(
    mission_id: uuid.UUID,
    body: LogIncrementRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Increment a COUNTER mission's current_count for the current period."""
    result = await session.execute(
        select(Mission).where(Mission.id == mission_id, Mission.user_id == user.id)
    )
    mission = result.scalar_one_or_none()
    if not mission:
        raise HTTPException(status_code=404, detail="Mission not found")

    if mission.mission_type != MissionType.COUNTER:
        raise HTTPException(
            status_code=400,
            detail="Use the /toggle endpoint for BOOLEAN missions",
        )

    log = await _get_or_create_log(mission, user.id, session)
    log.current_count = max(0, log.current_count + body.increment)
    log.is_completed = log.current_count >= mission.target_count
    log.completed_at = (
        datetime.now(timezone.utc) if log.is_completed else None
    )

    session.add(log)
    await session.commit()
    await session.refresh(log)
    return log


@router.delete("/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_log(
    log_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Reset / remove a mission log entry."""
    result = await session.execute(
        select(MissionLog).where(MissionLog.id == log_id, MissionLog.user_id == user.id)
    )
    log = result.scalar_one_or_none()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")

    await session.delete(log)
    await session.commit()
