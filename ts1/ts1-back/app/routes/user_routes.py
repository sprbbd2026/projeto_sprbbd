from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_schema import UserCreateRequest, UserResponse
from app.services.user_service import create_user
from app.services.auditoria_service import registrar_evento_db

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    data: UserCreateRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    novo_operador = create_user(db, data)
    
    background_tasks.add_task(
        registrar_evento_db,
        db=db,
        tipo_evento="OPERADOR_CADASTRADO",
        satelite_id="SISTEMA",
        payload={"email": data.email},
        status="SUCESSO"
    )
    
    return novo_operador