import { useEffect, useMemo, useState } from 'react'
import { Tag, X } from 'lucide-react'
import NumericKeypad from '../common/NumericKeypad'
import {
  applyNumericKey,
  type NumericKey,
} from '../../utils/numericInput'
import { formatCurrency } from '../../utils/format'
import type { BillItem } from '../../types/pos'
import { STORE_VAT_PERCENT } from '../../types/discount'

export interface PriceChangeModalProps {
  open: boolean
  item: BillItem | null
  onClose: () => void
  onApply: (itemId: string, newPrice: number) => void
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function FieldRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className={[
          'w-[7.5rem] shrink-0 text-right text-sm font-semibold',
          accent ? 'text-salon-primary' : 'text-salon-muted',
        ].join(' ')}
      >
        {label}
      </span>
      <div
        className={[
          'flex h-10 flex-1 items-center rounded-lg border px-3 font-bold tabular-nums',
          accent
            ? 'border-salon-primary/40 bg-salon-primary-light/40 text-salon-primary'
            : 'border-salon-border bg-salon-bg text-salon-text',
        ].join(' ')}
      >
        {value}
      </div>
    </div>
  )
}

export default function PriceChangeModal({
  open,
  item,
  onClose,
  onApply,
}: PriceChangeModalProps) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !item) return
    setDraft('')
    setError(null)
  }, [open, item])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const vatPer = useMemo(() => {
    const rate = Number(item?.taxRate)
    return Number.isFinite(rate) && rate >= 0 ? rate : STORE_VAT_PERCENT
  }, [item])

  const preview = useMemo(() => {
    const parsed = Number(draft)
    if (!Number.isFinite(parsed) || parsed <= 0) return null
    const unitNet = roundMoney(parsed)
    const unitVat = roundMoney((unitNet * vatPer) / 100)
    const unitGross = roundMoney(unitNet + unitVat)
    const qty = Number(item?.qty) || 1
    const lineTotal = roundMoney(unitGross * qty)
    return { unitNet, unitVat, unitGross, lineTotal, qty }
  }, [draft, vatPer, item?.qty])

  if (!open || !item) return null

  const currentNet = Number(item.price) || 0
  const currentVat = roundMoney((currentNet * vatPer) / 100)
  const currentGross = roundMoney(currentNet + currentVat)
  const currentLine = roundMoney(currentGross * item.qty)

  function handleKey(key: NumericKey) {
    setError(null)
    setDraft((prev) =>
      applyNumericKey(prev, key, { allowDecimal: true, maxDecimalPlaces: 2 }),
    )
  }

  function handleDone() {
    const n = Number(draft)
    if (!Number.isFinite(n) || n <= 0) {
      setError('Enter a price greater than 0')
      return
    }
    onApply(item!.id, roundMoney(n))
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-change-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-[min(560px,92dvh)] w-full max-w-[920px] overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_32px_rgba(31,17,20,0.18)] backdrop-blur-xl">
        <div className="flex w-[48%] min-w-0 flex-col border-r border-salon-border">
          <header className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-br from-salon-primary to-[#7a2a32] px-4 py-3.5 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/15">
                <Tag size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  Price Change
                </p>
                <h2
                  id="price-change-title"
                  className="truncate text-base font-extrabold"
                >
                  {item.name}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/15 text-white hover:bg-white/25"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4">
            <FieldRow label="Product ID" value={String(item.productId || '—')} />
            <div className="my-1 h-px bg-salon-border" />
            <FieldRow label="Current Price" value={formatCurrency(currentNet)} />
            <FieldRow label="Current With VAT" value={formatCurrency(currentGross)} />
            <FieldRow
              label={`Line Total (×${item.qty})`}
              value={formatCurrency(currentLine)}
            />

            <div className="mt-2 flex items-center gap-3 py-1">
              <span className="w-[7.5rem] shrink-0 text-right text-sm font-semibold text-salon-muted">
                New Price
              </span>
              <div className="flex h-11 flex-1 items-center rounded-lg border-2 border-salon-primary bg-salon-primary-light/30 px-3 text-xl font-extrabold tabular-nums text-salon-text">
                {draft || (
                  <span className="text-sm font-medium text-salon-muted/70">
                    Enter new price…
                  </span>
                )}
              </div>
            </div>
            {error ? (
              <p className="ml-[7.5rem] pl-3 text-sm font-medium text-salon-danger" role="alert">
                {error}
              </p>
            ) : (
              <p className="h-5" aria-hidden />
            )}

            <div className="my-1 h-px bg-salon-border" />

            <div className="min-h-[120px]">
              {preview ? (
                <>
                  <div className="mb-1 ml-[7.5rem] flex gap-2 pl-3">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-salon-muted">
                        VAT %
                      </span>
                      <div className="flex h-9 items-center justify-center rounded-lg border border-salon-border bg-salon-bg text-sm font-bold tabular-nums">
                        {vatPer}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase text-salon-muted">
                        VAT Amount
                      </span>
                      <div className="flex h-9 items-center justify-center rounded-lg border border-salon-border bg-salon-bg text-sm font-bold tabular-nums">
                        {formatCurrency(preview.unitVat)}
                      </div>
                    </div>
                  </div>
                  <FieldRow
                    label="Price With VAT"
                    value={formatCurrency(preview.unitGross)}
                    accent
                  />
                  <FieldRow
                    label={`New Line Total (×${preview.qty})`}
                    value={formatCurrency(preview.lineTotal)}
                    accent
                  />
                </>
              ) : (
                <div className="flex h-[120px] items-center justify-center px-4 text-center text-sm text-salon-muted">
                  Enter a price to preview VAT and line total
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex w-[52%] flex-col bg-salon-bg p-4">
          <NumericKeypad
            onKey={handleKey}
            onDone={handleDone}
            allowDecimal
            doneLabel="Done"
            className="flex-1"
          />
          <button
            type="button"
            onClick={onClose}
            className="mt-2 h-12 rounded-xl border border-salon-danger/30 bg-red-50 text-base font-bold text-salon-danger hover:bg-red-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
