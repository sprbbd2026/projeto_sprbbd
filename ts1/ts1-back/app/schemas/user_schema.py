from pydantic import BaseModel, EmailStr, field_validator


class UserCreateRequest(BaseModel):
    name: str
    document: str
    email: EmailStr
    password: str
    accessLevel: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Nome não pode ter mais de 255 caracteres.")
        return v

    @field_validator("document")
    @classmethod
    def validate_document(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Documento não pode ter mais de 255 caracteres.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("E-mail não pode ter mais de 255 caracteres.")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Senha não pode ter mais de 255 caracteres.")
        return v

    @field_validator("accessLevel")
    @classmethod
    def validate_access_level(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Nível de acesso não pode ter mais de 50 caracteres.")
        return v


class UserResponse(BaseModel):
    usr_id: int
    usr_nome: str
    usr_email: str
    usr_login: str
    usr_status: str
    prf_id: int

    class Config:
        from_attributes = True
