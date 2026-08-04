import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'danger'
  size?: number
}

export default function IconButton({
  children,
  variant = 'default',
  size = 40,
  className = '',
  ...rest
}: IconButtonProps) {
  const variantClasses =
    variant === 'danger'
      ? 'text-salon-danger hover:bg-salon-danger/10'
      : 'text-salon-muted hover:bg-black/5'

  return (
    <button
      className={[
        'inline-flex items-center justify-center rounded-full transition-colors',
        variantClasses,
        className,
      ].join(' ')}
      style={{ width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  )
}
