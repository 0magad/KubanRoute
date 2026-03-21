from fastapi import Header, HTTPException, status
from core.models.schemas import CurrentUser


async def get_current_user(
    x_user_id: str | None = Header(default=None),
    x_user_email: str | None = Header(default=None),
) -> CurrentUser:
    """
    Temporary auth dependency for hackathon/demo mode.
    If user id header is not provided, return an anonymous mock user.
    """
    if x_user_id == "":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user id",
        )

    user_id = x_user_id or "mock-user-id"
    return CurrentUser(id=user_id, email=x_user_email)
