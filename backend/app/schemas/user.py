"""
User profile/settings schemas.
"""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserProfileResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    timezone: str
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    timezone: Optional[str] = None
