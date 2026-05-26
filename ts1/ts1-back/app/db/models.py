import datetime

from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from app.db.database import Base


class Perfil(Base):
    __tablename__ = "perfil"

    prf_id = Column(Integer, primary_key=True, index=True)
    prf_nome = Column(String)
    prf_nivel_acesso = Column(String)
    prf_descricao = Column(String)
    prf_status = Column(String)


class Usuario(Base):
    __tablename__ = "usuario"

    usr_id = Column(Integer, primary_key=True, index=True)
    prf_id = Column(Integer)
    usr_nome = Column(String)
    usr_email = Column(String, unique=True)
    usr_login = Column(String, unique=True)
    usr_senha_hash = Column(String)
    usr_status = Column(String, default="ativo")


class Comando(Base):
    __tablename__ = "comando"

    cmd_id = Column(Integer, primary_key=True, index=True)
    est_id = Column(Integer)
    sat_id = Column(Integer)
    cmd_timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    cmd_tipo = Column(String)
    cmd_payload_binario = Column(LargeBinary)
