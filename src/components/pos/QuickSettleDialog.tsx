import { useEffect, useState } from 'react'
import { X, Banknote, CreditCard, CircleCheck, Loader2 } from 'lucide-react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/format'

export type QuickSettleMethod = 'Cash' | 'Card'

export interface QuickSettleDialogProps {
  open: boolean
  amount: number
  busy?: boolean
  onClose: () => void
  /** Settles without printing — parent owns API + bill clear */
  onSettle: (method: QuickSettleMethod) => void | Promise<void>
}

export default function QuickSettleDialog({
  open,
  amount,
  busy = false,
  onClose,
  onSettle,
}: QuickSettleDialogProps) {
  const [method, setMethod] = useState<QuickSettleMethod | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setMethod(null)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, busy])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  async function handleSettle() {
    if (busy) return
    if (!method) {
      setError('Select Cash or Card to continue')
      return
    }
    if (amount <= 0) {
      setError('Add items to the bill before settling')
      return
    }
    setError(null)
    try {
      await onSettle(method)
    } catch {
      setError('Settlement failed — try again')
    }
  }

  function handleClose() {
    if (busy) return
    onClose()
  }

  const methods: {
    id: QuickSettleMethod
    label: string
    icon: typeof Banknote
    hint: string
  }[] = [
    { id: 'Cash', label: 'Cash', icon: Banknote, hint: 'Collect cash' },
    { id: 'Card', label: 'Card', icon: CreditCard, hint: 'Card / terminal' },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-settle-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div className="flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_32px_rgba(31,17,20,0.18)] backdrop-blur-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 id="quick-settle-title" className="text-xl font-bold text-salon-text">
              Save Bill
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Select payment method, then settle
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5 disabled:opacity-40"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="rounded-2xl bg-salon-primary-light/70 px-4 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Amount to collect
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-salon-primary">
              {formatCurrency(amount)}
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Payment method <span className="text-salon-danger">*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {methods.map(({ id, label, icon: Icon, hint }) => {
                const selected = method === id
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMethod(id)
                      setError(null)
                    }}
                    className={[
                      'flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-4',
                      'touch-manipulation transition-colors active:scale-[0.98] disabled:opacity-50',
                      selected
                        ? 'border-salon-primary bg-salon-primary text-white shadow-sm'
                        : 'border-salon-border bg-white text-salon-text hover:border-salon-primary/40 hover:bg-salon-primary-light/40',
                    ].join(' ')}
                    aria-pressed={selected}
                  >
                    <span
                      className={[
                        'flex h-12 w-12 items-center justify-center rounded-xl',
                        selected ? 'bg-white/15' : 'bg-salon-bg text-salon-primary',
                      ].join(' ')}
                    >
                      <Icon size={26} strokeWidth={2.25} />
                    </span>
                    <span className="text-lg font-bold">{label}</span>
                    <span
                      className={[
                        'text-xs font-medium',
                        selected ? 'text-white/80' : 'text-salon-muted',
                      ].join(' ')}
                    >
                      {hint}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {error ? (
            <p className="text-sm font-medium text-salon-danger" role="alert">
              {error}
            </p>
          ) : (
            <p className="text-sm text-salon-muted">No receipt print on this settle.</p>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-salon-border p-4 sm:flex-row sm:gap-3 sm:p-5">
          <Button
            type="button"
            variant="secondary"
            size="secondary"
            onClick={handleClose}
            disabled={busy}
            className="min-h-[56px] w-full sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="secondary"
            disabled={!method || busy || amount <= 0}
            onClick={() => void handleSettle()}
            icon={
              busy ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <CircleCheck size={22} />
              )
            }
            className="min-h-[56px] w-full sm:flex-[1.4]"
          >
            {busy ? 'Settling…' : 'Settle'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
