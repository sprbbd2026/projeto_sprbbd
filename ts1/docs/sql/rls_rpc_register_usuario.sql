-- US116 endurecimento: RLS em perfil/usuario + cadastro apenas via RPC.
-- Aplicar no Supabase: SQL Editor (Run) ou supabase db push quando a CLI estiver linkada.
-- O MCP user-supabase-projeto pode estar em read-only; neste caso rode este arquivo manualmente.
-- public.perfil.prf_nome deve alinhar com accessLevel do front: admin, user, manager (comparação em lower()).

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.register_usuario(
  p_nome text,
  p_email text,
  p_documento text,
  p_senha text,
  p_access_level text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_nome text := trim(p_nome);
  v_email text := lower(trim(p_email));
  v_doc text := trim(p_documento);
  -- Mesmos literais que o front (RegisterUserInput.accessLevel) e o seed em public.perfil.
  v_level text := lower(trim(p_access_level));
  v_prf_id int;
  v_hash text;
  v_usr_id int;
  r jsonb;
BEGIN
  IF coalesce(v_nome, '') = '' THEN
    RAISE EXCEPTION 'Nome é obrigatório';
  END IF;
  IF coalesce(v_email, '') = '' OR v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN
    RAISE EXCEPTION 'E-mail inválido';
  END IF;
  IF coalesce(v_doc, '') = '' THEN
    RAISE EXCEPTION 'Documento é obrigatório';
  END IF;
  IF p_senha IS NULL OR length(p_senha) < 6 THEN
    RAISE EXCEPTION 'Senha deve ter pelo menos 6 caracteres';
  END IF;

  IF v_level NOT IN ('admin', 'user', 'manager') THEN
    RAISE EXCEPTION 'Nível de acesso inválido';
  END IF;

  SELECT prf_id INTO v_prf_id
  FROM public.perfil
  WHERE lower(trim(prf_nome)) = v_level
  LIMIT 1;
  IF v_prf_id IS NULL THEN
    RAISE EXCEPTION 'Perfil % não encontrado', v_level;
  END IF;

  IF EXISTS (SELECT 1 FROM public.usuario WHERE lower(usr_email) = v_email) THEN
    RAISE EXCEPTION 'DUPLICATE_EMAIL';
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuario WHERE usr_login = v_doc) THEN
    RAISE EXCEPTION 'DUPLICATE_DOCUMENT';
  END IF;

  v_hash := crypt(p_senha, gen_salt('bf'));

  INSERT INTO public.usuario (prf_id, usr_nome, usr_email, usr_login, usr_senha_hash, usr_status)
  VALUES (v_prf_id, v_nome, v_email, v_doc, v_hash, 'ATIVO')
  RETURNING usr_id INTO v_usr_id;

  SELECT jsonb_build_object(
    'usr_id', u.usr_id,
    'prf_id', u.prf_id,
    'usr_nome', u.usr_nome,
    'usr_email', u.usr_email,
    'usr_login', u.usr_login,
    'usr_status', u.usr_status,
    'perfil', jsonb_build_object(
      'prf_id', p.prf_id,
      'prf_nome', p.prf_nome,
      'prf_nivel_acesso', p.prf_nivel_acesso,
      'prf_descricao', p.prf_descricao,
      'prf_status', p.prf_status
    )
  )
  INTO r
  FROM public.usuario u
  JOIN public.perfil p ON p.prf_id = u.prf_id
  WHERE u.usr_id = v_usr_id;

  RETURN r;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'DUPLICATE_KEY';
END;
$$;

REVOKE ALL ON FUNCTION public.register_usuario(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_usuario(text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.register_usuario(text, text, text, text, text) TO authenticated;

ALTER TABLE public.perfil ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfil_select_ativo_anon_auth" ON public.perfil;
CREATE POLICY "perfil_select_ativo_anon_auth"
  ON public.perfil
  FOR SELECT
  TO anon, authenticated
  USING (coalesce(prf_status, '') = 'ATIVO');

-- Próximo passo (produção): com o BFF ativo, rode também
-- docs/sql/revoke_anon_execute_register_usuario.sql para impedir EXECUTE da RPC pelo anon.
