"""Initial migration

Revision ID: 83802d0207c8
Revises: 
Create Date: 2026-04-06 16:06:30.353522

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83802d0207c8'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(), nullable=True),
        sa.Column('sobrenome', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('senha', sa.String(), nullable=True),
        sa.Column('data_nascimento', sa.String(), nullable=True),
        sa.Column('documento', sa.String(), nullable=True),
        sa.Column('latitude', sa.String(), nullable=True),
        sa.Column('longitude', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'], unique=False)

    op.create_table(
        'telemetria',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('satelite_id', sa.String(), nullable=True),
        sa.Column('cpu_percentual', sa.Float(), nullable=True),
        sa.Column('temperatura_celsius', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('data_hora', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_telemetria_id'), 'telemetria', ['id'], unique=False)
    op.create_index(op.f('ix_telemetria_satelite_id'), 'telemetria', ['satelite_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_telemetria_satelite_id'), table_name='telemetria')
    op.drop_index(op.f('ix_telemetria_id'), table_name='telemetria')
    op.drop_table('telemetria')
    op.drop_index(op.f('ix_usuarios_id'), table_name='usuarios')
    op.drop_table('usuarios')
