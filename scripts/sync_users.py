"""
Sincroniza os dois usuários entre TS1 (operador) e TS2 (USUARIO):
mesmo e-mail, mesma senha e nomes alinhados.

Uso (na pasta ts2-back):
  uv run python ../scripts/sync_users.py
"""
from __future__ import annotations

import base64
import hashlib
import os
import sys

import bcrypt
from sqlalchemy import create_engine, text

DEFAULT_PASSWORD = os.getenv("SPRB_SYNC_PASSWORD", "Sprb@2026")

TS1_DATABASE_URL = os.getenv(
    "TS1_DATABASE_URL",
    "postgresql+psycopg://admin:sprb_ts1_local@localhost:5432/sprbbd-db",
)
TS2_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg://admin:sprb_ts2_local@localhost:5433/sprbbd-db",
)

USERS = [
    {
        "email": "wagnermotawmmm@fab.mil.br",
        "nome": "Wagner",
        "sobrenome": "Mota",
        "nome_completo": "Wagner Mota",
        "documento": "707034",
    },
    {
        "email": "the.wagner.mota@gmail.com",
        "nome": "Wagner",
        "sobrenome": "Mota",
        "nome_completo": "Wagner Mota",
        "documento": "11111111111",
    },
]


def ts1_hash_password(password: str) -> str:
    digest = hashlib.sha256(password.encode("utf-8")).digest()
    prepared = base64.b64encode(digest)
    return bcrypt.hashpw(prepared, bcrypt.gensalt()).decode("utf-8")


def ts2_hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def sync_ts1(engine, password: str) -> None:
    ts1_hash = ts1_hash_password(password)
    with engine.begin() as conn:
        for user in USERS:
            result = conn.execute(
                text(
                    """
                    UPDATE operador
                    SET opr_nome = :nome,
                        opr_senha_hash = :senha,
                        opr_status = 'ativo'
                    WHERE lower(opr_email) = lower(:email)
                    """
                ),
                {
                    "nome": user["nome_completo"],
                    "senha": ts1_hash,
                    "email": user["email"],
                },
            )
            if result.rowcount == 0:
                conn.execute(
                    text(
                        """
                        INSERT INTO operador (opr_nome, opr_email, opr_senha_hash, opr_funcao, opr_status)
                        VALUES (:nome, :email, :senha, 'operador', 'ativo')
                        """
                    ),
                    {
                        "nome": user["nome_completo"],
                        "email": user["email"],
                        "senha": ts1_hash,
                    },
                )


def sync_ts2(engine, password: str) -> None:
    ts2_hash = ts2_hash_password(password)
    with engine.begin() as conn:
        for user in USERS:
            result = conn.execute(
                text(
                    """
                    UPDATE "USUARIO"
                    SET usu_nome = :nome,
                        usu_sobrenome = :sobrenome,
                        usu_senha = :senha,
                        usu_documento = :documento
                    WHERE lower(usu_email) = lower(:email)
                    """
                ),
                {
                    "nome": user["nome"],
                    "sobrenome": user["sobrenome"],
                    "senha": ts2_hash,
                    "documento": user["documento"],
                    "email": user["email"],
                },
            )
            if result.rowcount == 0:
                import uuid
                from datetime import date

                conn.execute(
                    text(
                        """
                        INSERT INTO "USUARIO" (
                            usu_uuid, usu_nome, usu_sobrenome, usu_dt_nascimento,
                            usu_email, usu_senha, usu_documento
                        )
                        VALUES (
                            :uuid, :nome, :sobrenome, :nascimento,
                            :email, :senha, :documento
                        )
                        """
                    ),
                    {
                        "uuid": str(uuid.uuid4()),
                        "nome": user["nome"],
                        "sobrenome": user["sobrenome"],
                        "nascimento": date(1990, 1, 1),
                        "email": user["email"],
                        "senha": ts2_hash,
                        "documento": user["documento"],
                    },
                )


def main() -> int:
    password = DEFAULT_PASSWORD
    print(f"Sincronizando usuários com senha padrão: {password}")

    ts1_engine = create_engine(TS1_DATABASE_URL, pool_pre_ping=True)
    ts2_engine = create_engine(TS2_DATABASE_URL, pool_pre_ping=True)

    sync_ts1(ts1_engine, password)
    sync_ts2(ts2_engine, password)

    print("Concluído. Usuários alinhados:")
    for user in USERS:
        print(f"  - {user['email']} / {user['nome_completo']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
