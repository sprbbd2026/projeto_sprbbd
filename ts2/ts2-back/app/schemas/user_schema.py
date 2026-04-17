from datetime import date
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    nome: str
    sobrenome: str
    email: EmailStr
    data_nascimento: date = Field(
        ...,
        description="Data no padrão ISO 8601: YYYY-MM-DD",
        examples=["2026-04-06"],
    )
    documento: str


class UserCreate(UserBase):
    senha: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    sobrenome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = Field(default=None, min_length=8)
    data_nascimento: Optional[date] = Field(
        default=None,
        description="Data no padrão ISO 8601: YYYY-MM-DD",
        examples=["2026-04-06"],
    )
    documento: Optional[str] = None


class UserUpdateBody(UserUpdate):
    id: int


class UserResponse(UserBase):
    id: int
    uuid: UUID

    class Config:
        from_attributes = True


class UserDeleteById(BaseModel):
    id: int


class UserDeleteSuccess(BaseModel):
    message: str
