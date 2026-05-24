from sqlalchemy import Column, Integer, String
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


class Satelite(Base):
    __tablename__ = "satelite"

    sat_id = Column(Integer, primary_key=True, index=True)
    sat_nome = Column(String)
    sat_modelo_hardware = Column(String)
    sat_versao_firmware = Column(String)
    sat_tipo_orbita = Column(String, default="MEO")
    sat_status = Column(String, default="operacional")
