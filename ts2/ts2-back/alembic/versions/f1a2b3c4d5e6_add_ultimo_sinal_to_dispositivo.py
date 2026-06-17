"""add_ultimo_sinal_to_dispositivo

Adiciona a coluna dis_ultimo_sinal em DISPOSITIVO (US304 - dispositivos online).

Esta revisão também mescla os dois heads que existiam na árvore de migrações
('07a40c1d55c2' e 'a8c2d3e4f5b6'), restaurando um único head para que
`alembic upgrade head` volte a funcionar.

Revision ID: f1a2b3c4d5e6
Revises: 07a40c1d55c2, a8c2d3e4f5b6
Create Date: 2026-06-17 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = ('07a40c1d55c2', 'a8c2d3e4f5b6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'DISPOSITIVO',
        sa.Column('dis_ultimo_sinal', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        'ix_DISPOSITIVO_dis_ultimo_sinal', 'DISPOSITIVO', ['dis_ultimo_sinal']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_DISPOSITIVO_dis_ultimo_sinal', 'DISPOSITIVO')
    op.drop_column('DISPOSITIVO', 'dis_ultimo_sinal')
