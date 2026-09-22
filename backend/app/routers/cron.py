"""
Cron router — secured endpoints for scheduled report generation.

These are meant to be called by an external cron scheduler (e.g., cron-job.org,
Vercel Cron, Railway Cron) or internally by APScheduler.
All endpoints require the X-Cron-Secret header.
"""

from datetime import date, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.database import get_session
from app.core.deps import verify_cron_secret
from app.models.enums import Frequency
from app.models.user import User
from app.services.ai_service import generate_report_for_user
from app.services.email_service import send_report_email

router = APIRouter(dependencies=[Depends(verify_cron_secret)])


async def _run_reports(
    frequency: Frequency,
    period_start: date,
    period_end: date,
    session: AsyncSession,
    background_tasks: BackgroundTasks,
) -> int:
    """
    Generate AI reports for ALL users for the given frequency/period.
    Returns the number of reports generated.
    """
    result = await session.execute(select(User))
    users = result.scalars().all()
    count = 0

    for user in users:
        report = await generate_report_for_user(
            user_id=user.id,
            frequency=frequency,
            period_start=period_start,
            period_end=period_end,
            session=session,
        )
        # Fire-and-forget email via BackgroundTasks
        background_tasks.add_task(
            send_report_email,
            to_email=user.email,
            report_type=frequency.value,
            period_start=str(period_start),
            period_end=str(period_end),
            report_id=str(report.id),
        )
        count += 1

    return count


@router.post("/daily")
async def trigger_daily_reports(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """Generate daily reports for all users (yesterday's data)."""
    yesterday = date.today() - timedelta(days=1)
    count = await _run_reports(
        Frequency.DAILY, yesterday, yesterday, session, background_tasks
    )
    return {"status": "ok", "reports_generated": count, "period": str(yesterday)}


@router.post("/weekly")
async def trigger_weekly_reports(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """Generate weekly reports for all users (last week's data)."""
    today = date.today()
    # Last week: Monday to Sunday
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)
    count = await _run_reports(
        Frequency.WEEKLY, last_monday, last_sunday, session, background_tasks
    )
    return {
        "status": "ok",
        "reports_generated": count,
        "period_start": str(last_monday),
        "period_end": str(last_sunday),
    }


@router.post("/monthly")
async def trigger_monthly_reports(
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """Generate monthly reports for all users (last month's data)."""
    today = date.today()
    first_of_this_month = today.replace(day=1)
    last_day_prev_month = first_of_this_month - timedelta(days=1)
    first_of_prev_month = last_day_prev_month.replace(day=1)
    count = await _run_reports(
        Frequency.MONTHLY,
        first_of_prev_month,
        last_day_prev_month,
        session,
        background_tasks,
    )
    return {
        "status": "ok",
        "reports_generated": count,
        "period_start": str(first_of_prev_month),
        "period_end": str(last_day_prev_month),
    }
