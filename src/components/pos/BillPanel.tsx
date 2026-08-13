import { useState } from 'react'
import { ChevronDown, ChevronUp, ShoppingCart, Trash2, X } from 'lucide-react'
import BillItemRow from './BillItemRow'
import IconButton from '../common/IconButton'
import type { BillItem, BillTotals } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

interface BillPanelProps {
  items: BillItem[]
  totals: BillTotals
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
  onEditQty?: (id: string) => void
  onEditPrice?: (id: string) => void
  selectionMode?: boolean
  selectedIds?: Set<string>
  onEnterSelection?: (id: string) => void
  onToggleSelect?: (id: string) => void
  onCancelSelection?: () => void
  onDeleteSelected?: () => void
}

export default function BillPanel({
  items,
  totals,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onEditQty,
  onEditPrice,
  selectionMode = false,
  selectedIds,
  onEnterSelection,
  onToggleSelect,
  onCancelSelection,
  onDeleteSelected,
}: BillPanelProps) {
  /** Collapsed by default — Grand Total only; expand for Subtotal / Discount / Tax */
  const [totalsOpen, setTotalsOpen] = useState(false)

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)] backdrop-blur-2xl">
      {selectionMode ? (
        <header className="flex shrink-0 items-center justify-between border-b border-white/40 bg-salon-primary-light/60 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-salon-text">
            <button
              type="button"
              onClick={onCancelSelection}
              aria-label="Cancel selection"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-salon-primary hover:bg-white/50 sm:h-9 sm:w-9"
            >
              <X size={18} />
            </button>
            <h2 className="truncate text-lg font-bold tracking-tight text-salon-primary sm:text-xl">
              {selectedIds?.size ?? 0} selected
            </h2>
          </div>
          <IconButton
            variant="danger"
            sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
            onClick={onDeleteSelected}
            aria-label="Delete selected items"
          >
            <Trash2 size={18} />
          </IconButton>
        </header>
      ) : (
        <header className="flex shrink-0 items-center justify-between border-b border-white/40 bg-white/20 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-salon-text">
            <ShoppingCart size={22} className="shrink-0 text-salon-primary" />
            <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Current Bill
              <span className="ml-1.5 font-semibold text-salon-muted">({items.length})</span>
            </h2>
          </div>
          <IconButton
            variant="danger"
            sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
            onClick={onClear}
            disabled={items.length === 0}
            aria-label="Clear all items"
          >
            <Trash2 size={18} />
          </IconButton>
        </header>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 px-4 text-salon-muted">
            <span className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-salon-primary-light),rgba(245,230,232,0)_70%)]">
              <ShoppingCart size={28} strokeWidth={2} className="text-salon-primary/60 sm:hidden" />
              <ShoppingCart size={38} strokeWidth={2} className="text-salon-primary/60 hidden sm:block" />
            </span>
            <p className="text-base font-medium">No items added yet</p>
            <p className="text-sm text-salon-muted/80">Select services from the right</p>
          </div>
        ) : (
          <>
            <div className="sticky top-0 z-10 hidden border-b border-white/40 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-salon-muted backdrop-blur-sm sm:grid sm:grid-cols-[minmax(0,1fr)_72px_88px_96px_40px] sm:gap-3">
              <span>Item</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Price</span>
              <span className="text-right">Amount</span>
              <span className="sr-only">Remove</span>
            </div>
            <div className="px-4">
              {items.map((item) => (
                <BillItemRow
                  key={item.id}
                  item={item}
                  onIncrement={onIncrement}
                  onDecrement={onDecrement}
                  onRemove={onRemove}
                  onEditQty={onEditQty}
                  onEditPrice={onEditPrice}
                  selectionMode={selectionMode}
                  selected={selectedIds?.has(item.id) ?? false}
                  onEnterSelection={onEnterSelection}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/40 bg-white/25 px-3 py-2.5 sm:px-4 sm:py-3">
        <div className="space-y-1.5">
          {totalsOpen ? (
            <div className="space-y-1.5 pb-1.5">
              <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
                <span>Subtotal</span>
                <span className="font-semibold tabular-nums text-salon-text">
                  {formatCurrency(totals.subtotal)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
                <span>Discount</span>
                <span className="font-semibold tabular-nums text-salon-accent">
                  {totals.discount > 0
                    ? `− ${formatCurrency(totals.discount)}`
                    : formatCurrency(0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
                <span>Tax</span>
                <span className="font-semibold tabular-nums text-salon-text">
                  {formatCurrency(totals.tax)}
                </span>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setTotalsOpen((v) => !v)}
            aria-expanded={totalsOpen}
            aria-label={totalsOpen ? 'Hide bill details' : 'Show bill details'}
            className={[
              'flex w-full items-center justify-between gap-2 rounded-xl px-1 py-0.5 text-left',
              'transition-colors hover:bg-white/40',
              totalsOpen ? 'border-t border-white/40 pt-2' : '',
            ].join(' ')}
          >
            <span className="flex min-w-0 items-center gap-1.5">
              {totalsOpen ? (
                <ChevronDown size={18} className="shrink-0 text-salon-primary" />
              ) : (
                <ChevronUp size={18} className="shrink-0 text-salon-primary" />
              )}
              <span className="text-lg font-bold text-salon-primary sm:text-xl">Grand Total</span>
            </span>
            <span className="text-xl font-bold tabular-nums text-salon-primary sm:text-2xl">
              {formatCurrency(totals.total)}
            </span>
          </button>
        </div>
      </footer>
    </section>
  )
}
