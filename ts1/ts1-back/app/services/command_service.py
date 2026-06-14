import base64

from fastapi import HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.models import Comando, EstacaoControle, Satelite
from app.schemas.command_schema import CommandCreateRequest, CommandDetailResponse, CommandResponse

COMMAND_STATUS_REGISTERED = "REGISTRADO"
COMMAND_STATUS_SENT = "ENVIADO"


def create_command(db: Session, data: CommandCreateRequest, operador_id: int) -> Comando:
    estacao = db.query(EstacaoControle).filter(EstacaoControle.est_id == data.est_id).first()
    if not estacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Estacao {data.est_id} nao encontrada.",
        )

    if estacao.est_status != "ativa":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Estacao {data.est_id} esta com status '{estacao.est_status}' "
                "e nao pode emitir comandos."
            ),
        )

    satelite = db.query(Satelite).filter(Satelite.sat_id == data.sat_id).first()
    if not satelite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satelite {data.sat_id} nao encontrado.",
        )

    if satelite.sat_status != "operacional":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Satelite {data.sat_id} esta com status '{satelite.sat_status}' "
                "e nao pode receber comandos."
            ),
        )

    comando = Comando(
        est_id=data.est_id,
        sat_id=data.sat_id,
        cmd_tipo=data.cmd_tipo,
        cmd_payload_binario=data.payload_bytes(),
        cmd_descricao=data.cmd_descricao,
        opr_id=operador_id,
        cmd_status=COMMAND_STATUS_REGISTERED,
    )

    db.add(comando)
    db.flush()

    comando.cmd_status = COMMAND_STATUS_SENT
    db.commit()
    db.refresh(comando)
    return comando


def list_commands(
    db: Session,
    sat_id: int | None = None,
    cmd_tipo: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[Comando], int]:
    query = db.query(Comando)

    if sat_id is not None:
        query = query.filter(Comando.sat_id == sat_id)

    if cmd_tipo is not None:
        query = query.filter(Comando.cmd_tipo == cmd_tipo.strip().upper())

    total = query.count()
    items = (
        query.order_by(desc(Comando.cmd_timestamp))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return items, total


def get_command_by_id(db: Session, cmd_id: int) -> Comando:
    comando = db.query(Comando).filter(Comando.cmd_id == cmd_id).first()
    if not comando:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comando {cmd_id} nao encontrado.",
        )
    return comando


def command_to_detail(comando: Comando) -> CommandDetailResponse:
    payload_b64 = None
    if comando.cmd_payload_binario:
        payload_b64 = base64.b64encode(comando.cmd_payload_binario).decode("ascii")

    base = CommandResponse.model_validate(comando)
    return CommandDetailResponse(
        **base.model_dump(),
        opr_id=comando.opr_id,
        cmd_payload_binario=payload_b64,
    )
