from pydantic import BaseModel, ConfigDict, Field


class DashboardSummary(BaseModel):
    """Indicadores operacionais consolidados para o painel do dashboard (US304)."""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "active_satellites": 5,
                "alerts": 2,
                "users": 12,
            }
        }
    )

    active_satellites: int = Field(
        ...,
        ge=0,
        description="Quantidade de satélites com status operacional.",
        examples=[5],
    )
    alerts: int = Field(
        ...,
        ge=0,
        description=(
            "Total de alertas operacionais: satélites em falha ou manutenção "
            "somado a eventos de comunicação com status crítico."
        ),
        examples=[2],
    )
    users: int = Field(
        ...,
        ge=0,
        description="Quantidade de operadores com status ativo.",
        examples=[12],
    )
