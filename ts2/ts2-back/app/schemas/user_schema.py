from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    nome: str
    sobrenome: str
    email: EmailStr
    data_nascimento: str
    documento: str

    # Dados do Dispositivo
    metadados: str


class UserCreate(UserBase):
    senha: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True