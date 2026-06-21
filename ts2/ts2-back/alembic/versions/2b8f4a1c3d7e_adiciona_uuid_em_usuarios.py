"""adiciona uuid em usuarios

Revision ID: 2b8f4a1c3d7e
Revises: fdee4ea7cce4
Create Date: 2026-04-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2b8f4a1c3d7e"
down_revision: Union[str, Sequence[str], None] = "fdee4ea7cce4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("usuarios", sa.Column("uuid", sa.String(length=36), nullable=True))
    op.execute(sa.text("UPDATE usuarios SET uuid = gen_random_uuid()::text WHERE uuid IS NULL"))
    op.alter_column("usuarios", "uuid", existing_type=sa.String(length=36), nullable=False)
    op.create_index(op.f("ix_usuarios_uuid"), "usuarios", ["uuid"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_usuarios_uuid"), table_name="usuarios")
    op.drop_column("usuarios", "uuid")
