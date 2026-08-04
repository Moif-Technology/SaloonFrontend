import { ShoppingCart, Trash2 } from 'lucide-react'
import BillItemRow from './BillItemRow'
import type { BillItem, BillTotals } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

interface BillPanelProps {
  items: BillItem[]
  totals: BillTotals
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onClear: () => void
}

export default function BillPanel({
  items,
  totals,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
}: BillPanelProps) {
  return (
    <section className="flex flex-col h-full bg-white rounded-2xl border border-salon-border overflow-hidden">
      <header className="flex items-center justify-between px-5 py-4 border-b border-salon-border">
        <div className="flex items-center gap-2 text-salon-text">
          <ShoppingCart size={26} />
          <h2 className="text-[24px] font-bold">Bill Items ({items.length})</h2>
        </div>
        <button
          onClick={onClear}
          disabled={items.length === 0}
          className="flex items-center gap-1.5 text-salon-danger font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={20} />
          Clear
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-salon-muted gap-2">
            <ShoppingCart size={44} strokeWidth={1.5} />
            <p className="text-lg">No items added yet</p>
          </div>
        ) : (
          items.map((item) => (
            <BillItemRow
              key={item.id}
              item={item}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      <div className="px-5 py-4 border-t border-salon-border bg-salon-primary-light/40">
        <div className="flex items-center justify-between text-lg text-salon-muted mb-1.5">
          <span>Subtotal</span>
          <span className="font-semibold text-salon-text">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-lg text-salon-muted mb-3">
          <span>Discount</span>
          <span className="font-semibold text-salon-accent">
            {totals.discount > 0 ? `- ${formatCurrency(totals.discount)}` : formatCurrency(0)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-salon-border">
          <span className="text-2xl font-bold text-salon-primary">Total</span>
          <span className="text-[30px] font-bold text-salon-primary">
            {formatCurrency(totals.total)}
          </span>
        </div>
      </div>
    </section>
  )
}
