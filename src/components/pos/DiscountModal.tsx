import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { X, Percent, Banknote, Tag } from 'lucide-react'
import Button from '../common/Button'
import NumericKeypad from '../common/NumericKeypad'
import {
  applyNumericKey,
  parseNumericString,
  type NumericKey,
} from '../../utils/numericInput'
import { formatCurrency } from '../../utils/format'
import {
  type AppliedDiscount,
  type DiscountMode,
  PERCENT_PRESETS,
  FLAT_PRESETS,
  PROMO_CATALOGUE,
  computeDiscountAmount,
} from '../../types/discount'

export interface DiscountModalProps {
  open: boolean
  onClose: () => void
  subtotal: number
  /** Currently applied discount (null = none) */
  current: AppliedDiscount | null
  onApply: (discount: AppliedDiscount) => void
  onRemove: () => void
  onPromoFeedback?: (message: string, kind: 'success' | 'error' | 'info') => void
}

function valueToDraft(value: number | undefined): string {
  if (value == null || value <= 0) return ''
  // Drop trailing zeros for cleaner keypad start (10 not 10.00)
  if (Number.isInteger(value)) return String(value)
  return String(Math.round(value * 100) / 100)
}

export default function DiscountModal({
  open,
  onClose,
  subtotal,
  current,
  onApply,
  onRemove,
  onPromoFeedback,
}: DiscountModalProps) {
  const [mode, setMode] = useState<DiscountMode>('percentage')
  const [draft, setDraft] = useState('')
  const [promo, setPromo] = useState('')
  const [promoError, setPromoError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Seed draft from current applied discount; discard on close via parent
  useEffect(() => {
    if (!open) return
    setMode(current?.mode ?? 'percentage')
    setDraft(valueToDraft(current?.value))
    setPromo(current?.promoCode ?? '')
    setPromoError(null)
    setError(null)
  }, [open, current])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const allowDecimal = mode === 'flat'

  const numericValue = parseNumericString(draft)

  const previewAmount = useMemo(() => {
    if (numericValue <= 0) return 0
    return computeDiscountAmount(subtotal, { mode, value: numericValue })
  }, [mode, numericValue, subtotal])

  function handleModeChange(next: DiscountMode) {
    if (next === mode) return
    setMode(next)
    setDraft('')
    setError(null)
  }

  function handlePreset(value: number) {
    setDraft(String(value))
    setError(null)
  }

  function handleKey(key: NumericKey) {
    setDraft((prev) =>
      applyNumericKey(prev, key, {
        allowDecimal,
        maxDecimalPlaces: 2,
        allowLeadingZeros: false,
        maxLength: mode === 'percentage' ? 5 : 10,
      }),
    )
    setError(null)
  }

  function validate(): string | null {
    if (!draft || numericValue <= 0) {
      return 'Enter a discount greater than zero'
    }
    if (mode === 'percentage' && numericValue > 100) {
      return 'Percentage cannot exceed 100%'
    }
    if (mode === 'flat' && numericValue > subtotal && subtotal > 0) {
      return 'Flat discount cannot exceed bill subtotal'
    }
    if (subtotal <= 0) {
      return 'Add items to the bill before applying a discount'
    }
    return null
  }

  function handleApply() {
    const err = validate()
    if (err) {
      setError(err)
      return
    }
    onApply({
      mode,
      value: numericValue,
      promoCode: promo.trim() || undefined,
    })
  }

  function handleApplyPromo() {
    const code = promo.trim().toUpperCase()
    if (!code) {
      setPromoError('Enter a promo code')
      return
    }
    const match = PROMO_CATALOGUE[code]
    if (!match) {
      setPromoError('Invalid or expired promo code')
      onPromoFeedback?.('Invalid promo code', 'error')
      return
    }
    setPromo(code)
    setMode(match.mode)
    setDraft(String(match.value))
    setPromoError(null)
    setError(null)
    onPromoFeedback?.(`Promo applied: ${match.label}`, 'success')
  }

  function handleRemove() {
    if (current) {
      onRemove()
      return
    }
    // Clear in-modal draft when nothing is applied yet
    setDraft('')
    setPromo('')
    setError(null)
    setPromoError(null)
  }

  if (!open) return null

  const unit = mode === 'percentage' ? '%' : '₹'
  const presets = mode === 'percentage' ? PERCENT_PRESETS : FLAT_PRESETS
  const hasDraft = numericValue > 0

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-full max-h-[min(640px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2
              id="discount-modal-title"
              className="text-xl font-bold text-salon-text"
            >
              Apply Discount
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Subtotal {formatCurrency(subtotal)}
              {previewAmount > 0 && (
                <span className="text-salon-accent">
                  {' '}
                  · saves {formatCurrency(previewAmount)}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* Body: content + keypad */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* LEFT — controls */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto border-b border-salon-border p-4 sm:p-5 md:w-[48%] md:border-b-0 md:border-r">
            {/* Mode tabs */}
            <div
              role="tablist"
              aria-label="Discount type"
              className="grid grid-cols-2 gap-2 rounded-xl bg-salon-bg p-1.5"
            >
              <ModeTab
                active={mode === 'percentage'}
                icon={<Percent size={20} />}
                label="Percentage (%)"
                onClick={() => handleModeChange('percentage')}
              />
              <ModeTab
                active={mode === 'flat'}
                icon={<Banknote size={20} />}
                label="Flat Amount"
                onClick={() => handleModeChange('flat')}
              />
            </div>

            {/* Quick presets */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
                Quick select
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
                {presets.map((v) => {
                  const selected =
                    draft === String(v) ||
                    (mode === 'flat' && numericValue === v && draft !== '')
                  return (
                    <button
                      key={`${mode}-${v}`}
                      type="button"
                      onClick={() => handlePreset(v)}
                      className={[
                        'min-h-14 touch-manipulation rounded-xl border-2 text-lg font-bold tabular-nums transition-colors',
                        'active:scale-[0.97]',
                        selected
                          ? 'border-salon-primary bg-salon-primary text-white'
                          : 'border-salon-border bg-white text-salon-text hover:border-salon-primary/40 hover:bg-salon-primary-light/40',
                      ].join(' ')}
                    >
                      {mode === 'percentage' ? `${v}%` : formatCurrency(v)}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom value (keypad-driven, no OS keyboard) */}
            <label className="block">
              <span className="text-sm font-semibold text-salon-text">
                Custom {mode === 'percentage' ? 'percentage' : 'amount'}
              </span>
              <div className="relative mt-1.5">
                <input
                  readOnly
                  inputMode="none"
                  autoComplete="off"
                  tabIndex={0}
                  value={draft}
                  placeholder="0"
                  className="w-full rounded-xl border-2 border-salon-primary bg-salon-primary-light/30 py-3.5 pl-4 pr-12 text-3xl font-bold tabular-nums text-salon-text outline-none placeholder:text-salon-muted/50"
                  aria-label={
                    mode === 'percentage'
                      ? 'Custom discount percentage'
                      : 'Custom discount amount'
                  }
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xl font-bold text-salon-muted"
                  aria-hidden
                >
                  {unit}
                </span>
              </div>
              {error ? (
                <p className="mt-1.5 text-sm font-medium text-salon-danger" role="alert">
                  {error}
                </p>
              ) : (
                <p className="mt-1.5 h-5 text-sm" aria-hidden />
              )}
            </label>

            {/* Promo code */}
            <div>
              <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-salon-text">
                <Tag size={16} className="text-salon-muted" />
                Promo code
                <span className="font-normal text-salon-muted">(optional)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={promo}
                  onChange={(e) => {
                    setPromo(e.target.value.toUpperCase())
                    setPromoError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleApplyPromo()
                    }
                  }}
                  placeholder="e.g. SALON10"
                  className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-salon-border bg-white px-3.5 text-base font-semibold uppercase tracking-wide text-salon-text outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-salon-muted/60 focus:border-salon-primary"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={handleApplyPromo}
                  className="min-h-12 shrink-0 px-4"
                >
                  Apply
                </Button>
              </div>
              {promoError ? (
                <p className="mt-1.5 text-sm font-medium text-salon-danger" role="alert">
                  {promoError}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-salon-muted">
                  Try SALON10, SALON20, SAVE50, or SAVE100
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — numeric keypad */}
          <div className="flex min-h-[220px] shrink-0 flex-col bg-salon-bg p-3 sm:p-4 md:min-h-0 md:w-[52%]">
            <NumericKeypad
              onKey={handleKey}
              onDone={() => {
                /* value already live-updated; primary CTA is Apply Discount */
              }}
              allowDecimal={allowDecimal}
              doneLabel="OK"
              className="flex-1"
            />
          </div>
        </div>

        {/* Footer actions */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-salon-border bg-white p-3 sm:flex-row sm:gap-3 sm:p-4">
          <Button
            type="button"
            variant="secondary"
            size="secondary"
            onClick={handleRemove}
            disabled={!current && !hasDraft && !promo.trim()}
            className="min-h-14 w-full flex-1 sm:min-h-16"
          >
            Remove Discount
          </Button>
          <Button
            type="button"
            variant="primary"
            size="secondary"
            onClick={handleApply}
            disabled={!hasDraft || subtotal <= 0}
            className="min-h-14 w-full flex-[1.4] sm:min-h-16"
          >
            Apply Discount
          </Button>
        </footer>
      </div>
    </div>
  )
}

function ModeTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        'flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors touch-manipulation sm:text-base',
        active
          ? 'bg-salon-primary text-white shadow-sm'
          : 'bg-transparent text-salon-muted hover:bg-white hover:text-salon-text',
      ].join(' ')}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}
