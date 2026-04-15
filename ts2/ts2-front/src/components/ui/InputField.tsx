import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from 'react'
import styles from './InputField.module.css'

export type InputFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className'
> & {
  label: string
  hint?: string
  error?: string
  inputIcon?: LucideIcon
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  function InputField(
    {
      label,
      hint,
      error,
      inputIcon: Icon,
      id: idProp,
      type = 'text',
      disabled,
      ...rest
    },
    ref,
  ) {
    const genId = useId()
    const id = idProp ?? genId
    const [showPw, setShowPw] = useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPw ? 'text' : type

    return (
      <div className={styles.wrap}>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <div
          className={`${styles.field} ${error ? styles.fieldError : ''} ${disabled ? styles.fieldDisabled : ''}`}
        >
          {Icon ? <Icon className={styles.inputIcon} aria-hidden /> : null}
          <input
            ref={ref}
            id={id}
            className={styles.input}
            type={inputType}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              [hint ? `${id}-hint` : '', error ? `${id}-err` : '']
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...rest}
          />
          {isPassword ? (
            <button
              type="button"
              className={styles.togglePw}
              tabIndex={-1}
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPw((v) => !v)}
              disabled={disabled}
            >
              {showPw ? (
                <EyeOff className={styles.inputIcon} strokeWidth={2} />
              ) : (
                <Eye className={styles.inputIcon} strokeWidth={2} />
              )}
            </button>
          ) : null}
        </div>
        {hint && !error ? (
          <p id={`${id}-hint`} className={styles.hint}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-err`} className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
