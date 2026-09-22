"""
Mission request/response schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import Frequency, MissionType


class MissionCreateRequest(BaseModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    frequency: Frequency
    mission_type: MissionType = MissionType.BOOLEAN
    target_count: int = Field(default=1, ge=1)


class MissionUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    frequency: Optional[Frequency] = None
    mission_type: Optional[MissionType] = None
    target_count: Optional[int] = Field(default=None, ge=1)


class MissionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str]
    frequency: Frequency
    mission_type: MissionType
    target_count: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
