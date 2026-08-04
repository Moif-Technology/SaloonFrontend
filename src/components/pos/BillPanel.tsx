import { ShoppingCart, Trash2 } from 'lucide-react'
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
}

export default function BillPanel({
  items,
  totals,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onEditQty,
}: BillPanelProps) {
  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-white/40 bg-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_8px_32px_rgba(31,17,20,0.10)] backdrop-blur-2xl">
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
                />
              ))}
            </div>
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-white/40 bg-white/25 px-4 py-3.5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
            <span>Subtotal</span>
            <span className="font-semibold tabular-nums text-salon-text">
              {formatCurrency(totals.subtotal)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
            <span>Discount</span>
            <span className="font-semibold tabular-nums text-salon-accent">
              {totals.discount > 0 ? `− ${formatCurrency(totals.discount)}` : formatCurrency(0)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm text-salon-muted sm:text-base">
            <span>Tax</span>
            <span className="font-semibold tabular-nums text-salon-text">
              {formatCurrency(totals.tax)}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/40 pt-2.5">
            <span className="text-lg font-bold text-salon-primary sm:text-xl">Grand Total</span>
            <span className="text-xl font-bold tabular-nums text-salon-primary sm:text-2xl">
              {formatCurrency(totals.total)}
            </span>
          </div>
        </div>
      </footer>
    </section>
  )
}
