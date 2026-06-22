from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Health check", description="Retorna o status de disponibilidade do serviço.")
async def health_check() -> dict:
    return {"status": "ok"}
