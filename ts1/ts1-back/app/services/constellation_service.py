from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Constelacao, Satelite
from app.schemas.constellation_schema import ConstellationCreateRequest


def _count_satelites(db: Session, con_id: int) -> int:
    return db.query(Satelite).filter(Satelite.con_id == con_id).count()


def _to_response(db: Session, constelacao: Constelacao) -> dict:
    return {
        "con_id": constelacao.con_id,
        "con_nome": constelacao.con_nome,
        "sat_quantidade": _count_satelites(db, constelacao.con_id),
    }


def _to_detail(db: Session, constelacao: Constelacao) -> dict:
    satelites = db.query(Satelite).filter(Satelite.con_id == constelacao.con_id).all()
    return {**_to_response(db, constelacao), "satelites": satelites}


def _resolve_satelites(
    db: Session, sat_ids: list[int], current_con_id: int | None = None
) -> list[Satelite]:
    unique_ids = list(set(sat_ids))
    satelites = db.query(Satelite).filter(Satelite.sat_id.in_(unique_ids)).all()

    encontrados = {s.sat_id for s in satelites}
    faltando = set(unique_ids) - encontrados
    if faltando:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Satelite(s) nao encontrado(s): {sorted(faltando)}")

    ocupados = [s.sat_id for s in satelites if s.con_id is not None and s.con_id != current_con_id]
    if ocupados:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Satelite(s) ja vinculado(s) a outra constelacao: {sorted(ocupados)}")

    return satelites


def get_all_constellations(db: Session) -> list[dict]:
    return [_to_response(db, c) for c in db.query(Constelacao).all()]


def get_constellation_by_id(db: Session, con_id: int) -> dict:
    return _to_detail(db, _get_or_404(db, con_id))


def _get_or_404(db: Session, con_id: int) -> Constelacao:
    constelacao = db.query(Constelacao).filter(Constelacao.con_id == con_id).first()
    if not constelacao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Constelacao nao encontrada")
    return constelacao


def create_constellation(db: Session, data: ConstellationCreateRequest) -> dict:
    satelites = _resolve_satelites(db, data.sat_ids)

    constelacao = Constelacao(con_nome=data.con_nome.strip())
    db.add(constelacao)

    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ja existe uma constelacao com esse nome.")

    for sat in satelites:
        sat.con_id = constelacao.con_id

    db.commit()
    db.refresh(constelacao)
    return _to_detail(db, constelacao)


def update_constellation(db: Session, con_id: int, data: ConstellationCreateRequest) -> dict:
    constelacao = _get_or_404(db, con_id)
    novos_satelites = _resolve_satelites(db, data.sat_ids, current_con_id=con_id)

    constelacao.con_nome = data.con_nome.strip()

    novos_ids = {s.sat_id for s in novos_satelites}
    atuais = db.query(Satelite).filter(Satelite.con_id == con_id).all()

    for sat in atuais:
        if sat.sat_id not in novos_ids:
            sat.con_id = None

    for sat in novos_satelites:
        sat.con_id = con_id

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ja existe uma constelacao com esse nome.")

    db.refresh(constelacao)
    return _to_detail(db, constelacao)


def delete_constellation(db: Session, con_id: int) -> dict:
    constelacao = _get_or_404(db, con_id)
    db.query(Satelite).filter(Satelite.con_id == con_id).update({Satelite.con_id: None})
    db.delete(constelacao)
    db.commit()
    return {"message": "Constelacao deletada com sucesso"}
