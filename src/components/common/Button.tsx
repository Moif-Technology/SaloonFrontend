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
    'bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_18px_rgba(121,7,40,0.35)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_8px_22px_rgba(121,7,40,0.45)] hover:brightness-110 active:brightness-95 disabled:bg-salon-muted/40 disabled:from-salon-muted/40 disabled:to-salon-muted/40 disabled:shadow-none',
  secondary:
    'bg-white/40 backdrop-blur-md text-salon-text border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:bg-white/60 hover:border-salon-primary/30 active:bg-white/70',
  outline:
    'bg-white/20 backdrop-blur-md text-salon-primary border-2 border-salon-primary/60 hover:bg-salon-primary-light/50',
  ghost: 'bg-transparent text-salon-text hover:bg-white/30',
  danger: 'bg-salon-danger text-white hover:opacity-90',
}

const sizeClasses: Record<ButtonSize, string> = {
  primary: 'h-14 sm:h-16 lg:h-[72px] text-lg sm:text-xl lg:text-2xl font-bold px-3 sm:px-4 lg:px-6 rounded-xl gap-1.5 sm:gap-2 lg:gap-3',
  secondary: 'h-11 sm:h-12 lg:h-16 text-sm sm:text-base lg:text-xl font-semibold px-2 sm:px-3 lg:px-4 rounded-lg lg:rounded-xl gap-1 sm:gap-1.5 lg:gap-2',
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
        'inline-flex items-center justify-center transition-all duration-200 select-none',
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
