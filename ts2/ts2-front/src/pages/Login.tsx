import {
  Calendar,
  CircleUser,
  IdCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Navigation,
  User,
} from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import type { AuthMode } from '../components/ui/AuthModeSwitch'
import { AuthModeSwitch } from '../components/ui/AuthModeSwitch'
import { Button } from '../components/ui/Button'
import { InputField } from '../components/ui/InputField'
import { UsersTable } from '../components/ui/UsersTable'
import { useUsers } from '../hooks/useUsers'
import { useUserStore } from '../store/userStore'
import styles from './Login.module.css'

export default function Login() {
  const { users, loading, error, fetchUsers, createUser, clearError } = useUsers()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loginHint, setLoginHint] = useState(false)

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoginHint(true)
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    await createUser({
      nome: String(fd.get('nome') ?? ''),
      sobrenome: String(fd.get('sobrenome') ?? ''),
      email: String(fd.get('email') ?? ''),
      senha: String(fd.get('senha') ?? ''),
      data_nascimento: String(fd.get('data_nascimento') ?? ''),
      documento: String(fd.get('documento') ?? ''),
      latitude: String(fd.get('latitude') ?? ''),
      longitude: String(fd.get('longitude') ?? ''),
    })
    const err = useUserStore.getState().error
    if (!err) e.currentTarget.reset()
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <p className={styles.kicker}>SPRB-BD</p>
          <h1 className={styles.title}>Acesso</h1>
          <p className={styles.subtitle}>
            {mode === 'login'
              ? 'Informe e-mail e senha. O envio via POST na API é apenas para cadastro de novos usuários.'
              : 'Preencha todos os campos para criar um novo usuário (POST /users).'}{' '}
            A lista de usuários ao lado é carregada automaticamente.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.card}>
            <div className={styles.switchWrap}>
              <AuthModeSwitch
                mode={mode}
                onChange={(next) => {
                  setMode(next)
                  setLoginHint(false)
                }}
              />
            </div>

            <div
              id="auth-panel"
              role="tabpanel"
              aria-labelledby={mode === 'login' ? 'tab-login' : 'tab-register'}
            >
              {mode === 'login' ? (
                <form className={styles.form} onSubmit={handleLogin}>
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
                    name="senha"
                    type="password"
                    minLength={8}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    inputIcon={Lock}
                    hint="Mínimo de 8 caracteres."
                  />
                  {loginHint ? (
                    <p className={styles.feedback}>
                      Nenhuma requisição POST é feita no login: o POST /users é usado
                      somente no cadastro. Quando a API tiver autenticação, o entrar será
                      integrado aqui.
                    </p>
                  ) : null}
                  <div className={styles.actions}>
                    <Button type="submit" fullWidth>
                      Entrar
                    </Button>
                  </div>
                </form>
              ) : (
                <form className={styles.form} onSubmit={handleRegister}>
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
                    placeholder="CPF ou documento"
                    inputIcon={IdCard}
                  />
                  <InputField
                    label="Latitude"
                    name="latitude"
                    required
                    inputMode="decimal"
                    placeholder="-23.5505"
                    inputIcon={MapPin}
                  />
                  <InputField
                    label="Longitude"
                    name="longitude"
                    required
                    inputMode="decimal"
                    placeholder="-46.6333"
                    inputIcon={Navigation}
                  />
                  <div className={styles.actions}>
                    <Button type="submit" fullWidth disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className={styles.inlineIcon} aria-hidden />
                          Enviando…
                        </>
                      ) : (
                        'Enviar cadastro'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <UsersTable
            users={users}
            loading={loading}
            error={error}
            onRefresh={() => void fetchUsers()}
            onClearError={clearError}
          />
        </div>
      </div>
    </main>
  )
}
