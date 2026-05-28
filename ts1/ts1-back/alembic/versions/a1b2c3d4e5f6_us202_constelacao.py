"""US202 - cria tabela constelacao e vincula satelite

Revision ID: a1b2c3d4e5f6
Revises: 67fbc3d9db91
Create Date: 2026-05-28 00:00:00.000000

Observação: esta migração assume que a tabela `satelite` já existe no banco
(criada fora do histórico Alembic, junto da US201). A inconsistência do
histórico de migrações — `satelite` e `comando` ausentes da migração base —
é uma dívida técnica conhecida e fora do escopo da US202.
"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "67fbc3d9db91"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "constelacao",
        sa.Column("cnt_id", sa.Integer(), nullable=False),
        sa.Column("cnt_nome", sa.String(), nullable=False),
        sa.Column("cnt_descricao", sa.String(), nullable=True),
        sa.Column("cnt_status", sa.String(), nullable=True),
        sa.PrimaryKeyConstraint("cnt_id"),
        sa.UniqueConstraint("cnt_nome"),
    )
    op.create_index(
        op.f("ix_constelacao_cnt_id"), "constelacao", ["cnt_id"], unique=False
    )

    op.add_column("satelite", sa.Column("cnt_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_satelite_constelacao",
        "satelite",
        "constelacao",
        ["cnt_id"],
        ["cnt_id"],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_satelite_constelacao", "satelite", type_="foreignkey")
    op.drop_column("satelite", "cnt_id")
    op.drop_index(op.f("ix_constelacao_cnt_id"), table_name="constelacao")
    op.drop_table("constelacao")
