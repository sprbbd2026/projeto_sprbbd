"""criar tabela telemetria

Revision ID: c1d2e3f4a5b6
Revises: b26cfab95b9a
Create Date: 2026-05-29 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'c1d2e3f4a5b6'
down_revision: Union[str, None] = 'b26cfab95b9a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'telemetria',
        sa.Column('tlm_id', sa.Integer(), primary_key=True, nullable=False),
        sa.Column('sat_id', sa.Integer(), sa.ForeignKey('satelite.sat_id'), nullable=True),
        sa.Column('tlm_temperatura', sa.Float(), nullable=True),
        sa.Column('tlm_timestamp', sa.DateTime(), nullable=True),
        sa.Column('tlm_orientacao', sa.String(), nullable=True),
        sa.Column('tlm_checksum', sa.String(), nullable=True),
        sa.Column('tlm_memoria', sa.Float(), nullable=True),
        sa.Column('tlm_energia', sa.Float(), nullable=True),
        sa.Column('tlm_relogio', sa.DateTime(), nullable=True),
        sa.Column('tlm_cpu', sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('telemetria')
