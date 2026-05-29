from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user_schema import UserCreateRequest, UserResponse
from app.services.user_service import create_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    data: UserCreateRequest,
    db: Session = Depends(get_db)
):
    return create_user(db, data)