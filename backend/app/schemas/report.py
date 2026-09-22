"""
AIReport response schemas.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import ReportType


class AIReportSummary(BaseModel):
    """Lightweight version for list views (no full content)."""
    id: uuid.UUID
    report_type: ReportType
    period_start: date
    period_end: date
    created_at: datetime

    model_config = {"from_attributes": True}


class AIReportDetail(BaseModel):
    """Full report including the Markdown content body."""
    id: uuid.UUID
    user_id: uuid.UUID
    report_type: ReportType
    period_start: date
    period_end: date
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
