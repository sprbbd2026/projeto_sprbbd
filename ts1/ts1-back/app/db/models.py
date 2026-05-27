from sqlalchemy import Column, Integer, String, DateTime
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


class EventoComunicacao(Base):
    __tablename__ = "comunicacao_eventos"

    evt_id = Column(Integer, primary_key=True, index=True)
    evt_data_hora = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    evt_tipo = Column(String, nullable=False)          # Ex: COMANDO_ENVIADO, TELEMETRIA_RECEBIDA
    evt_satelite_id = Column(String, nullable=False)   # Qual satélite da constelação
    evt_payload = Column(JSONB, nullable=True)         # O corpo do comando/telemetria em JSON
    evt_status = Column(String, nullable=False)        # Ex: SUCESSO, ERRO
    usr_id = Column(Integer, nullable=True)            # Opcional: ID do usuário que enviou o comando