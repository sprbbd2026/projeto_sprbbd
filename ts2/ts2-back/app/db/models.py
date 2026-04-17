import enum

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.database import Base


class TipoLocal(str, enum.Enum):
    """Tipos de local indicados no ERD (enum)."""

    RESIDENCIAL = "residencial"
    COMERCIAL = "comercial"
    INDUSTRIAL = "industrial"
    PUBLICO = "publico"
    OUTRO = "outro"


class Cidade(Base):
    __tablename__ = "cidades"

    id = Column("id_cidade", Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    estado = Column(String, nullable=False)

    ruas = relationship("Rua", back_populates="cidade")


class Rua(Base):
    __tablename__ = "ruas"

    id = Column("id_rua", Integer, primary_key=True, index=True)
    id_cidade = Column(Integer, ForeignKey("cidades.id_cidade"), nullable=False, index=True)
    nome = Column(String, nullable=False)
    cep = Column(String, nullable=False)

    cidade = relationship("Cidade", back_populates="ruas")
    pontos = relationship("Ponto", back_populates="rua")


class Ponto(Base):
    __tablename__ = "pontos"

    id = Column("id_ponto", Integer, primary_key=True, index=True)
    id_rua = Column(Integer, ForeignKey("ruas.id_rua"), nullable=False, index=True)
    altitude = Column(Float, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    rua = relationship("Rua", back_populates="pontos")
    locais = relationship("Local", back_populates="ponto")
    dispositivos = relationship("Dispositivo", back_populates="ponto")


class Local(Base):
    __tablename__ = "locais"

    id = Column("id_local", Integer, primary_key=True, index=True)
    id_ponto = Column(Integer, ForeignKey("pontos.id_ponto"), nullable=False, index=True)
    nome = Column(String, nullable=False)
    tipo = Column(
        Enum(TipoLocal, name="tipo_local", native_enum=True),
        nullable=False,
    )

    ponto = relationship("Ponto", back_populates="locais")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column("id_usuario", Integer, primary_key=True, index=True)
    uuid = Column("uuid", String(36), nullable=False, unique=True, index=True)
    nome = Column(String, nullable=False)
    sobrenome = Column(String, nullable=False)
    data_nascimento = Column(Date, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    senha = Column(String, nullable=False)
    documento = Column(String, unique=True, nullable=False, index=True)

    dispositivos = relationship("Dispositivo", back_populates="usuario")
    logins = relationship("Login", back_populates="usuario")


class Dispositivo(Base):
    __tablename__ = "dispositivos"

    id = Column("id_dispositivo", Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False, index=True)
    id_ponto = Column(Integer, ForeignKey("pontos.id_ponto"), nullable=False, index=True)
    metadados = Column(JSON, nullable=True)
    uuid = Column(String(36), nullable=False, unique=True, index=True)

    usuario = relationship("Usuario", back_populates="dispositivos")
    ponto = relationship("Ponto", back_populates="dispositivos")
    logins = relationship("Login", back_populates="dispositivo")


class Login(Base):
    __tablename__ = "logins"

    id = Column("id_login", Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False, index=True)
    id_dispositivo = Column(
        Integer, ForeignKey("dispositivos.id_dispositivo"), nullable=False, index=True
    )
    ip = Column(String(45), nullable=False)
    data_hora = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    ativo = Column(Boolean, nullable=False, default=True)

    usuario = relationship("Usuario", back_populates="logins")
    dispositivo = relationship("Dispositivo", back_populates="logins")
