import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'primary' | 'secondary' | 'compact'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  fullWidth?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-salon-primary text-white hover:bg-salon-primary-dark active:bg-salon-primary-dark disabled:bg-salon-muted/40',
  secondary:
    'bg-white text-salon-text border-2 border-salon-border hover:border-salon-primary/50 hover:bg-salon-primary-light/40',
  outline:
    'bg-transparent text-salon-primary border-2 border-salon-primary hover:bg-salon-primary-light',
  ghost: 'bg-transparent text-salon-text hover:bg-black/5',
  danger: 'bg-salon-danger text-white hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  primary: 'h-[72px] text-2xl font-bold px-6 rounded-xl gap-3',
  secondary: 'h-16 text-xl font-semibold px-4 rounded-xl gap-2',
  compact: 'h-11 text-base font-semibold px-3 rounded-lg gap-2',
}

export default function Button({
  variant = 'secondary',
  size = 'secondary',
  icon,
  fullWidth,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center transition-colors select-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
