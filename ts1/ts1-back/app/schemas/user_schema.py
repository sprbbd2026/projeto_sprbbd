from pydantic import BaseModel, EmailStr


class UserCreateRequest(BaseModel):
    name: str
    document: str
    email: EmailStr
    password: str
    accessLevel: str


class UserResponse(BaseModel):
    usr_id: int
    usr_nome: str
    usr_email: str
    usr_login: str
    usr_status: str
    prf_id: int

    class Config:
        from_attributes = True
