from sqlalchemy import Column, Integer, String, Date
from app.db.database import Base
from sqlalchemy.orm import relationship
class Usuario(Base):
    __tablename__ = "USUARIO"

    id = Column('usu_id', Integer, primary_key=True, index=True)
    nome = Column("usu_nome",String)
    sobrenome = Column("usu_sobrenome",String)
    email = Column("usu_email",String, unique=True)
    senha = Column("usu_senha",String)
    data_nascimento = Column("usu_dt_nascimento",String)
    documento = Column("usu_documento",String)
    dispositivos = relationship("Dispositivo", back_populates="dono")

class Dispositivo(Base):
    __tablename__ = "DISPOSITIVO"

    id = Column('dis_id', Integer, primary_key=True, index=True)
    metadados = Column("dis_metadados",String)
    uuid = Column("dis_uuid",String)
    usuario_id = Column(Integer, ForeignKey("USUARIO.usu_id"))
    dono = relationship("Usuario", back_populates="dispositivos")