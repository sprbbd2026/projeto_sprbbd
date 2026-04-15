import { LogIn, UserPlus } from 'lucide-react'
import styles from './AuthModeSwitch.module.css'

export type AuthMode = 'login' | 'register'

type Props = {
  mode: AuthMode
  onChange: (mode: AuthMode) => void
}

export function AuthModeSwitch({ mode, onChange }: Props) {
  return (
    <div
      className={styles.group}
      role="tablist"
      aria-label="Modo: entrar ou cadastrar"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'login'}
        id="tab-login"
        aria-controls="auth-panel"
        className={`${styles.tab} ${mode === 'login' ? styles.active : ''}`}
        onClick={() => onChange('login')}
      >
        <LogIn className={styles.icon} aria-hidden />
        Entrar
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'register'}
        id="tab-register"
        aria-controls="auth-panel"
        className={`${styles.tab} ${mode === 'register' ? styles.active : ''}`}
        onClick={() => onChange('register')}
      >
        <UserPlus className={styles.icon} aria-hidden />
        Cadastrar
      </button>
    </div>
  )
}
