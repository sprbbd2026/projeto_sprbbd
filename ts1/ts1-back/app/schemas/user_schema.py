from pydantic import BaseModel, EmailStr, field_validator


class UserCreateRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    funcao: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if len(v) > 255:
            raise ValueError("Nome não pode ter mais de 255 caracteres.")
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

    @field_validator("funcao")
    @classmethod
    def validate_funcao(cls, v: str) -> str:
        if len(v) > 50:
            raise ValueError("Função não pode ter mais de 50 caracteres.")
        return v


class UserResponse(BaseModel):
    opr_id: int
    opr_nome: str
    opr_email: str
    opr_funcao: str
    opr_status: str

    class Config:
        from_attributes = True
