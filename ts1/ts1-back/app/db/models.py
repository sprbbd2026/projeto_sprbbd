from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
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

    id_satelite = Column(Integer, primary_key=True, index=True)
    id_constelacao = Column(Integer, nullable=True)
    relogio_interno_offset = Column(Float, default=0.0)
    codigo_prn = Column(String, unique=True, index=True)
    numero_svn = Column(Integer, nullable=True)
    status = Column(String, default="ativo")

    telemetrias = relationship("Telemetria", back_populates="satelite")


class Telemetria(Base):
    __tablename__ = "telemetria"

    id_telemetria = Column(Integer, primary_key=True, index=True)
    id_satelite = Column(Integer, ForeignKey(
        "satelite.id_satelite"), nullable=False)

    temperatura = Column(Float)
    timestamp_registro = Column(DateTime)
    orientacao = Column(String)
    checksum = Column(String)
    memoria = Column(Float)
    energia = Column(Float)
    bateria = Column(Float)
    relogio = Column(String)
    cpu = Column(Float)

    satelite = relationship("Satelite", back_populates="telemetrias")
