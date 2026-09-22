"""
AI Reports router — list and view generated reports.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.ai_report import AIReport
from app.models.enums import ReportType
from app.models.user import User
from app.schemas.report import AIReportDetail, AIReportSummary

router = APIRouter()


@router.get("/", response_model=list[AIReportSummary])
async def list_reports(
    report_type: ReportType | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """List past reports, newest first. Optionally filter by type."""
    stmt = select(AIReport).where(AIReport.user_id == user.id)

    if report_type:
        stmt = stmt.where(AIReport.report_type == report_type)

    stmt = stmt.order_by(AIReport.created_at.desc()).limit(limit)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/{report_id}", response_model=AIReportDetail)
async def get_report(
    report_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """Fetch a single report with its full Markdown content."""
    result = await session.execute(
        select(AIReport).where(
            AIReport.id == report_id,
            AIReport.user_id == user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
