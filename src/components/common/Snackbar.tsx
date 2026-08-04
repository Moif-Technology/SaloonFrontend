import { CheckCircle2, AlertTriangle, Info, Loader2, Sparkles, type LucideIcon } from 'lucide-react'

export type SnackbarVariant = 'loading' | 'success' | 'error' | 'info' | 'warning'

export interface SnackbarAction {
  label: string
  onClick: () => void
}

interface SnackbarProps {
  variant: SnackbarVariant
  message: string
  action?: SnackbarAction
}

const iconByVariant: Record<SnackbarVariant, LucideIcon> = {
  loading: Sparkles,
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
}

const stylesByVariant: Record<
  SnackbarVariant,
  { card: string; badge: string; action: string }
> = {
  loading: {
    card: 'bg-violet-50/70',
    badge: 'bg-violet-500',
    action: 'text-violet-500',
  },
  success: {
    card: 'bg-emerald-50/70',
    badge: 'bg-emerald-500',
    action: 'text-emerald-600',
  },
  error: {
    card: 'bg-red-50/70',
    badge: 'bg-red-500',
    action: 'text-red-500',
  },
  warning: {
    card: 'bg-amber-50/70',
    badge: 'bg-amber-500',
    action: 'text-amber-600',
  },
  info: {
    card: 'bg-slate-100/70',
    badge: 'bg-slate-500',
    action: 'text-slate-600',
  },
}

export default function Snackbar({ variant, message, action }: SnackbarProps) {
  const Icon = iconByVariant[variant]
  const styles = stylesByVariant[variant]

  return (
    <div
      className={[
        'flex items-center gap-3 rounded-2xl px-4 py-3 min-w-[320px] max-w-[560px] backdrop-blur-xl border border-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_24px_rgba(31,17,20,0.12)]',
        styles.card,
      ].join(' ')}
    >
      <span
        className={[
          'flex items-center justify-center w-8 h-8 rounded-full text-white shrink-0',
          styles.badge,
        ].join(' ')}
      >
        <Icon size={17} />
      </span>

      <span className="text-base font-medium text-salon-text flex-1">{message}</span>

      {variant === 'loading' ? (
        <Loader2 size={20} className="text-salon-muted animate-spin shrink-0" />
      ) : action ? (
        <button
          onClick={action.onClick}
          className={['text-sm font-semibold shrink-0 hover:underline', styles.action].join(' ')}
        >
          {action.label}
        </button>
      ) : null}
    </div>
  )
}
