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
    # 1. Executa a ação principal
    novo_usuario = create_user(db, data)
    
    # 2. Adiciona o log na fila de tarefas em 2º plano
    background_tasks.add_task(
        registrar_evento_db,
        db=db,
        tipo_evento="USUARIO_CADASTRADO",
        satelite_id="SISTEMA",  # Indica que é um evento interno do sistema
        payload={"email": data.email}, # Apenas dados seguros, sem a senha!
        status="SUCESSO"
    )
    
    # 3. Retorna a resposta instantaneamente para o front-end
    return novo_usuario