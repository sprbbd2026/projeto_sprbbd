from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.limiter import limiter
from app.schemas import RegisterRequest, RegisterResponse
from app.supabase_admin import get_supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cadastro"])


def _map_supabase_error(message: str) -> tuple[int, str]:
    m = message.lower()
    if "duplicate_email" in m or "duplicate_document" in m or "duplicate_key" in m:
        return 409, "Já existe um usuário com esse e-mail ou documento."
    if "e-mail inválido" in m or "email inválido" in m:
        return 422, "E-mail inválido."
    if "senha deve ter" in m:
        return 422, "A senha deve ter pelo menos 6 caracteres."
    if "nível de acesso inválido" in m:
        return 422, "Nível de acesso inválido."
    # RPC register_usuario: SELECT perfil WHERE prf_nome = 'Admin'|'Usuário'|'Gerente'
    if "perfil" in m and "não encontrado" in m:
        return (
            502,
            "No banco não existe a linha em public.perfil para este nível (Admin, Usuário ou Gerente). "
            "Rode o seed da US116 (INSERT em public.perfil) no SQL Editor do Supabase.",
        )
    if "não encontrado" in m or "not found" in m:
        return 502, "Configuração do banco incompleta (RPC ausente ou recurso não encontrado)."
    return 502, "Falha ao registrar usuário."


@router.post("/register", response_model=RegisterResponse, status_code=201)
@limiter.limit("30/minute")
async def register_user(request: Request, body: RegisterRequest) -> RegisterResponse:
    client = get_supabase_admin()
    logger.info("Registro solicitado: email=%s", body.email)

    try:
        resp = client.rpc(
            "register_usuario",
            {
                "p_nome": body.name,
                "p_email": str(body.email).lower(),
                "p_documento": body.document.strip(),
                "p_senha": body.password,
                "p_access_level": body.access_level,
            },
        ).execute()
    except Exception as exc:  # noqa: BLE001 — erros da lib postgrest variam
        code, detail = _map_supabase_error(str(exc))
        logger.warning("Falha no registro (email=%s): %s | erro original: %s", body.email, detail, exc)
        raise HTTPException(status_code=code, detail=detail) from exc

    if resp.data is None:
        logger.error("Resposta vazia do banco para email=%s", body.email)
        raise HTTPException(status_code=502, detail="Resposta vazia do banco.")

    try:
        result = RegisterResponse.model_validate(resp.data)
    except Exception as exc:  # noqa: BLE001
        logger.error("Formato inesperado do banco: %s", resp.data, exc_info=True)
        raise HTTPException(
            status_code=502,
            detail="Formato de resposta inesperado do banco.",
        ) from exc

    logger.info("Usuário registrado: usr_id=%s, email=%s", result.usr_id, body.email)
    return result
