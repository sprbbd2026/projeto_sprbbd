import { LogIn, UserPlus } from 'lucide-react'

export type AuthMode = 'login' | 'register'

type Props = {
  mode: AuthMode
  onChange: (mode: AuthMode) => void
  /** Destaque azul na aba ativa (ex.: tela de login). */
  variant?: 'default' | 'blue'
}

const tabBase =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.625rem] border-0 px-4 py-2 text-sm font-semibold transition-colors'

function activeClass(isActive: boolean, variant: 'default' | 'blue') {
  if (!isActive) {
    return 'bg-transparent text-slate-500 hover:text-slate-900'
  }
  if (variant === 'blue') {
    return 'bg-blue-50 text-blue-700 shadow-[0_1px_3px_rgb(37_99_235/0.12)]'
  }
  return 'bg-white text-slate-900 shadow-[0_1px_3px_rgb(0_0_0/0.08)]'
}

export function AuthModeSwitch({ mode, onChange, variant = 'default' }: Props) {
  return (
    <div
      className="inline-flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1"
      role="tablist"
      aria-label="Modo: entrar ou cadastrar"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        id="tab-login"
        aria-controls="auth-panel"
        className={`${tabBase} ${activeClass(mode === 'login', variant)}`}
        onClick={() => onChange('login')}
      >
        <LogIn className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
        Entrar
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        id="tab-register"
        aria-controls="auth-panel"
        className={`${tabBase} ${activeClass(mode === 'register', variant)}`}
        onClick={() => onChange('register')}
      >
        <UserPlus className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
        Cadastrar
      </button>
    </div>
  )
}
