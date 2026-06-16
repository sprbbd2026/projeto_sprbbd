"""add_timestamp_to_local

Revision ID: a8c2d3e4f5b6
Revises: 07a40c1d55c2
Create Date: 2026-06-16 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a8c2d3e4f5b6'
down_revision: Union[str, Sequence[str], None] = '81dd49facb92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add timestamp column to LOCAL table
    op.add_column(
        'LOCAL',
        sa.Column('loc_timestamp', sa.DateTime(timezone=True), nullable=False)
    )
    # Create index on timestamp for sorting queries
    op.create_index('ix_LOCAL_loc_timestamp', 'LOCAL', ['loc_timestamp'])


def downgrade() -> None:
    """Downgrade schema."""
    # Drop index
    op.drop_index('ix_LOCAL_loc_timestamp', 'LOCAL')
    # Drop timestamp column
    op.drop_column('LOCAL', 'loc_timestamp')
