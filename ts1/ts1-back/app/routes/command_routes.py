from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Operador
from app.dependencies import get_current_user
from app.schemas.command_schema import (
    CommandCreateRequest,
    CommandDetailResponse,
    CommandListResponse,
    CommandResponse,
)
from app.services.auditoria_service import registrar_evento_background
from app.services.command_service import (
    command_to_detail,
    create_command,
    get_command_by_id,
    list_commands,
)

router = APIRouter(tags=["Comandos"])


@router.get(
    "/commands",
    response_model=CommandListResponse,
    summary="Listar comandos enviados",
    description="Retorna histórico de comandos ordenado por data decrescente, com filtros opcionais.",
)
def get_commands(
    sat_id: int | None = Query(default=None, description="Filtrar por satélite/dispositivo"),
    cmd_tipo: str | None = Query(default=None, description="Filtrar por tipo de comando"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
    _current_user: Operador = Depends(get_current_user),
):
    items, total = list_commands(db, sat_id=sat_id, cmd_tipo=cmd_tipo, skip=skip, limit=limit)
    return CommandListResponse(
        items=[CommandResponse.model_validate(item) for item in items],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/commands/{cmd_id}",
    response_model=CommandDetailResponse,
    summary="Detalhe de comando enviado",
    responses={404: {"description": "Comando não encontrado"}},
)
def get_command(
    cmd_id: int,
    db: Session = Depends(get_db),
    _current_user: Operador = Depends(get_current_user),
):
    comando = get_command_by_id(db, cmd_id)
    return command_to_detail(comando)


@router.post(
    "/commands",
    response_model=CommandResponse,
    status_code=201,
    summary="Enviar comando remoto para dispositivo",
    description=(
        "Registra e encaminha um comando operacional para um satélite/dispositivo. "
        "Requer autenticação JWT. Retorna 201 com status ENVIADO em caso de sucesso."
    ),
    responses={
        201: {"description": "Comando registrado e encaminhado"},
        401: {"description": "Usuário não autenticado"},
        404: {"description": "Estação ou satélite não encontrado"},
        409: {"description": "Estação ou satélite indisponível para comandos"},
        422: {"description": "Payload ou parâmetros inválidos"},
    },
)
def send_command(
    data: CommandCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Operador = Depends(get_current_user),
):
    comando = create_command(db, data, operador_id=current_user.opr_id)

    background_tasks.add_task(
        registrar_evento_background,
        tipo_evento="COMANDO_ENVIADO",
        satelite_id=f"SAT:{data.sat_id}",
        payload={
            "cmd_id": comando.cmd_id,
            "cmd_tipo": data.cmd_tipo,
            "est_id": data.est_id,
            "cmd_status": comando.cmd_status,
        },
        status="SUCESSO",
        operador_id=current_user.opr_id,
    )

    return comando
