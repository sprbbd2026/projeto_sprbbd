# Caminho: app/services/auditoria_service.py

from sqlalchemy.orm import Session
from app.db.models import EventoComunicacao  # Ajuste o import conforme sua estrutura

def registrar_evento_db(
    db: Session, 
    tipo_evento: str, 
    satelite_id: str, 
    payload: dict, 
    status: str, 
    usuario_id: int = None
):
    """
    Função para registrar a caixa preta de comunicação com os satélites.
    """
    novo_evento = EventoComunicacao(
        evt_tipo=tipo_evento,
        evt_satelite_id=satelite_id,
        evt_payload=payload,
        evt_status=status,
        usr_id=usuario_id
    )
    
    db.add(novo_evento)
    db.commit()
    db.refresh(novo_evento)
    
    return novo_evento