"""drop legacy lowercase tables

Revision ID: 8013f75d83fd
Revises: 31fab588bd5f
Create Date: 2026-06-21 01:05:29.871174

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8013f75d83fd'
down_revision: Union[str, Sequence[str], None] = '31fab588bd5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove schema legado (tabelas minúsculas) sem afetar o schema atual (maiúsculo).
    op.execute(sa.text("DROP TABLE IF EXISTS logins CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS dispositivos CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS usuarios CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS locais CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS pontos CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS ruas CASCADE"))
    op.execute(sa.text("DROP TABLE IF EXISTS cidades CASCADE"))


def downgrade() -> None:
    """Downgrade schema."""
    # Irreversível por design: esta migration remove tabelas legadas antigas.
    pass
