import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Operador

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Operador:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        opr_id: str = payload.get("sub")
        if opr_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado.")

    operador = db.query(Operador).filter(Operador.opr_id == int(opr_id)).first()
    if not operador:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Operador não encontrado.")
    if operador.opr_status != "ativo":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operador inativo.")

    return operador
