"""Initial migration

Revision ID: 83802d0207c8
Revises:
Create Date: 2026-04-06 16:06:30.353522

"""
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "83802d0207c8"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Baseline: sem DROP. O schema do ERD é criado em `fdee4ea7cce4`."""


def downgrade() -> None:
    """Reverte a baseline (nenhuma alteração)."""
