from pydantic import BaseModel, ConfigDict, EmailStr, Field

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

class UserResponse(UserBase):
    id: int

    model_config = ConfigDict(from_attributes=True)