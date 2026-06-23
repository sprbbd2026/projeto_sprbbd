import jwt
import uuid as uuid_lib
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    decode_access_token_ignoring_expiration,
    verify_password,
)
from app.db.models import Usuario, Dispositivo, Usuario_Dispositivo, Login
from app.schemas.auth_schema import LoginRequest, TokenResponse


def get_user_by_email(db: Session, email: str) -> Usuario | None:
    normalized = email.strip().lower()
    return db.query(Usuario).filter(Usuario.email == normalized).first()

def get_device_by_uuid(db: Session, uuid: str) -> Dispositivo | None:
    return db.query(Dispositivo).filter(Dispositivo.uuid == uuid).first()

def authenticate_user(db: Session, email: str, password: str) -> Usuario | None:
    user = get_user_by_email(db, email)
    if user is None:
        return None
    if not verify_password(password, user.senha):
        return None
    return user

def authenticate_device(db: Session, user_id: int, device_uid: str | None, metadata: str | None) -> Dispositivo:
    device = None
    if device_uid:
        device = get_device_by_uuid(db, device_uid)
    
    if device is None:
        new_uid = str(uuid_lib.uuid4())
        device = Dispositivo(
            uuid=new_uid,
            metadados={"info": metadata} if metadata else None
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    else:
        if metadata:
            device.metadados = {"info": metadata}
            db.commit()
            db.refresh(device)

    # Associa o dispositivo ao usuário se ainda não estiver associado
    assoc = db.query(Usuario_Dispositivo).filter(
        Usuario_Dispositivo.id_usuario == user_id,
        Usuario_Dispositivo.id_dispositivo == device.id
    ).first()

    if assoc is None:
        assoc = Usuario_Dispositivo(
            id_usuario=user_id,
            id_dispositivo=device.id,
            ativo=True
        )
        db.add(assoc)
        db.commit()
    elif  assoc.ativo:
        assoc.ativo = True
        db.commit()

    return device
    
def login_user(db: Session, body: LoginRequest, client_ip: str) -> TokenResponse | None:
    user = authenticate_user(db, body.email, body.password)
    if user is None:
        return None
    
    device = authenticate_device(db, user.id, body.device_uid, body.metadata)
    
    # Registra o login
    login_record = Login(
        id_usuario=user.id,
        id_dispositivo=device.id,
        ip=client_ip,
        ativo=True
    )
    db.add(login_record)
    db.commit()

    token = create_access_token(subject_user_id=user.id, user_uuid=user.uuid)
    return TokenResponse(access_token=token, device_uid=device.uuid)

def validate_user_device(db: Session, user_id: int, device_uid: str) -> bool:
    device = get_device_by_uuid(db, device_uid)
    if not device:
        return False
    assoc = db.query(Usuario_Dispositivo).filter(
        Usuario_Dispositivo.id_usuario == user_id,
        Usuario_Dispositivo.id_dispositivo == device.id,
        Usuario_Dispositivo.ativo.is_(True)
    ).first()
    return assoc is not None

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
