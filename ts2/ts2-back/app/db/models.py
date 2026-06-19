from sqlalchemy import Column, Integer, String, Float, DateTime
from app.db.database import Base
import datetime

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

class Telemetria(Base):
    __tablename__ = "telemetria"

    id = Column(Integer, primary_key=True, index=True)
    satelite_id = Column(String, index=True)
    cpu_percentual = Column(Float)
    temperatura_celsius = Column(Float)
    status = Column(String, default="operacional")
    data_hora = Column(DateTime, default=datetime.datetime.utcnow)


class HistoricoLocalizacao(Base):
    __tablename__ = "historico_localizacao"

    id = Column(Integer, primary_key=True, index=True)
    satelite_id = Column(String, index=True, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude_km = Column(Float, nullable=True)
    velocidade_kmh = Column(Float, nullable=True)
    data_hora = Column(DateTime, default=datetime.datetime.utcnow, index=True)