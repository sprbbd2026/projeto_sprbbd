"""US302-T2 — índice composto sat_id + timestamp em telemetria

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-24 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_telemetria_sat_timestamp"


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "telemetria" not in inspector.get_table_names():
        return
    existing = {idx["name"] for idx in inspector.get_indexes("telemetria")}
    if INDEX_NAME in existing:
        return
    op.create_index(
        INDEX_NAME,
        "telemetria",
        ["sat_id", "tlm_timestamp"],
        unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "telemetria" not in inspector.get_table_names():
        return
    existing = {idx["name"] for idx in inspector.get_indexes("telemetria")}
    if INDEX_NAME in existing:
        op.drop_index(INDEX_NAME, table_name="telemetria")
