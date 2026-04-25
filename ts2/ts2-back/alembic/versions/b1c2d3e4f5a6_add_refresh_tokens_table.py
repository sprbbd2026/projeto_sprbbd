"""add refresh_tokens table

Revision ID: b1c2d3e4f5a6
Revises: 83802d0207c8
Create Date: 2026-04-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b1c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "83802d0207c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "refresh_tokens",
        sa.Column("id_refresh_token", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("jti", sa.String(length=36), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["id_usuario"], ["usuarios.id_usuario"]),
        sa.PrimaryKeyConstraint("id_refresh_token"),
    )
    op.create_index("ix_refresh_tokens_jti", "refresh_tokens", ["jti"], unique=True)
    op.create_index("ix_refresh_tokens_id_usuario", "refresh_tokens", ["id_usuario"])


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_id_usuario", table_name="refresh_tokens")
    op.drop_index("ix_refresh_tokens_jti", table_name="refresh_tokens")
    op.drop_table("refresh_tokens")
