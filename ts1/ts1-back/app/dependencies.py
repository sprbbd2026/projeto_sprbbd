import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Operador

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Operador:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # Verifica se é token do ts2 (tem campo 'uuid') ou do ts1 (não tem 'uuid')
        if "uuid" in payload:
            # Token do ts2: cria um operador dummy para compatibilidade
            dummy_operador = Operador()
            dummy_operador.opr_id = -999  # ID especial para indicar token externo
            dummy_operador.opr_email = payload.get("sub", "external@ts2.local")
            dummy_operador.opr_status = "ativo"
            logger.info(f"Token ts2 aceito: {dummy_operador.opr_email}")
            return dummy_operador
        
        # Token do ts1: valida normalmente no banco de dados
        opr_id: str = payload.get("sub")
        if opr_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
    except JWTError as e:
        logger.error(f"Erro JWT: {str(e)}, chave: {JWT_SECRET_KEY[:10] if JWT_SECRET_KEY else 'VAZIA'}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Token inválido ou expirado: {str(e)}")

    operador = db.query(Operador).filter(Operador.opr_id == int(opr_id)).first()
    if not operador:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Operador não encontrado.")
    if operador.opr_status != "ativo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operador inativo.")

    return operador
