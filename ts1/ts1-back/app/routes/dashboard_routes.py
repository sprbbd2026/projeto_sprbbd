from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.dashboard_schema import DashboardSummary
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Resumo operacional do dashboard",
    description=(
        "Retorna indicadores consolidados para o painel operacional (US304):\n\n"
        "- **active_satellites** — satélites operacionais\n"
        "- **alerts** — satélites em falha/manutenção + eventos críticos\n"
        "- **users** — operadores ativos\n\n"
        "Requer autenticação JWT (`Authorization: Bearer <token>`). "
        "Consumido pelo front-end com polling periódico (~30s)."
    ),
    responses={
        401: {"description": "Token ausente, inválido ou expirado."},
        403: {"description": "Usuário sem permissão para acessar o recurso."},
    },
)
def dashboard_summary(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    """US304 — indicadores do dashboard para atualização automática no front-end."""
    return get_dashboard_summary(db)
