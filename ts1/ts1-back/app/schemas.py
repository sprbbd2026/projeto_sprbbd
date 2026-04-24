from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


AccessLevel = Literal["admin", "user", "manager"]


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    password: str = Field(min_length=6, max_length=200)
    document: str = Field(min_length=1, max_length=64)
    access_level: AccessLevel = Field(alias="accessLevel")


class PerfilOut(BaseModel):
    prf_id: int
    prf_nome: str
    prf_nivel_acesso: str | None = None
    prf_descricao: str | None = None
    prf_status: str | None = None


class RegisterResponse(BaseModel):
    usr_id: int
    prf_id: int
    usr_nome: str
    usr_email: str
    usr_login: str
    usr_status: str
    perfil: PerfilOut | None = None
