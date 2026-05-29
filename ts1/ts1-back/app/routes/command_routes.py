from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.command_schema import CommandCreateRequest, CommandResponse
from app.services.command_service import create_command
from app.services.auditoria_service import registrar_evento_db
from app.dependencies import get_current_user

router = APIRouter()


@router.post("/commands", response_model=CommandResponse, status_code=201)
def send_command(
    data: CommandCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(get_current_user)
):
    comando = create_command(db, data)

    background_tasks.add_task(
        registrar_evento_db,
        db=db,
        tipo_evento="COMANDO_ENVIADO",
        satelite_id=f"SAT:{data.sat_id}",
        payload={
            "cmd_id": comando.cmd_id,
            "cmd_tipo": data.cmd_tipo,
            "est_id": data.est_id,
        },
        status="SUCESSO"
    )

    return comando
