"""adiciona tabelas do ERD

Revision ID: fdee4ea7cce4
Revises: 83802d0207c8
Create Date: 2026-04-17 19:30:39.633938

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM


revision: str = "fdee4ea7cce4"
down_revision: Union[str, Sequence[str], None] = "83802d0207c8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    op.create_table(
        "cidades",
        sa.Column("id_cidade", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("estado", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id_cidade"),
    )
    op.create_index(op.f("ix_cidades_id_cidade"), "cidades", ["id_cidade"], unique=False)

    op.create_table(
        "ruas",
        sa.Column("id_rua", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_cidade", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("cep", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["id_cidade"], ["cidades.id_cidade"]),
        sa.PrimaryKeyConstraint("id_rua"),
    )
    op.create_index(op.f("ix_ruas_id_cidade"), "ruas", ["id_cidade"], unique=False)
    op.create_index(op.f("ix_ruas_id_rua"), "ruas", ["id_rua"], unique=False)

    op.create_table(
        "pontos",
        sa.Column("id_ponto", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_rua", sa.Integer(), nullable=False),
        sa.Column("altitude", sa.Float(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=False),
        sa.Column("longitude", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["id_rua"], ["ruas.id_rua"]),
        sa.PrimaryKeyConstraint("id_ponto"),
    )
    op.create_index(op.f("ix_pontos_id_ponto"), "pontos", ["id_ponto"], unique=False)
    op.create_index(op.f("ix_pontos_id_rua"), "pontos", ["id_rua"], unique=False)

    op.execute(
        sa.text(
            """
            DO $$ BEGIN
                CREATE TYPE tipo_local AS ENUM (
                    'residencial', 'comercial', 'industrial', 'publico', 'outro'
                );
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$;
            """
        )
    )

    tipo_local = PG_ENUM(
        "residencial",
        "comercial",
        "industrial",
        "publico",
        "outro",
        name="tipo_local",
        create_type=False,
    )

    op.create_table(
        "locais",
        sa.Column("id_local", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_ponto", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(), nullable=False),
        sa.Column("tipo", tipo_local, nullable=False),
        sa.ForeignKeyConstraint(["id_ponto"], ["pontos.id_ponto"]),
        sa.PrimaryKeyConstraint("id_local"),
    )
    op.create_index(op.f("ix_locais_id_local"), "locais", ["id_local"], unique=False)
    op.create_index(op.f("ix_locais_id_ponto"), "locais", ["id_ponto"], unique=False)

    if inspector.has_table("usuarios"):
        cols = {c["name"] for c in inspector.get_columns("usuarios")}
        if "id" in cols and "id_usuario" not in cols:
            op.execute(sa.text("ALTER TABLE usuarios RENAME COLUMN id TO id_usuario"))
        if "latitude" in cols:
            op.drop_column("usuarios", "latitude")
        if "longitude" in cols:
            op.drop_column("usuarios", "longitude")

        op.execute(sa.text("DROP INDEX IF EXISTS ix_usuarios_id"))
        op.execute(sa.text("ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_email_key"))

        op.alter_column("usuarios", "nome", existing_type=sa.VARCHAR(), nullable=False)
        op.alter_column("usuarios", "sobrenome", existing_type=sa.VARCHAR(), nullable=False)

        dt_row = bind.execute(
            sa.text(
                "SELECT data_type FROM information_schema.columns "
                "WHERE table_schema = current_schema() AND table_name = 'usuarios' "
                "AND column_name = 'data_nascimento'"
            )
        ).fetchone()
        if dt_row and dt_row[0] != "date":
            op.execute(
                sa.text(
                    "ALTER TABLE usuarios ALTER COLUMN data_nascimento TYPE DATE USING "
                    "NULLIF(TRIM(data_nascimento::text), '')::date"
                )
            )
        op.alter_column("usuarios", "data_nascimento", existing_type=sa.Date(), nullable=False)

        op.alter_column("usuarios", "email", existing_type=sa.VARCHAR(), nullable=False)
        op.alter_column("usuarios", "senha", existing_type=sa.VARCHAR(), nullable=False)
        op.alter_column("usuarios", "documento", existing_type=sa.VARCHAR(), nullable=False)

        op.execute(sa.text("DROP INDEX IF EXISTS ix_usuarios_email"))
        op.execute(sa.text("DROP INDEX IF EXISTS ix_usuarios_documento"))
        op.create_index(op.f("ix_usuarios_email"), "usuarios", ["email"], unique=True)
        op.create_index(op.f("ix_usuarios_documento"), "usuarios", ["documento"], unique=True)
        op.create_index(op.f("ix_usuarios_id_usuario"), "usuarios", ["id_usuario"], unique=False)
    else:
        op.create_table(
            "usuarios",
            sa.Column("id_usuario", sa.Integer(), autoincrement=True, nullable=False),
            sa.Column("nome", sa.String(), nullable=False),
            sa.Column("sobrenome", sa.String(), nullable=False),
            sa.Column("data_nascimento", sa.Date(), nullable=False),
            sa.Column("email", sa.String(), nullable=False),
            sa.Column("senha", sa.String(), nullable=False),
            sa.Column("documento", sa.String(), nullable=False),
            sa.PrimaryKeyConstraint("id_usuario"),
        )
        op.create_index(op.f("ix_usuarios_id_usuario"), "usuarios", ["id_usuario"], unique=False)
        op.create_index(op.f("ix_usuarios_email"), "usuarios", ["email"], unique=True)
        op.create_index(op.f("ix_usuarios_documento"), "usuarios", ["documento"], unique=True)

    op.create_table(
        "dispositivos",
        sa.Column("id_dispositivo", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("id_ponto", sa.Integer(), nullable=False),
        sa.Column("metadados", sa.JSON(), nullable=True),
        sa.Column("uuid", sa.String(length=36), nullable=False),
        sa.ForeignKeyConstraint(["id_ponto"], ["pontos.id_ponto"]),
        sa.ForeignKeyConstraint(["id_usuario"], ["usuarios.id_usuario"]),
        sa.PrimaryKeyConstraint("id_dispositivo"),
    )
    op.create_index(op.f("ix_dispositivos_id_dispositivo"), "dispositivos", ["id_dispositivo"], unique=False)
    op.create_index(op.f("ix_dispositivos_id_ponto"), "dispositivos", ["id_ponto"], unique=False)
    op.create_index(op.f("ix_dispositivos_id_usuario"), "dispositivos", ["id_usuario"], unique=False)
    op.create_index(op.f("ix_dispositivos_uuid"), "dispositivos", ["uuid"], unique=True)

    op.create_table(
        "logins",
        sa.Column("id_login", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("id_usuario", sa.Integer(), nullable=False),
        sa.Column("id_dispositivo", sa.Integer(), nullable=False),
        sa.Column("ip", sa.String(length=45), nullable=False),
        sa.Column(
            "data_hora",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("ativo", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["id_dispositivo"], ["dispositivos.id_dispositivo"]),
        sa.ForeignKeyConstraint(["id_usuario"], ["usuarios.id_usuario"]),
        sa.PrimaryKeyConstraint("id_login"),
    )
    op.create_index(op.f("ix_logins_id_dispositivo"), "logins", ["id_dispositivo"], unique=False)
    op.create_index(op.f("ix_logins_id_login"), "logins", ["id_login"], unique=False)
    op.create_index(op.f("ix_logins_id_usuario"), "logins", ["id_usuario"], unique=False)


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index(op.f("ix_logins_id_usuario"), table_name="logins")
    op.drop_index(op.f("ix_logins_id_login"), table_name="logins")
    op.drop_index(op.f("ix_logins_id_dispositivo"), table_name="logins")
    op.drop_table("logins")

    op.drop_index(op.f("ix_dispositivos_uuid"), table_name="dispositivos")
    op.drop_index(op.f("ix_dispositivos_id_usuario"), table_name="dispositivos")
    op.drop_index(op.f("ix_dispositivos_id_ponto"), table_name="dispositivos")
    op.drop_index(op.f("ix_dispositivos_id_dispositivo"), table_name="dispositivos")
    op.drop_table("dispositivos")

    op.drop_index(op.f("ix_locais_id_ponto"), table_name="locais")
    op.drop_index(op.f("ix_locais_id_local"), table_name="locais")
    op.drop_table("locais")

    op.execute(sa.text("DROP TYPE IF EXISTS tipo_local CASCADE"))

    op.drop_index(op.f("ix_pontos_id_rua"), table_name="pontos")
    op.drop_index(op.f("ix_pontos_id_ponto"), table_name="pontos")
    op.drop_table("pontos")

    op.drop_index(op.f("ix_ruas_id_rua"), table_name="ruas")
    op.drop_index(op.f("ix_ruas_id_cidade"), table_name="ruas")
    op.drop_table("ruas")

    op.drop_index(op.f("ix_cidades_id_cidade"), table_name="cidades")
    op.drop_table("cidades")
