"""
MissionLog model — tracks completion progress for a single mission
within a specific time period.

For BOOLEAN missions:
  - `is_completed` flips to True when the user checks the box.
  - `current_count` stays at 0 (unused).

For COUNTER missions:
  - `current_count` increments each time the user logs progress.
  - `is_completed` flips to True once `current_count >= mission.target_count`.
"""

import uuid
from datetime import date, datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class MissionLog(SQLModel, table=True):
    """
    One row per mission per period.
    Created lazily the first time a user interacts with a mission in a given period.
    Unique constraint on (mission_id, period_start) prevents duplicate logs.
    """

    __tablename__ = "mission_logs"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    mission_id: uuid.UUID = Field(
        foreign_key="missions.id",
        index=True,
        nullable=False,
    )
    user_id: uuid.UUID = Field(
        foreign_key="users.id",
        index=True,
        nullable=False,
    )

    is_completed: bool = Field(default=False, nullable=False)
    current_count: int = Field(default=0, nullable=False)
    completed_at: Optional[datetime] = Field(default=None)

    period_start: date = Field(nullable=False)
    period_end: date = Field(nullable=False)
