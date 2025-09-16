from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.services.auth_service import AuthService

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        user = await AuthService.get_current_user(token.credentials)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )