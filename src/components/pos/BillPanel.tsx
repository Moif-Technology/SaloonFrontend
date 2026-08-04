import { ShoppingCart, Trash2, X } from 'lucide-react'
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
  selectionMode: boolean
  selectedIds: Set<string>
  onEnterSelection: (id: string) => void
  onToggleSelect: (id: string) => void
  onCancelSelection: () => void
  onDeleteSelected: () => void
}

export default function BillPanel({
  items,
  totals,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  selectionMode,
  selectedIds,
  onEnterSelection,
  onToggleSelect,
  onCancelSelection,
  onDeleteSelected,
}: BillPanelProps) {
  return (
    <section className="flex flex-col h-full bg-white/45 backdrop-blur-2xl">
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-4 border-b border-white/40 bg-white/20">
        {selectionMode ? (
          <>
            <div className="flex items-center gap-2 text-salon-text">
              <IconButton
                sizeClassName="w-8 h-8 sm:w-9 sm:h-9"
                onClick={onCancelSelection}
                aria-label="Cancel selection"
              >
                <X size={18} />
              </IconButton>
              <h2 className="text-base sm:text-xl lg:text-[24px] font-bold whitespace-nowrap">
                {selectedIds.size} selected
              </h2>
            </div>
            <IconButton
              variant="danger"
              sizeClassName="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11"
              onClick={onDeleteSelected}
              disabled={selectedIds.size === 0}
              aria-label="Delete selected items"
            >
              <Trash2 size={18} />
            </IconButton>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-salon-text">
              <ShoppingCart size={20} className="shrink-0" />
              <h2 className="text-base sm:text-xl lg:text-[24px] font-bold whitespace-nowrap">
                Bill Items ({items.length})
              </h2>
            </div>
            <IconButton
              variant="danger"
              sizeClassName="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11"
              onClick={onClear}
              disabled={items.length === 0}
              aria-label="Clear all items"
            >
              <Trash2 size={18} />
            </IconButton>
          </>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-3 sm:px-5">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-salon-muted gap-2 sm:gap-3">
            <span className="flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--color-salon-primary-light),rgba(245,230,232,0)_70%)] shadow-[inset_0_0_0_1px_rgba(121,7,40,0.08)]">
              <ShoppingCart size={28} strokeWidth={2} className="text-salon-primary/60 sm:hidden" />
              <ShoppingCart size={38} strokeWidth={2} className="text-salon-primary/60 hidden sm:block" />
            </span>
            <p className="text-sm sm:text-lg font-medium">No items added yet</p>
            <p className="text-xs sm:text-base text-salon-muted/70 text-center">
              Tap a service to add it to the bill
            </p>
          </div>
        ) : (
          items.map((item) => (
            <BillItemRow
              key={item.id}
              item={item}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onRemove={onRemove}
              selectionMode={selectionMode}
              selected={selectedIds.has(item.id)}
              onEnterSelection={onEnterSelection}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>

      <div className="px-3 sm:px-5 py-2 sm:py-4 border-t border-white/40 bg-white/25">
        <div className="flex items-center justify-between text-sm sm:text-base lg:text-lg text-salon-muted mb-0.5 sm:mb-2">
          <span>Subtotal</span>
          <span className="font-semibold text-salon-text tabular-nums">{formatCurrency(totals.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm sm:text-base lg:text-lg mb-1 sm:mb-3">
          <span className="text-salon-accent font-medium">Discount</span>
          <span className="font-semibold text-salon-accent tabular-nums">
            {totals.discount > 0 ? `- ${formatCurrency(totals.discount)}` : formatCurrency(0)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1.5 sm:pt-3 border-t border-white/40">
          <span className="text-lg sm:text-xl lg:text-2xl font-bold text-salon-primary">Total</span>
          <span className="text-xl sm:text-2xl lg:text-[30px] font-bold text-salon-primary tabular-nums">
            {formatCurrency(totals.total)}
          </span>
        </div>
      </div>
    </section>
  )
}
