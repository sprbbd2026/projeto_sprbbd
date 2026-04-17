from typing import Optional

from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    nome: str
    sobrenome: str
    email: EmailStr
    data_nascimento: str
    documento: str
    latitude: str
    longitude: str


class UserCreate(UserBase):
    senha: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    nome: Optional[str] = None
    sobrenome: Optional[str] = None
    email: Optional[EmailStr] = None
    senha: Optional[str] = Field(default=None, min_length=8)
    data_nascimento: Optional[str] = None
    documento: Optional[str] = None
    latitude: Optional[str] = None
    longitude: Optional[str] = None


class UserUpdateBody(UserUpdate):
    id: int


class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True


class UserDeleteById(BaseModel):
    id: int


class UserDeleteSuccess(BaseModel):
    message: str