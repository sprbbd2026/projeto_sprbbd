"""US302-T2 — índice composto satélite + timestamp no histórico

Revision ID: c3d4e5f6a7b8
Revises: 8013f75d83fd
Create Date: 2026-06-24 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "8013f75d83fd"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

INDEX_NAME = "ix_HISTORICO_LOCALIZACAO_sat_data_hora"
LEGACY_INDEX_NAME = "ix_historico_localizacao_sat_data_hora"


def _create_index_if_missing(table: str, columns: list[str], index_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table not in inspector.get_table_names():
        return
    existing = {idx["name"] for idx in inspector.get_indexes(table)}
    if index_name in existing:
        return
    op.create_index(index_name, table, columns, unique=False)


def upgrade() -> None:
    """Índice para consultas US302: filtro por satélite + ordenação por data."""
    _create_index_if_missing(
        "HISTORICO_LOCALIZACAO",
        ["hlc_satelite_id", "hlc_data_hora"],
        INDEX_NAME,
    )
    _create_index_if_missing(
        "historico_localizacao",
        ["satelite_id", "data_hora"],
        LEGACY_INDEX_NAME,
    )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "HISTORICO_LOCALIZACAO" in inspector.get_table_names():
        existing = {idx["name"] for idx in inspector.get_indexes("HISTORICO_LOCALIZACAO")}
        if INDEX_NAME in existing:
            op.drop_index(INDEX_NAME, table_name="HISTORICO_LOCALIZACAO")
    if "historico_localizacao" in inspector.get_table_names():
        existing = {idx["name"] for idx in inspector.get_indexes("historico_localizacao")}
        if LEGACY_INDEX_NAME in existing:
            op.drop_index(LEGACY_INDEX_NAME, table_name="historico_localizacao")
