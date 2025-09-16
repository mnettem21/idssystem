from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer
from app.schemas.auth import UserLogin, UserRegister, Token
from app.services.auth_service import AuthService

router = APIRouter()
security = HTTPBearer()

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister):
    try:
        return await AuthService.register_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    try:
        return await AuthService.authenticate_user(user_data)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/me")
async def get_current_user(token: str = Depends(security)):
    try:
        return await AuthService.get_current_user(token.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")