import { Minus, Plus, X, Check } from 'lucide-react'
import IconButton from '../common/IconButton'
import type { BillItem } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

interface BillItemRowProps {
  item: BillItem
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  selectionMode: boolean
  selected: boolean
  onEnterSelection: (id: string) => void
  onToggleSelect: (id: string) => void
}

export default function BillItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  selectionMode,
  selected,
  onEnterSelection,
  onToggleSelect,
}: BillItemRowProps) {
  const amount = item.qty * item.price

  return (
    <div
      onDoubleClick={() => !selectionMode && onEnterSelection(item.id)}
      onClick={() => selectionMode && onToggleSelect(item.id)}
      className={[
        'flex items-center gap-2 sm:gap-3 py-2.5 sm:py-3.5 px-2 -mx-2 border-b border-white/40 last:border-b-0 rounded-lg transition-colors select-none',
        selectionMode ? 'cursor-pointer' : '',
        selected ? 'bg-white/40' : '',
      ].join(' ')}
    >
      {selectionMode && (
        <span
          className={[
            'flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 shrink-0 transition-colors',
            selected
              ? 'bg-salon-primary border-salon-primary text-white'
              : 'border-salon-border text-transparent',
          ].join(' ')}
        >
          <Check size={15} strokeWidth={3} />
        </span>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-lg lg:text-[24px] leading-tight font-semibold text-salon-text line-clamp-2">
          {item.name}
        </p>
        {selectionMode ? (
          <span className="text-xs sm:text-base lg:text-[18px] text-salon-muted whitespace-nowrap">
            Qty {item.qty} x {formatCurrency(item.price)}
          </span>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2.5 mt-1 sm:mt-2">
            <div className="flex items-center gap-1 sm:gap-1.5 rounded-full border border-white/50 bg-white/30 backdrop-blur-sm pl-1 pr-1 sm:pl-1.5 sm:pr-1.5 py-1">
              <IconButton
                sizeClassName="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
                onClick={() => onDecrement(item.id)}
                aria-label={`Decrease ${item.name} quantity`}
                className="text-salon-text"
              >
                <Minus size={14} />
              </IconButton>
              <span className="text-sm sm:text-lg font-semibold w-5 sm:w-6 text-center tabular-nums">{item.qty}</span>
              <IconButton
                sizeClassName="w-6 h-6 sm:w-7 sm:h-7 lg:w-9 lg:h-9"
                onClick={() => onIncrement(item.id)}
                aria-label={`Increase ${item.name} quantity`}
                className="text-salon-text"
              >
                <Plus size={14} />
              </IconButton>
            </div>
            <span className="text-xs sm:text-base lg:text-[18px] text-salon-muted whitespace-nowrap">
              x {formatCurrency(item.price)}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm sm:text-lg lg:text-[24px] font-bold text-salon-text w-16 sm:w-24 lg:w-28 text-right tabular-nums shrink-0">
        {formatCurrency(amount)}
      </p>

      {!selectionMode && (
        <IconButton
          variant="danger"
          sizeClassName="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          <X size={17} />
        </IconButton>
      )}
    </div>
  )
}
