import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
} from 'react'

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

    const fieldClass = [
      'flex min-h-[2.75rem] items-center gap-2 rounded-[0.625rem] border px-3 transition-[border-color,box-shadow]',
      error
        ? 'border-red-600 focus-within:border-red-600'
        : 'border-slate-200 focus-within:border-blue-600',
      disabled ? 'bg-slate-50 opacity-65' : 'bg-white',
    ].join(' ')

    return (
      <div className="flex w-full flex-col gap-1.5">
        <label
          className="text-[0.8125rem] font-semibold tracking-wide text-slate-900"
          htmlFor={id}
        >
          {label}
        </label>
        <div className={fieldClass}>
          {Icon ? (
            <Icon
              className="h-[1.125rem] w-[1.125rem] shrink-0 text-slate-500"
              aria-hidden
            />
          ) : null}
          <input
            ref={ref}
            id={id}
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[0.9375rem] text-slate-900 outline-none placeholder:text-slate-400"
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
              className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              tabIndex={-1}
              aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPw((v) => !v)}
              disabled={disabled}
            >
              {showPw ? (
                <EyeOff className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
              ) : (
                <Eye className="h-[1.125rem] w-[1.125rem]" strokeWidth={2} />
              )}
            </button>
          ) : null}
        </div>
        {hint && !error ? (
          <p id={`${id}-hint`} className="text-xs leading-snug text-slate-500">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${id}-err`} className="text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    )
  },
)
