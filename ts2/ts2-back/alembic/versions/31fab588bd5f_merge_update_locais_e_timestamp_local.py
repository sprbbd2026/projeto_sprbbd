"""merge update locais e timestamp local

Revision ID: 31fab588bd5f
Revises: 07a40c1d55c2, a8c2d3e4f5b6
Create Date: 2026-06-21 00:41:37.431475

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '31fab588bd5f'
down_revision: Union[str, Sequence[str], None] = ('07a40c1d55c2', 'a8c2d3e4f5b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
