import { useEffect, useMemo, useState } from 'react'
import { X, Banknote, Loader2, Printer } from 'lucide-react'
import Button from '../common/Button'
import NumericKeypad from '../common/NumericKeypad'
import {
  applyNumericKey,
  parseNumericString,
  type NumericKey,
} from '../../utils/numericInput'
import { formatCurrency } from '../../utils/format'
import { buildCashDenominations } from '../../utils/cashDenominations'
import type { CashPaymentResult } from '../../types/payment'

export interface QuickCashPaymentModalProps {
  open: boolean
  onClose: () => void
  /** Grand total (post discount + VAT) in ₹ */
  amount: number
  /** Settle + print; parent owns API + bill clear */
  onComplete: (result: CashPaymentResult) => void | Promise<void>
}

function valueToDraft(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const rounded = Math.round(value * 100) / 100
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

export default function QuickCashPaymentModal({
  open,
  onClose,
  amount,
  onComplete,
}: QuickCashPaymentModalProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Reset when opened / amount changes
  useEffect(() => {
    if (!open) return
    setDraft(valueToDraft(amount))
    setError(null)
    setSubmitting(false)
  }, [open, amount])

  // Escape closes (blocked while submitting)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, submitting])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const cashTendered = parseNumericString(draft)
  const change = Math.max(0, Math.round((cashTendered - amount) * 100) / 100)
  const isValid = cashTendered >= amount && amount > 0

  const denominations = useMemo(
    () => buildCashDenominations(amount),
    [amount],
  )

  function handleKey(key: NumericKey) {
    if (submitting) return
    setDraft((prev) =>
      applyNumericKey(prev, key, {
        allowDecimal: true,
        maxDecimalPlaces: 2,
        allowLeadingZeros: false,
        maxLength: 10,
      }),
    )
    setError(null)
  }

  function handlePreset(value: number) {
    if (submitting) return
    setDraft(valueToDraft(value))
    setError(null)
  }

  async function handleComplete() {
    if (submitting) return
    if (amount <= 0) {
      setError('Add items to the bill before taking cash')
      return
    }
    if (cashTendered < amount) {
      setError(`Cash tendered must be at least ₹${formatCurrency(amount)}`)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onComplete({
        method: 'cash',
        amountDue: amount,
        cashTendered,
        change,
      })
      // Parent closes modal on success
    } catch {
      setError('Payment failed — try again')
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    onClose()
  }

  if (!open) return null

  const shortfall = amount > cashTendered ? amount - cashTendered : 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 sm:items-center sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-cash-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
    >
      <div
        className={[
          'flex w-full flex-col overflow-hidden border-salon-border bg-white shadow-xl',
          'h-[100dvh] max-h-[100dvh] rounded-none border-0',
          'sm:h-auto sm:max-h-[min(720px,92dvh)] sm:rounded-2xl sm:border',
          'sm:w-[min(100%,920px)]',
          'pb-[env(safe-area-inset-bottom,0px)]',
        ].join(' ')}
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-3 py-3 xs:px-4 sm:gap-3 sm:px-5 sm:py-4">
  <div className="min-w-0 flex-1">
    <h2
      id="quick-cash-title"
      className="truncate text-lg font-bold text-salon-text xs:text-xl"
    >
      Quick Cash Payment
    </h2>
    <p className="mt-0.5 truncate text-xs font-medium text-salon-muted sm:text-sm">
      Grand Total:{' '}
      <span className="font-bold tabular-nums text-salon-primary">
        ₹{formatCurrency(amount)}
      </span>
    </p>
  </div>
  <button
    type="button"
    onClick={handleClose}
    disabled={submitting}
    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f] disabled:opacity-40 sm:h-11 sm:w-11"
    aria-label="Close"
  >
    <X size={22} />
  </button>
</header>

        {/* Body: left form + right keypad */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* LEFT — chips, input, change */}
          <div
            className={[
              'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain',
              'p-3 xs:p-4 sm:gap-4 sm:p-5',
              'md:w-[48%] md:border-r md:border-salon-border',
            ].join(' ')}
          >
            {/* Amount due highlight */}
            <div className="rounded-2xl bg-salon-primary-light/70 px-4 py-4 text-center sm:py-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
                Amount to collect
              </p>
              <p className="mt-1 text-3xl font-bold tabular-nums text-salon-primary sm:text-4xl">
                ₹{formatCurrency(amount)}
              </p>
            </div>

            {/* Quick denominations */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-salon-muted sm:mb-2 sm:text-xs">
                Quick cash
              </p>
              <div className="grid grid-cols-2 gap-1.5 xs:gap-2 sm:grid-cols-3">
                {denominations.map((v) => {
                  const selected =
                    draft !== '' &&
                    Math.round(cashTendered * 100) === Math.round(v * 100)
                  const isExact =
                    Math.round(v * 100) === Math.round(amount * 100)
                  return (
                    <button
                      key={v}
                      type="button"
                      disabled={submitting}
                      onClick={() => handlePreset(v)}
                      className={[
                        'min-h-11 touch-manipulation rounded-xl border-2 text-sm font-bold tabular-nums transition-colors',
                        'xs:min-h-12 xs:text-base sm:min-h-14 sm:text-lg',
                        'active:scale-[0.97] disabled:opacity-50',
                        selected
                          ? 'border-salon-primary bg-salon-primary text-white'
                          : 'border-salon-border bg-white text-salon-text hover:border-salon-primary/40 hover:bg-salon-primary-light/40',
                      ].join(' ')}
                    >
                      {isExact ? (
                        <span className="flex flex-col items-center leading-tight">
                          <span className="text-[10px] font-semibold uppercase opacity-80 sm:text-xs">
                            Exact
                          </span>
                          <span>₹{formatCurrency(v)}</span>
                        </span>
                      ) : (
                        <>₹{formatCurrency(v)}</>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom tendered (keypad-driven) */}
            <label className="block">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-salon-text sm:text-sm">
                <Banknote size={16} className="shrink-0 text-salon-primary" />
                Cash tendered
              </span>
              <div className="relative mt-1 sm:mt-1.5">
                <input
                  readOnly
                  inputMode="none"
                  autoComplete="off"
                  tabIndex={0}
                  value={draft}
                  placeholder="0"
                  className={[
                    'w-full rounded-xl border-2 border-salon-primary bg-salon-primary-light/30',
                    'py-2.5 pl-3 pr-10 text-2xl font-bold tabular-nums text-salon-text outline-none',
                    'placeholder:text-salon-muted/50',
                    'xs:py-3 xs:pl-4 xs:pr-12 xs:text-3xl',
                  ].join(' ')}
                  aria-label="Cash tendered amount"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-lg font-bold text-salon-muted xs:right-4 xs:text-xl"
                  aria-hidden
                >
                  ₹
                </span>
              </div>
              {error ? (
                <p
                  className="mt-1 text-xs font-medium text-salon-danger sm:mt-1.5 sm:text-sm"
                  role="alert"
                >
                  {error}
                </p>
              ) : (
                <p className="mt-1 h-4 text-xs sm:mt-1.5 sm:h-5 sm:text-sm" aria-hidden />
              )}
            </label>

            {/* Change summary */}
            <section
              aria-live="polite"
              aria-label="Change to return"
              className={[
                'rounded-2xl border-2 px-4 py-4 text-center sm:py-5',
                isValid
                  ? 'border-salon-success/40 bg-salon-success/10'
                  : 'border-salon-border bg-salon-bg',
              ].join(' ')}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
                Change to return
              </p>
              <p
                className={[
                  'mt-1 text-3xl font-bold tabular-nums sm:text-4xl',
                  isValid ? 'text-salon-success' : 'text-salon-muted',
                ].join(' ')}
              >
                {isValid ? `₹${formatCurrency(change)}` : '—'}
              </p>
              <p className="mt-1.5 text-sm font-medium text-salon-muted">
                {isValid
                  ? `Tendered ₹${formatCurrency(cashTendered)}`
                  : shortfall > 0 && draft
                    ? `Short by ₹${formatCurrency(shortfall)}`
                    : 'Enter cash received'}
              </p>
            </section>
          </div>

          {/* RIGHT — numeric keypad */}
          <div
            className={[
              'flex shrink-0 flex-col bg-salon-bg',
              'h-[min(38dvh,260px)] p-2 xs:h-[min(40dvh,280px)] xs:p-3 sm:h-[min(42dvh,300px)] sm:p-4',
              'max-md:border-t max-md:border-salon-border',
              'md:h-auto md:min-h-0 md:w-[52%] md:flex-1 md:border-t-0',
            ].join(' ')}
          >
            <NumericKeypad
              onKey={handleKey}
              onDone={() => {
                if (isValid) void handleComplete()
              }}
              allowDecimal
              doneLabel="OK"
              disabled={submitting}
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        {/* Footer */}
        <footer
          className={[
            'flex shrink-0 flex-col gap-2 border-t border-salon-border bg-white',
            'p-2.5 xs:p-3 sm:flex-row sm:gap-3 sm:p-4',
          ].join(' ')}
        >
          <Button
            type="button"
            variant="secondary"
            size="secondary"
            onClick={handleClose}
            disabled={submitting}
            className="min-h-12 w-full flex-1 sm:min-h-14 md:min-h-16"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="secondary"
            onClick={() => void handleComplete()}
            disabled={!isValid || submitting}
            icon={
              submitting ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <Printer size={22} />
              )
            }
            className="min-h-12 w-full flex-[1.4] sm:min-h-14 md:min-h-16"
          >
            <span className="sm:hidden">
              {submitting ? 'Processing…' : 'Pay & Print'}
            </span>
            <span className="hidden sm:inline">
              {submitting ? 'Processing…' : 'Complete Payment & Print'}
            </span>
          </Button>
        </footer>
      </div>
    </div>
  )
}