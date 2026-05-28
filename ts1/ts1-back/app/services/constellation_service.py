from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.models import Constelacao, Satelite
from app.schemas.constellation_schema import ConstellationCreateRequest


def _count_satelites(db: Session, cnt_id: int) -> int:
    return db.query(Satelite).filter(Satelite.cnt_id == cnt_id).count()


def _to_response(db: Session, constelacao: Constelacao) -> dict:
    return {
        "cnt_id": constelacao.cnt_id,
        "cnt_nome": constelacao.cnt_nome,
        "cnt_descricao": constelacao.cnt_descricao,
        "cnt_status": constelacao.cnt_status,
        "sat_quantidade": _count_satelites(db, constelacao.cnt_id),
    }


def _to_detail(db: Session, constelacao: Constelacao) -> dict:
    satelites = (
        db.query(Satelite).filter(Satelite.cnt_id == constelacao.cnt_id).all()
    )
    return {
        **_to_response(db, constelacao),
        "satelites": satelites,
    }


def _resolve_satelites(
    db: Session, sat_ids: list[int], current_cnt_id: int | None = None
) -> list[Satelite]:
    """Valida que todos os IDs existem e estão livres (ou já pertencem a esta
    constelação, no caso de edição). Retorna as instâncias de Satelite."""
    unique_ids = list(set(sat_ids))
    satelites = db.query(Satelite).filter(Satelite.sat_id.in_(unique_ids)).all()

    encontrados = {s.sat_id for s in satelites}
    faltando = set(unique_ids) - encontrados
    if faltando:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Satélite(s) não encontrado(s): {sorted(faltando)}",
        )

    ocupados = [
        s.sat_id
        for s in satelites
        if s.cnt_id is not None and s.cnt_id != current_cnt_id
    ]
    if ocupados:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Satélite(s) já vinculado(s) a outra "
                f"constelação: {sorted(ocupados)}"
            ),
        )

    return satelites


def get_all_constellations(db: Session) -> list[dict]:
    constelacoes = db.query(Constelacao).all()
    return [_to_response(db, c) for c in constelacoes]


def get_constellation_by_id(db: Session, cnt_id: int) -> dict:
    constelacao = _get_or_404(db, cnt_id)
    return _to_detail(db, constelacao)


def _get_or_404(db: Session, cnt_id: int) -> Constelacao:
    constelacao = db.query(Constelacao).filter(Constelacao.cnt_id == cnt_id).first()
    if not constelacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Constelação não encontrada",
        )
    return constelacao


def create_constellation(db: Session, data: ConstellationCreateRequest) -> dict:
    satelites = _resolve_satelites(db, data.sat_ids)

    constelacao = Constelacao(
        cnt_nome=data.cnt_nome.strip(),
        cnt_descricao=data.cnt_descricao,
        cnt_status=data.cnt_status,
    )
    db.add(constelacao)

    try:
        db.flush()  # gera cnt_id sem encerrar a transação
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma constelação com esse nome.",
        )

    for sat in satelites:
        sat.cnt_id = constelacao.cnt_id

    db.commit()
    db.refresh(constelacao)
    return _to_detail(db, constelacao)


def update_constellation(
    db: Session, cnt_id: int, data: ConstellationCreateRequest
) -> dict:
    constelacao = _get_or_404(db, cnt_id)
    novos_satelites = _resolve_satelites(db, data.sat_ids, current_cnt_id=cnt_id)

    constelacao.cnt_nome = data.cnt_nome.strip()
    constelacao.cnt_descricao = data.cnt_descricao
    constelacao.cnt_status = data.cnt_status

    novos_ids = {s.sat_id for s in novos_satelites}
    atuais = db.query(Satelite).filter(Satelite.cnt_id == cnt_id).all()

    # libera os que saíram
    for sat in atuais:
        if sat.sat_id not in novos_ids:
            sat.cnt_id = None

    # vincula os novos
    for sat in novos_satelites:
        sat.cnt_id = cnt_id

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma constelação com esse nome.",
        )

    db.refresh(constelacao)
    return _to_detail(db, constelacao)


def delete_constellation(db: Session, cnt_id: int) -> dict:
    constelacao = _get_or_404(db, cnt_id)

    # libera os satélites antes de remover a constelação
    db.query(Satelite).filter(Satelite.cnt_id == cnt_id).update(
        {Satelite.cnt_id: None}
    )

    db.delete(constelacao)
    db.commit()
    return {"message": "Constelação deletada com sucesso"}
