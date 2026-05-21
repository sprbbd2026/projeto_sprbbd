from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    device_metadata: Optional[dict] = Field(default=None)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """JWT anterior emitido por este backend (aceita token já expirado se a assinatura for válida)."""

    access_token: str = Field(..., min_length=1, description="Bearer token anterior")
