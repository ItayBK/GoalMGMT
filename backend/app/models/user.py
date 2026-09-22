"""
User model — represents an authenticated user of the application.
"""

import uuid
from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    """
    Core user account.
    Passwords are stored as bcrypt hashes (handled by the auth service layer).
    """

    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        primary_key=True,
        nullable=False,
    )
    email: str = Field(
        index=True,
        unique=True,
        nullable=False,
        max_length=320,
    )
    hashed_password: str = Field(nullable=False)
    timezone: str = Field(default="UTC", max_length=50)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        nullable=False,
    )
