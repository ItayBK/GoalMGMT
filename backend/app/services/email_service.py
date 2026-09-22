"""
Email Service — sends transactional emails via Resend.
"""

import resend

from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_report_email(
    to_email: str,
    report_type: str,
    period_start: str,
    period_end: str,
    report_id: str,
) -> None:
    """
    Send a motivational email notifying the user that their AI report is ready.
    This is called via FastAPI BackgroundTasks so it doesn't block the request.
    """
    subject = f"🎯 Your {report_type.capitalize()} GoalMGMT Report is Ready!"

    html_body = f"""
    <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #6C63FF;">GoalMGMT</h1>
        <h2>Your {report_type} report is ready! 📊</h2>
        <p>We've analyzed your progress from <strong>{period_start}</strong> to <strong>{period_end}</strong>.</p>
        <p>Your personal AI coach has insights, highlights, and tips waiting for you.</p>
        <a href="{settings.FRONTEND_URL}/reports/{report_id}"
           style="display: inline-block; background: #6C63FF; color: white; padding: 12px 28px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            View Your Report →
        </a>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
            Keep pushing — consistency beats perfection. 💪
        </p>
    </div>
    """

    resend.Emails.send(
        {
            "from": settings.EMAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
        }
    )
