import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  fullWidth,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const variantClass =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : styles.ghost

  return (
    <button
      type={type}
      className={`${styles.button} ${variantClass} ${fullWidth ? styles.fullWidth : ''} ${className}`.trim()}
      {...rest}
    />
  )
}
