from sqlalchemy import Column, Integer, String, Date
from app.db.database import Base
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    sobrenome = Column(String)
    email = Column(String, unique=True)
    senha = Column(String)
    data_nascimento = Column(String)
    documento = Column(String)
    latitude = Column(String)
    longitude = Column(String)