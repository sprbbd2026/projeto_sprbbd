"""US303 - Adiciona tabela historico_localizacao

Revision ID: a1b2c3d4e5f6
Revises: 83802d0207c8
Create Date: 2026-06-19 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '83802d0207c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Cria tabela historico_localizacao para US303."""
    op.create_table(
        'historico_localizacao',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('satelite_id', sa.String(), nullable=False, index=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('altitude_km', sa.Float(), nullable=True),
        sa.Column('velocidade_kmh', sa.Float(), nullable=True),
        sa.Column(
            'data_hora',
            sa.DateTime(),
            nullable=True,
            index=True,
        ),
    )


def downgrade() -> None:
    """Remove tabela historico_localizacao."""
    op.drop_table('historico_localizacao')
