from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.db.models import Comando, Satelite
from app.schemas.command_schema import CommandCreateRequest


def create_command(db: Session, data: CommandCreateRequest) -> Comando:
    satelite = db.query(Satelite).filter(Satelite.sat_id == data.sat_id).first()

    if not satelite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satelite {data.sat_id} nao encontrado."
        )

    if satelite.sat_status != "operacional":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Satelite {data.sat_id} esta com status '{satelite.sat_status}' e nao pode receber comandos."
        )

    comando = Comando(
        est_id=data.est_id,
        sat_id=data.sat_id,
        cmd_tipo=data.cmd_tipo,
        cmd_payload_binario=data.payload_bytes(),
    )

    db.add(comando)
    db.commit()
    db.refresh(comando)
    return comando
