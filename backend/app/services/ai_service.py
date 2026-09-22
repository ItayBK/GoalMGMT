"""
AI Service — formats user data and calls the Gemini API to generate reports.
"""

import json
import uuid
from datetime import date

import google.generativeai as genai
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.core.config import settings
from app.models.ai_report import AIReport
from app.models.enums import Frequency, MissionType, ReportType
from app.models.mission import Mission
from app.models.mission_log import MissionLog

# Configure the Gemini SDK once at module level.
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = (
    "You are a world-class life coach and productivity expert. "
    "Analyze the user's task completion data below. "
    "Be encouraging but firm. Highlight strengths, identify bottlenecks, "
    "and provide 2-3 actionable tips for the next period. "
    "Format your response in clean Markdown with headers and bullet points."
)


def _frequency_to_report_type(freq: Frequency) -> ReportType:
    return ReportType(freq.value)


async def generate_report_for_user(
    user_id: uuid.UUID,
    frequency: Frequency,
    period_start: date,
    period_end: date,
    session: AsyncSession,
) -> AIReport:
    """
    1. Aggregate the user's missions and logs for the given period.
    2. Build a JSON payload for Gemini.
    3. Call the Gemini API.
    4. Persist the AI report and return it.
    """

    # --- Fetch missions ---
    result = await session.execute(
        select(Mission).where(
            Mission.user_id == user_id,
            Mission.frequency == frequency,
            Mission.is_active == True,  # noqa: E712
        )
    )
    missions = result.scalars().all()

    if not missions:
        # Nothing to report — create a placeholder report
        report = AIReport(
            user_id=user_id,
            report_type=_frequency_to_report_type(frequency),
            period_start=period_start,
            period_end=period_end,
            content="No active missions for this period.",
        )
        session.add(report)
        await session.commit()
        await session.refresh(report)
        return report

    # --- Fetch logs for those missions ---
    mission_ids = [m.id for m in missions]
    result = await session.execute(
        select(MissionLog).where(
            MissionLog.mission_id.in_(mission_ids),
            MissionLog.period_start >= period_start,
            MissionLog.period_end <= period_end,
        )
    )
    logs = result.scalars().all()
    logs_by_mission = {log.mission_id: log for log in logs}

    # --- Build the data payload ---
    mission_data = []
    total = len(missions)
    completed = 0

    for m in missions:
        log = logs_by_mission.get(m.id)
        entry = {
            "title": m.title,
            "type": m.mission_type.value,
            "completed": False,
        }
        if m.mission_type == MissionType.COUNTER:
            entry["target_count"] = m.target_count
            entry["current_count"] = log.current_count if log else 0
            entry["completed"] = log.is_completed if log else False
        else:
            entry["completed"] = log.is_completed if log else False

        if entry["completed"]:
            completed += 1
        mission_data.append(entry)

    payload = {
        "period": frequency.value,
        "period_start": str(period_start),
        "period_end": str(period_end),
        "total_missions": total,
        "completed_missions": completed,
        "completion_rate": f"{(completed / total * 100):.1f}%",
        "missions": mission_data,
    }

    user_prompt = json.dumps(payload, indent=2)

    # --- Call Gemini ---
    model = genai.GenerativeModel("gemini-1.5-pro")
    response = model.generate_content(
        [
            {"role": "user", "parts": [f"{SYSTEM_PROMPT}\n\n{user_prompt}"]},
        ]
    )

    content = response.text if response.text else "Unable to generate report."

    # --- Persist ---
    report = AIReport(
        user_id=user_id,
        report_type=_frequency_to_report_type(frequency),
        period_start=period_start,
        period_end=period_end,
        content=content,
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report
