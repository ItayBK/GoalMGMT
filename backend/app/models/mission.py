"""
Mission model — a recurring task the user commits to.

Supports two types:
  BOOLEAN  — a simple done/not-done toggle (e.g., "Meditate").
  COUNTER  — must reach a target count to be considered complete
              (e.g., "Drink 8 glasses of water", target_count=8).
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Column, Enum, Field, SQLModel

from app.models.enums import Frequency, MissionType


class Mission(SQLModel, table=True):
    """
    User-defined recurring mission.
    The AI never modifies these — they are strictly user-managed.
    Soft-deleted via the `is_active` flag.
    """

    __tablename__ = "missions"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )
    title: str = Field(nullable=False, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)

    frequency: Frequency = Field(
        sa_column=Column(Enum(Frequency), nullable=False),
    )
    mission_type: MissionType = Field(
        sa_column=Column(Enum(MissionType), nullable=False, default=MissionType.BOOLEAN),
    )
    # For COUNTER missions: the number the user aims to reach each period.
    # For BOOLEAN missions: defaults to 1 (irrelevant but keeps queries uniform).
    target_count: int = Field(default=1, nullable=False)

    is_active: bool = Field(default=True, nullable=False)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )
