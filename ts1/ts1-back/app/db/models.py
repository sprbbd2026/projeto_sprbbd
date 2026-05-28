from sqlalchemy import Column, Integer, String, DateTime, LargeBinary, Float
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime, timezone
from app.db.database import Base

class Operador(Base):
    __tablename__ = "operador"

    opr_id = Column(Integer, primary_key=True, index=True)
    opr_nome = Column(String)
    opr_email = Column(String, unique=True)
    opr_senha_hash = Column(String)
    opr_funcao = Column(String)
    opr_status = Column(String, default="ativo")

class Comando(Base):
    __tablename__ = "comando"

    cmd_id = Column(Integer, primary_key=True, index=True)
    est_id = Column(Integer)
    sat_id = Column(Integer)
    cmd_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    cmd_tipo = Column(String)
    cmd_payload_binario = Column(LargeBinary)

class Satelite(Base):
    __tablename__ = "satelite"

    sat_id = Column(Integer, primary_key=True, index=True)
    con_id = Column(Integer, nullable=True)
    sat_relogio_offset = Column(Float, nullable=True)
    sat_codigo_prn = Column(Integer, nullable=True)
    sat_numero_svn = Column(Integer, nullable=True)
    sat_status = Column(String, default="operacional")

class Constelacao(Base):
    __tablename__ = "constelacao"

    con_id = Column(Integer, primary_key=True, index=True)
    con_nome = Column(String, nullable=True)

class EventoComunicacao(Base):
    __tablename__ = "comunicacao_eventos"

    evt_id = Column(Integer, primary_key=True, index=True)
    evt_data_hora = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    evt_tipo = Column(String, nullable=False)
    evt_satelite_id = Column(String, nullable=False)
    evt_payload = Column(JSONB, nullable=True)
    evt_status = Column(String, nullable=False)
    opr_id = Column(Integer, nullable=True)
