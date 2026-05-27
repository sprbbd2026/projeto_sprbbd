from pydantic import BaseModel, EmailStr, field_validator
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def validate_email_length(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("E-mail não pode ter mais de 255 caracteres.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Senha não pode ter mais de 255 caracteres.")
        return v


class LoginUserResponse(BaseModel):
    email: str
    nome: str


class LoginResponse(BaseModel):
    token: str
    user: LoginUserResponse
