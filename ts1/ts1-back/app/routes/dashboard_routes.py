from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.dashboard_schema import DashboardSummary
from app.services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary, summary="Resumo do dashboard")
def dashboard_summary(
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    return get_dashboard_summary(db)
