-- Revoga execução pública da RPC register_usuario (cadastro só via BFF com service_role).
--
-- STATUS (TS#01): este script JÁ FOI APLICADO no projeto Supabase do time após validar o BFF.
-- Mantém-se no Git como histórico e para novos ambientes.
--
-- ORDEM RECOMENDADA EM PRODUÇÃO:
--   1) Subir o BFF (ts1/ts1-back) com SUPABASE_SERVICE_ROLE_KEY e testar POST /api/v1/register.
--   2) Atualizar o front com VITE_API_BASE_URL apontando para o BFF.
--   3) Só então executar este script no SQL Editor do Supabase.
--
-- Em desenvolvimento local, se rodar este script antes do BFF, o cadastro na UI quebra
-- até o backend estar no ar.

REVOKE EXECUTE ON FUNCTION public.register_usuario(text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_usuario(text, text, text, text, text) FROM authenticated;

-- Garante que a service role do projeto continue podendo invocar a função via PostgREST.
GRANT EXECUTE ON FUNCTION public.register_usuario(text, text, text, text, text) TO service_role;

-- Validação com curl (chave anon): ver US116 — secção «Confirmar que a RPC não aceita mais a chave anon».
