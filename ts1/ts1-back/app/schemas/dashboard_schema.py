from pydantic import BaseModel


class DashboardSummary(BaseModel):
    active_satellites: int
    alerts: int
    users: int
