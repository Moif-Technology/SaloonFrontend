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
  STORE_VAT_PERCENT,
  computeDiscountAmount,
  computeDiscountFinancialBreakdown,
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
  /** Store VAT % (defaults to branch rule) */
  vatPercent?: number
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
  vatPercent = STORE_VAT_PERCENT,
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

  // Lock body scroll while open (mobile sheet)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const allowDecimal = mode === 'flat'

  const numericValue = parseNumericString(draft)

  const previewAmount = useMemo(() => {
    if (numericValue <= 0) return 0
    return computeDiscountAmount(subtotal, { mode, value: numericValue })
  }, [mode, numericValue, subtotal])

  const breakdown = useMemo(() => {
    const draftDiscount: AppliedDiscount | null =
      numericValue > 0 ? { mode, value: numericValue } : null
    return computeDiscountFinancialBreakdown(subtotal, draftDiscount, vatPercent)
  }, [mode, numericValue, subtotal, vatPercent])

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
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 sm:items-center sm:p-3 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/*
        Mobile: full-height bottom sheet (safe-area aware)
        sm+: centered card with fluid max size
      */}
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
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-salon-border px-3 py-3 xs:px-4 sm:gap-3 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1">
            <h2
              id="discount-modal-title"
              className="truncate text-lg font-bold text-salon-text xs:text-xl"
            >
              Apply Discount
            </h2>
            <p className="mt-0.5 truncate text-xs font-medium text-salon-muted sm:text-sm">
              Live preview · VAT {vatPercent}%
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
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5 sm:h-11 sm:w-11"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* Body: stacked on mobile (scroll + fixed keypad), side-by-side from md */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          {/* LEFT — controls (scrollable) */}
          <div
            className={[
              'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain',
              'p-3 xs:p-4 sm:gap-4 sm:p-5',
              'md:w-[48%] md:border-r md:border-salon-border',
            ].join(' ')}
          >
            {/* Financial breakdown — live VAT & totals */}
            <section
              aria-label="Discount financial breakdown"
              className="rounded-xl border-2 border-salon-primary/15 bg-gradient-to-br from-salon-primary-light/80 via-white to-salon-bg p-3 sm:p-4"
            >
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-salon-primary sm:mb-3 sm:text-xs">
                Financial breakdown
              </p>
              <div className="space-y-1.5 sm:space-y-2">
                <BreakdownRow
                  label="Original Subtotal"
                  value={formatCurrency(breakdown.subtotal)}
                />
                <BreakdownRow
                  label="Discount Amount"
                  value={
                    breakdown.discountAmount > 0
                      ? `− ${formatCurrency(breakdown.discountAmount)}`
                      : formatCurrency(0)
                  }
                  valueClassName={
                    breakdown.discountAmount > 0
                      ? 'text-salon-accent'
                      : undefined
                  }
                />
                <BreakdownRow
                  label="Taxable Amount"
                  value={formatCurrency(breakdown.taxableAmount)}
                />
                <BreakdownRow
                  label={`VAT Amount (${vatPercent}%)`}
                  value={formatCurrency(breakdown.vatAmount)}
                />
                <div className="flex items-center justify-between gap-2 border-t border-salon-primary/20 pt-2 sm:pt-2.5">
                  <span className="text-sm font-bold text-salon-primary xs:text-base sm:text-lg">
                    Final Total
                  </span>
                  <span className="text-lg font-bold tabular-nums text-salon-primary xs:text-xl sm:text-2xl">
                    {formatCurrency(breakdown.finalTotal)}
                  </span>
                </div>
              </div>
            </section>

            {/* Mode tabs */}
            <div
              role="tablist"
              aria-label="Discount type"
              className="grid grid-cols-2 gap-1.5 rounded-xl bg-salon-bg p-1 xs:gap-2 xs:p-1.5"
            >
              <ModeTab
                active={mode === 'percentage'}
                icon={<Percent className="size-[18px] shrink-0 sm:size-5" />}
                label="Percentage"
                shortLabel="%"
                onClick={() => handleModeChange('percentage')}
              />
              <ModeTab
                active={mode === 'flat'}
                icon={<Banknote className="size-[18px] shrink-0 sm:size-5" />}
                label="Flat Amount"
                shortLabel="Flat"
                onClick={() => handleModeChange('flat')}
              />
            </div>

            {/* Quick presets */}
            <div>
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-salon-muted sm:mb-2 sm:text-xs">
                Quick select
              </p>
              <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:grid-cols-3">
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
                        'min-h-11 touch-manipulation rounded-xl border-2 text-sm font-bold tabular-nums transition-colors',
                        'xs:min-h-12 xs:text-base sm:min-h-14 sm:text-lg',
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
              <span className="text-xs font-semibold text-salon-text sm:text-sm">
                Custom {mode === 'percentage' ? 'percentage' : 'amount'}
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
                  aria-label={
                    mode === 'percentage'
                      ? 'Custom discount percentage'
                      : 'Custom discount amount'
                  }
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-lg font-bold text-salon-muted xs:right-4 xs:text-xl"
                  aria-hidden
                >
                  {unit}
                </span>
              </div>
              {error ? (
                <p className="mt-1 text-xs font-medium text-salon-danger sm:mt-1.5 sm:text-sm" role="alert">
                  {error}
                </p>
              ) : (
                <p className="mt-1 h-4 text-xs sm:mt-1.5 sm:h-5 sm:text-sm" aria-hidden />
              )}
            </label>

            {/* Promo code */}
            <div className="pb-1">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-salon-text sm:mb-1.5 sm:text-sm">
                <Tag size={14} className="shrink-0 text-salon-muted sm:hidden" />
                <Tag size={16} className="hidden shrink-0 text-salon-muted sm:block" />
                Promo code
                <span className="font-normal text-salon-muted">(optional)</span>
              </span>
              <div className="flex min-w-0 gap-2">
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
                  className={[
                    'min-h-11 min-w-0 flex-1 rounded-xl border-2 border-salon-border bg-white',
                    'px-3 text-sm font-semibold uppercase tracking-wide text-salon-text outline-none',
                    'placeholder:normal-case placeholder:tracking-normal placeholder:text-salon-muted/60',
                    'focus:border-salon-primary sm:min-h-12 sm:px-3.5 sm:text-base',
                  ].join(' ')}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="compact"
                  onClick={handleApplyPromo}
                  className="min-h-11 shrink-0 px-3 sm:min-h-12 sm:px-4"
                >
                  Apply
                </Button>
              </div>
              {promoError ? (
                <p className="mt-1 text-xs font-medium text-salon-danger sm:mt-1.5 sm:text-sm" role="alert">
                  {promoError}
                </p>
              ) : (
                <p className="mt-1 text-[10px] text-salon-muted sm:mt-1.5 sm:text-xs">
                  Try SALON10, SALON20, SAVE50, or SAVE100
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — numeric keypad (compact on phones so form stays usable) */}
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
                /* value already live-updated; primary CTA is Apply Discount */
              }}
              allowDecimal={allowDecimal}
              doneLabel="OK"
              className="min-h-0 flex-1"
            />
          </div>
        </div>

        {/* Footer actions */}
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
            onClick={handleRemove}
            disabled={!current && !hasDraft && !promo.trim()}
            className="min-h-12 w-full flex-1 sm:min-h-14 md:min-h-16"
          >
            <span className="sm:hidden">Remove</span>
            <span className="hidden sm:inline">Remove Discount</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="secondary"
            onClick={handleApply}
            disabled={!hasDraft || subtotal <= 0}
            className="min-h-12 w-full flex-[1.4] sm:min-h-14 md:min-h-16"
          >
            <span className="sm:hidden">Apply</span>
            <span className="hidden sm:inline">Apply Discount</span>
          </Button>
        </footer>
      </div>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: string
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-xs xs:text-sm sm:gap-3 sm:text-base">
      <span className="min-w-0 shrink font-medium text-salon-muted">{label}</span>
      <span
        className={[
          'shrink-0 font-semibold tabular-nums text-salon-text',
          valueClassName ?? '',
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}

function ModeTab({
  active,
  icon,
  label,
  shortLabel,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  shortLabel: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-label={label}
      onClick={onClick}
      className={[
        'flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors touch-manipulation',
        'xs:min-h-11 xs:gap-2 xs:px-3 xs:text-sm sm:min-h-12 sm:text-base',
        active
          ? 'bg-salon-primary text-white shadow-sm'
          : 'bg-transparent text-salon-muted hover:bg-white hover:text-salon-text',
      ].join(' ')}
    >
      {icon}
      <span className="truncate sm:hidden">{shortLabel}</span>
      <span className="hidden truncate sm:inline">{label}</span>
    </button>
  )
}
