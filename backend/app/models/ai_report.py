"""
AIReport model — stores Gemini-generated performance analysis.

One report is generated per user per period (daily / weekly / monthly).
The `content` field holds the raw Markdown returned by the Gemini API.
"""

import uuid
from datetime import date, datetime, timezone

from sqlmodel import Column, Enum, Field, SQLModel, Text

from app.models.enums import ReportType


class AIReport(SQLModel, table=True):
    """
    Persisted AI-generated report.
    Linked to a user and tagged with the period it covers.
    """

    __tablename__ = "ai_reports"

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

    report_type: ReportType = Field(
        sa_column=Column(Enum(ReportType), nullable=False),
    )
    period_start: date = Field(nullable=False)
    period_end: date = Field(nullable=False)

    # Full Markdown report body from Gemini.
    content: str = Field(sa_column=Column(Text, nullable=False))

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
