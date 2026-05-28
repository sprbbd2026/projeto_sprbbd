from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.auth_schema import LoginRequest, LoginResponse
from app.services.auth_service import login_user
from app.services.auditoria_service import registrar_evento_db

router = APIRouter(prefix="/auth")

@router.post("/login", response_model=LoginResponse)
def login(
    data: LoginRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    resposta_login = login_user(db, data)
    
    background_tasks.add_task(
        registrar_evento_db,
        db=db,
        tipo_evento="LOGIN_REALIZADO",
        satelite_id="AUTH",
        payload={"email": data.email},
        status="SUCESSO"
    )
    
    return resposta_login