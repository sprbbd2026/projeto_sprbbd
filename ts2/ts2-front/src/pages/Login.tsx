import {
  Calendar,
  CircleUser,
  IdCard,
  Loader2,
  Lock,
  Mail,
  Map,
  User,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { LoginMapShell } from '../components/auth/LoginMapShell'
import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AuthMode } from '../components/ui/AuthModeSwitch'
import { AuthModeSwitch } from '../components/ui/AuthModeSwitch'
import { Button } from '../components/ui/Button'
import { InputField } from '../components/ui/InputField'
import { useUsers } from '../hooks/useUsers'
import { loginRequest } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { useUserStore } from '../store/userStore'
import { getRequestErrorMessage } from '../utils/error'

type AuthMode = 'login' | 'register'

export default function Login() {
  const navigate = useNavigate()
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const { loading, createUser, clearError } = useUsers()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginLoading, setLoginLoading] = useState(false)
  const [finishingSignUp, setFinishingSignUp] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    clearError()
    setLoginLoading(true)
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '')
    const password = String(fd.get('password') ?? '')
    try {
      const data = await loginRequest(email, password)
      setAccessToken(data.access_token)
      navigate('/home', { replace: true })
    } catch (err) {
      setFormError(getRequestErrorMessage(err))
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    clearError()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '')
    const senha = String(fd.get('senha') ?? '')
    await createUser({
      nome: String(fd.get('nome') ?? ''),
      sobrenome: String(fd.get('sobrenome') ?? ''),
      email,
      senha,
      data_nascimento: String(fd.get('data_nascimento') ?? ''),
      documento: String(fd.get('documento') ?? ''),
    })
    const err = useUserStore.getState().error
    if (err) {
      setFormError(err)
      return
    }

    setFinishingSignUp(true)
    try {
      const data = await loginRequest(email, senha)
      setAccessToken(data.access_token)
      navigate('/home', { replace: true })
    } catch (loginErr) {
      setFormError(getRequestErrorMessage(loginErr))
      setMode('login')
    } finally {
      setFinishingSignUp(false)
    }
  }

  const storeError = useUserStore((s) => s.error)
  const displayError = formError ?? (mode === 'register' ? storeError : null)

  const spinIcon = 'mr-1.5 inline-block h-[1.125rem] w-[1.125rem] animate-spin align-[-0.2em]'

  return (
    <div className="h-dvh overflow-hidden [--btn-primary-bg:#2563eb] [--btn-primary-hover:#1d4ed8] [--ring:#2563eb]">
      <LoginMapShell>
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <div className="my-auto flex w-full flex-col items-stretch">
              <div className="flex w-full shrink-0 justify-center pb-5">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 text-[1.0625rem] font-extrabold tracking-tight text-slate-900 no-underline hover:text-slate-900"
                >
                  <span
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/90"
                    aria-hidden
                  >
                    <Map className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
                  </span>
                  SPRB-BD
                </Link>
              </div>

              <div
                key={mode}
                id="auth-panel"
                className="animate-[modeFade_0.32s_ease-out]"
              >
                <header className="mb-5 text-center">
                  <h1 className="font-display m-0 text-center text-[clamp(1.5rem,3.8vw,1.95rem)] font-semibold leading-snug tracking-[-0.03em] text-slate-900">
                    {mode === 'login' ? 'Olá, bem-vindo de volta' : 'Crie sua conta'}
                  </h1>
                </header>

                {mode === 'login' ? (
                  <form
                    className="mx-auto flex w-full max-w-104 flex-col gap-3.5"
                    onSubmit={handleLogin}
                    noValidate
                  >
                    <InputField
                      label="E-mail"
                      name="email"
                      type="email"
                      required
                      autoComplete="username"
                      placeholder="voce@exemplo.com"
                      inputIcon={Mail}
                    />
                    <InputField
                      label="Senha"
                      name="password"
                      type="password"
                      minLength={8}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      inputIcon={Lock}
                      hint="Mínimo de 8 caracteres."
                    />
                    <div className="-mt-0.5 flex flex-wrap items-center justify-start gap-3">
                      <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-500">
                        <input
                          type="checkbox"
                          name="remember"
                          className="h-4 w-4 cursor-pointer accent-blue-600"
                        />
                        Lembrar-me
                      </label>
                    </div>
                    {displayError ? (
                      <p
                        className="m-0 rounded-[0.625rem] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug text-red-800"
                        role="alert"
                      >
                        {displayError}
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <Button
                        type="submit"
                        fullWidth
                        disabled={loginLoading}
                        className="shadow-none!"
                      >
                        {loginLoading ? (
                          <>
                            <Loader2 className={spinIcon} aria-hidden />
                            Entrando…
                          </>
                        ) : (
                          'Entrar'
                        )}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form
                    className="mx-auto flex w-full max-w-104 flex-col gap-3.5"
                    onSubmit={handleRegister}
                  >
                    <InputField
                      label="Nome"
                      name="nome"
                      required
                      autoComplete="given-name"
                      placeholder="Nome"
                      inputIcon={User}
                    />
                    <InputField
                      label="Sobrenome"
                      name="sobrenome"
                      required
                      autoComplete="family-name"
                      placeholder="Sobrenome"
                      inputIcon={CircleUser}
                    />
                    <InputField
                      label="E-mail"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="voce@exemplo.com"
                      inputIcon={Mail}
                    />
                    <InputField
                      label="Senha"
                      name="senha"
                      type="password"
                      minLength={8}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                      inputIcon={Lock}
                      hint="Mínimo de 8 caracteres."
                    />
                    <InputField
                      label="Data de nascimento"
                      name="data_nascimento"
                      type="date"
                      required
                      inputIcon={Calendar}
                    />
                    <InputField
                      label="Documento"
                      name="documento"
                      required
                      placeholder="CPF ou documento único"
                      inputIcon={IdCard}
                    />
                    {displayError ? (
                      <p
                        className="m-0 rounded-[0.625rem] border border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug text-red-800"
                        role="alert"
                      >
                        {displayError}
                      </p>
                    ) : null}
                    <div className="pt-1">
                      <Button
                        type="submit"
                        fullWidth
                        disabled={loading || finishingSignUp}
                        className="shadow-none!"
                      >
                        {loading ? (
                          <>
                            <Loader2 className={spinIcon} aria-hidden />
                            Enviando…
                          </>
                        ) : finishingSignUp ? (
                          <>
                            <Loader2 className={spinIcon} aria-hidden />
                            Entrando…
                          </>
                        ) : (
                          'Cadastrar'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <p className="mt-[1.35rem] shrink-0 text-center text-[0.9375rem] text-slate-500">
                {mode === 'login' ? (
                  <>
                    Não tem uma conta?{' '}
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 font-bold text-blue-600 underline decoration-blue-600 underline-offset-2 hover:text-blue-700"
                      onClick={() => {
                        setMode('register')
                        setFormError(null)
                        clearError()
                      }}
                    >
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>
                    Já tem conta?{' '}
                    <button
                      type="button"
                      className="cursor-pointer border-0 bg-transparent p-0 font-bold text-blue-600 underline decoration-blue-600 underline-offset-2 hover:text-blue-700"
                      onClick={() => {
                        setMode('login')
                        setFormError(null)
                        clearError()
                      }}
                    >
                      Entrar
                    </button>
                  </>
                )}
              </p>
          </div>
        </div>
      </LoginMapShell>
    </div>
  )
}
