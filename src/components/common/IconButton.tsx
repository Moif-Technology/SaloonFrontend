import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'danger'
  /** Fixed pixel size (used when sizeClassName is not given). */
  size?: number
  /** Responsive Tailwind width/height classes, e.g. "w-8 h-8 lg:w-10 lg:h-10". Takes precedence over `size`. */
  sizeClassName?: string
}

export default function IconButton({
  children,
  variant = 'default',
  size = 40,
  sizeClassName,
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
        'inline-flex items-center justify-center rounded-full transition-colors shrink-0',
        'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent',
        variantClasses,
        sizeClassName ?? '',
        className,
      ].join(' ')}
      style={sizeClassName ? undefined : { width: size, height: size }}
      {...rest}
    >
      {children}
    </button>
  )
}
