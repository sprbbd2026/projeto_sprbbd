from sqlalchemy.orm import Session

from app.db.models import Comando
from app.schemas.command_schema import CommandCreateRequest


def create_command(db: Session, data: CommandCreateRequest) -> Comando:
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
