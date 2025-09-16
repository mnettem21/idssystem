from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserLogin(UserBase):
    password: str

class UserRegister(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse