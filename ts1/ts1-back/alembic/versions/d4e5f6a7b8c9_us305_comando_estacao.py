"""US305 - estacao_controle e campos extras em comando

Revision ID: d4e5f6a7b8c9
Revises: c1d2e3f4a5b6
Create Date: 2026-06-16 00:00:00.000000

Observação: assume que a tabela `comando` já existe no banco (dívida técnica
conhecida, criada fora do histórico Alembic junto da US203).
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = ("a1b2c3d4e5f6", "c1d2e3f4a5b6")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "estacao_controle",
        sa.Column("est_id", sa.Integer(), nullable=False),
        sa.Column("est_nome", sa.String(), nullable=False),
        sa.Column("est_latitude", sa.Float(), nullable=True),
        sa.Column("est_longitude", sa.Float(), nullable=True),
        sa.Column("est_status", sa.String(), nullable=False, server_default="ativa"),
        sa.PrimaryKeyConstraint("est_id"),
    )
    op.create_index(
        op.f("ix_estacao_controle_est_id"),
        "estacao_controle",
        ["est_id"],
        unique=False,
    )

    op.execute(
        """
        INSERT INTO estacao_controle (est_id, est_nome, est_latitude, est_longitude, est_status)
        VALUES (1, 'Estação Principal', -23.2237, -45.9009, 'ativa')
        ON CONFLICT (est_id) DO NOTHING
        """
    )

    op.add_column("comando", sa.Column("opr_id", sa.Integer(), nullable=True))
    op.add_column(
        "comando",
        sa.Column(
            "cmd_status",
            sa.String(length=20),
            nullable=False,
            server_default="REGISTRADO",
        ),
    )
    op.add_column("comando", sa.Column("cmd_descricao", sa.String(length=255), nullable=True))

    op.create_foreign_key(
        "fk_comando_operador",
        "comando",
        "operador",
        ["opr_id"],
        ["opr_id"],
    )
    op.create_index(
        "ix_comando_sat_timestamp",
        "comando",
        ["sat_id", "cmd_timestamp"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_comando_sat_timestamp", table_name="comando")
    op.drop_constraint("fk_comando_operador", "comando", type_="foreignkey")
    op.drop_column("comando", "cmd_descricao")
    op.drop_column("comando", "cmd_status")
    op.drop_column("comando", "opr_id")
    op.drop_index(op.f("ix_estacao_controle_est_id"), table_name="estacao_controle")
    op.drop_table("estacao_controle")
