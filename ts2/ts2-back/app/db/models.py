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
    __tablename__ = "CIDADE"

    id = Column("cid_id", Integer, primary_key=True, index=True)
    nome = Column("cid_nome",String, nullable=False)
    estado = Column("cid_estado",String, nullable=False)

    ruas = relationship("Rua", back_populates="cidade")


class Rua(Base):
    __tablename__ = "RUA"

    id = Column("rua_id", Integer, primary_key=True, index=True)
    id_cidade = Column("cid_id", Integer, ForeignKey("CIDADE.cid_id"), nullable=False, index=True)
    nome = Column("rua_nome", String, nullable=False)
    cep = Column("rua_cep", String, nullable=False)

    cidade = relationship("Cidade", back_populates="ruas")
    pontos = relationship("Ponto", back_populates="rua")


class Ponto(Base):
    __tablename__ = "PONTO"
    id = Column("pon_id", Integer, primary_key=True, index=True)
    id_rua = Column("rua_id", Integer, ForeignKey("RUA.rua_id"), nullable=True, index=True)
    altitude = Column("pon_altitude", Float, nullable=True)
    latitude = Column("pon_latitude", Float, nullable=False)
    longitude = Column("pon_longitude", Float, nullable=False)

    rua = relationship("Rua", back_populates="pontos")
    locais = relationship("Local", back_populates="ponto")
    dispositivos = relationship("Dispositivo", back_populates="ponto")


class Local(Base):
    __tablename__ = "LOCAL"

    id = Column("loc_id", Integer, primary_key=True, index=True)
    id_ponto = Column("pon_id", Integer, ForeignKey("PONTO.pon_id"), nullable=False, index=True)
    nome = Column("loc_nome", String, nullable=False)

    lat = Column("loc_lat", Float, nullable=False)
    lng = Column("loc_lng", Float, nullable=False)
    categoria = Column("loc_categoria", String, nullable=False)
    rating = Column("loc_rating", Integer, nullable=False, default=5)
    timestamp = Column("loc_timestamp", DateTime(timezone=True), nullable=False, index=True)

    tipo = Column(
        "loc_tipo", 
        Enum(TipoLocal, name="tipo_local", native_enum=True),
        nullable=True,
    )

    ponto = relationship("Ponto", back_populates="locais")


class Usuario(Base):
    __tablename__ = "USUARIO"

    id = Column("usu_id", Integer, primary_key=True, index=True)
    uuid = Column("usu_uuid", String(36), nullable=False, unique=True, index=True) #Usuário não tem uuid no MER, deve ser incluído?
    nome = Column("usu_nome", String, nullable=False)
    sobrenome = Column("usu_sobrenome", String, nullable=False)
    data_nascimento = Column("usu_dt_nascimento", Date, nullable=False)
    email = Column("usu_email", String, unique=True, nullable=False, index=True)
    senha = Column("usu_senha", String, nullable=False)
    documento = Column("usu_documento", String, unique=True, nullable=False, index=True)

    usuario_dispositivos = relationship("Usuario_Dispositivo", back_populates="usuario")
    logins = relationship("Login", back_populates="usuario")
    refresh_token_rows = relationship("RefreshToken", back_populates="usuario")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column("id_refresh_token", Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("USUARIO.usu_id"), nullable=False, index=True)
    jti = Column(String(36), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    usuario = relationship("Usuario", back_populates="refresh_token_rows")


class Dispositivo(Base):
    __tablename__ = "DISPOSITIVO"

    id = Column("dis_id", Integer, primary_key=True, index=True)
    id_ponto = Column("pon_id", Integer, ForeignKey("PONTO.pon_id"), nullable=True, index=True)
    metadados = Column("dis_metadados", JSON, nullable=True)
    uuid = Column("dis_uuid", String(36), nullable=False, unique=True, index=True)

    usuario_dispositivos = relationship("Usuario_Dispositivo", back_populates="dispositivo")
    ponto = relationship("Ponto", back_populates="dispositivos")
    logins = relationship("Login", back_populates="dispositivo")

class Usuario_Dispositivo(Base):
    __tablename__ = "USUARIO_DISPOSITIVO"

    id = Column("usd_id", Integer, primary_key=True, index=True)
    id_usuario = Column("usu_id", Integer, ForeignKey("USUARIO.usu_id"), nullable=False, index=True)
    id_dispositivo = Column("dis_id", Integer, ForeignKey("DISPOSITIVO.dis_id"), nullable=False, index=True)
    data_hora = Column("usd_data_hora", DateTime(timezone=True), nullable=False, server_default=func.now())
    ativo = Column("usd_ativo", Boolean, nullable=False, default=True)

    usuario = relationship("Usuario", back_populates="usuario_dispositivos")
    dispositivo = relationship("Dispositivo", back_populates="usuario_dispositivos")

class Login(Base):
    __tablename__ = "LOGIN"

    id = Column("log_id", Integer, primary_key=True, index=True)
    id_usuario = Column("usu_id", Integer, ForeignKey("USUARIO.usu_id"), nullable=False, index=True)
    id_dispositivo = Column(
        "dis_id", Integer, ForeignKey("DISPOSITIVO.dis_id"), nullable=False, index=True
    )
    ip = Column("log_ip", String(45), nullable=False)
    data_hora = Column("log_data_hora", DateTime(timezone=True), nullable=False, server_default=func.now())
    ativo = Column("log_ativo", Boolean, nullable=False, default=True)

    usuario = relationship("Usuario", back_populates="logins")
    dispositivo = relationship("Dispositivo", back_populates="logins")
