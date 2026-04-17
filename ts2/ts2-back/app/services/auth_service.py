import jwt
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token_ignoring_expiration,
    verify_password,
)
from app.db.models import Usuario
from app.schemas.auth_schema import LoginRequest, TokenResponse


def get_user_by_email(db: Session, email: str) -> Usuario | None:
    normalized = email.strip().lower()
    return db.query(Usuario).filter(Usuario.email == normalized).first()


def authenticate_user(db: Session, email: str, password: str) -> Usuario | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.senha):
        return None
    return user


def login_user(db: Session, body: LoginRequest) -> TokenResponse | None:
    user = authenticate_user(db, body.email, body.password)
    if user is None:
        return None
    token = create_access_token(subject_user_id=user.id, user_uuid=user.uuid)
    return TokenResponse(access_token=token)


def refresh_with_token(db: Session, old_access_token: str) -> TokenResponse | None:
    try:
        payload = decode_access_token_ignoring_expiration(old_access_token.strip())
    except jwt.InvalidTokenError:
        return None
    sub = payload.get("sub")
    uuid_str = payload.get("uuid")
    if sub is None or uuid_str is None:
        return None
    try:
        user_id = int(sub)
    except (TypeError, ValueError):
        return None
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if user is None:
        return None
    if str(user.uuid) != str(uuid_str):
        return None
    return TokenResponse(
        access_token=create_access_token(subject_user_id=user.id, user_uuid=user.uuid)
    )
