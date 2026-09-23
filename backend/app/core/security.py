"""
Security utilities — JWT token handling and password hashing.
"""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ---------------------------------------------------------------------------
# Password hashing (bcrypt)
# ---------------------------------------------------------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return the bcrypt hash of a plaintext password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check a plaintext password against a stored bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ---------------------------------------------------------------------------
# JWT tokens
# ---------------------------------------------------------------------------
def create_access_token(
    subject: str,
    email: str | None = None,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT.
    `subject` is typically the user's UUID as a string.
    `email` is embedded in the payload so we can avoid a DB lookup per request.
    """
    expire = datetime.now(timezone.utc) + (
        expires_delta
        or timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    payload: dict = {"sub": subject, "exp": expire}
    if email:
        payload["email"] = email
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str, full_payload: bool = False) -> str | dict | None:
    """
    Decode and verify a JWT.
    If full_payload=False (default), returns the `sub` claim (user id) or None.
    If full_payload=True, returns the entire decoded payload dict or None.
    """
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if full_payload:
            return payload
        return payload.get("sub")
    except JWTError:
        return None
