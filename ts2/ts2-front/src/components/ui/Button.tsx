import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[0.625rem] border px-[1.125rem] py-2.5 text-[0.9375rem] font-semibold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-[0.55]'

const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-blue-600 text-white shadow-[0_1px_2px_rgb(0_0_0/0.06)] hover:bg-blue-700',
  secondary:
    'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100',
  ghost:
    'border-transparent bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-900',
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}
      {...rest}
    />
  )
}
