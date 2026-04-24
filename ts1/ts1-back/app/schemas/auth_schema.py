from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginUserResponse(BaseModel):
    email: str
    nome: str


class LoginResponse(BaseModel):
    token: str
    user: LoginUserResponse
