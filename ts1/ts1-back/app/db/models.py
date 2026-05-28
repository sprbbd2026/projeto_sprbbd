from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
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
    cmd_timestamp = Column(DateTime, default=datetime.utcnow)
    cmd_tipo = Column(String)
    cmd_payload_binario = Column(LargeBinary)

class Satelite(Base):
    __tablename__ = "satelite"

    sat_id = Column(Integer, primary_key=True, index=True)
    sat_nome = Column(String)
    sat_modelo_hardware = Column(String)
    sat_versao_firmware = Column(String)
    sat_tipo_orbita = Column(String, default="MEO")
    sat_status = Column(String, default="operacional")

class EventoComunicacao(Base):
    __tablename__ = "comunicacao_eventos"

    evt_id = Column(Integer, primary_key=True, index=True)
    evt_data_hora = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    evt_tipo = Column(String, nullable=False)          # Ex: COMANDO_ENVIADO, TELEMETRIA_RECEBIDA
    evt_satelite_id = Column(String, nullable=False)   # Qual satélite da constelação
    evt_payload = Column(JSONB, nullable=True)         # O corpo do comando/telemetria em JSON
    evt_status = Column(String, nullable=False)        # Ex: SUCESSO, ERRO
    usr_id = Column(Integer, nullable=True)            # Opcional: ID do usuário que enviou o comando
