from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.command_schema import CommandCreateRequest, CommandResponse
from app.services.command_service import create_command

router = APIRouter()


@router.post("/commands", response_model=CommandResponse, status_code=201)
def send_command(data: CommandCreateRequest, db: Session = Depends(get_db)):
    return create_command(db, data)
