"""
MissionLog request/response schemas.
"""

import uuid
from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class LogToggleRequest(BaseModel):
    """For BOOLEAN missions — simply toggles completion."""
    pass


class LogIncrementRequest(BaseModel):
    """For COUNTER missions — increment by a given amount."""
    increment: int = 1


class MissionLogResponse(BaseModel):
    id: uuid.UUID
    mission_id: uuid.UUID
    user_id: uuid.UUID
    is_completed: bool
    current_count: int
    completed_at: Optional[datetime]
    period_start: date
    period_end: date

    model_config = {"from_attributes": True}
