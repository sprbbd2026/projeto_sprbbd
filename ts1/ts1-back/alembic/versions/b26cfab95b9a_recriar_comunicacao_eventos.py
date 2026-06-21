"""recriar_comunicacao_eventos

Revision ID: b26cfab95b9a
Revises: 67fbc3d9db91
Create Date: 2026-05-28 20:33:46.575144

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = 'b26cfab95b9a'
down_revision: Union[str, Sequence[str], None] = '67fbc3d9db91'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'comunicacao_eventos',
        sa.Column('evt_id', sa.Integer(), nullable=False),
        sa.Column('evt_data_hora', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('evt_tipo', sa.String(), nullable=False),
        sa.Column('evt_satelite_id', sa.String(), nullable=False),
        sa.Column('evt_payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('evt_status', sa.String(), nullable=False),
        sa.Column('opr_id', sa.Integer(), nullable=True),
        sa.PrimaryKeyConstraint('evt_id')
    )
    op.execute("CREATE SEQUENCE IF NOT EXISTS comunicacao_eventos_evt_id_seq OWNED BY comunicacao_eventos.evt_id")
    op.execute("ALTER TABLE comunicacao_eventos ALTER COLUMN evt_id SET DEFAULT nextval('comunicacao_eventos_evt_id_seq')")


def downgrade() -> None:
    op.drop_table('comunicacao_eventos')
