"""
Shared enums used across multiple models.
Defined here to avoid circular imports.
"""

import enum


class Frequency(str, enum.Enum):
    """How often a mission recurs."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class MissionType(str, enum.Enum):
    """
    BOOLEAN  — binary done/not-done (e.g., "Meditate").
    COUNTER  — must reach a target count (e.g., "Drink 8 glasses of water").
    """
    BOOLEAN = "boolean"
    COUNTER = "counter"


class ReportType(str, enum.Enum):
    """The period a report covers."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
