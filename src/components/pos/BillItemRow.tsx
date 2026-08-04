import { Minus, Plus, X } from 'lucide-react'
import IconButton from '../common/IconButton'
import type { BillItem } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

interface BillItemRowProps {
  item: BillItem
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onEditQty?: (id: string) => void
}

export default function BillItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onEditQty,
}: BillItemRowProps) {
  const lineTotal = item.qty * item.price

  return (
    <article className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-salon-border py-3.5 sm:grid-cols-[minmax(0,1fr)_72px_88px_96px_40px] sm:items-center sm:gap-3 sm:py-3">
      <div className="min-w-0 sm:col-auto">
        <p className="truncate text-base font-semibold leading-snug text-salon-text sm:text-lg">
          {item.name}
        </p>
      </div>

      <div className="flex items-center justify-end gap-1.5 sm:justify-center">
        <IconButton
          size={32}
          onClick={() => onDecrement(item.id)}
          aria-label={`Decrease ${item.name} quantity`}
          className="bg-salon-primary-light text-salon-primary"
        >
          <Minus size={16} />
        </IconButton>
        <button
          type="button"
          onClick={() => onEditQty?.(item.id)}
          className="min-w-10 rounded-lg px-2 py-1 text-center text-base font-bold tabular-nums text-salon-text hover:bg-salon-primary-light"
          aria-label={`Edit quantity ${item.qty}`}
        >
          {item.qty}
        </button>
        <IconButton
          size={32}
          onClick={() => onIncrement(item.id)}
          aria-label={`Increase ${item.name} quantity`}
          className="bg-salon-primary-light text-salon-primary"
        >
          <Plus size={16} />
        </IconButton>
      </div>

      <div className="text-sm text-salon-muted sm:text-right sm:text-base">
        <span className="sm:hidden">@ </span>
        <span className="font-medium tabular-nums text-salon-text">
          {formatCurrency(item.price)}
        </span>
      </div>

      <div className="text-right">
        <p className="text-base font-bold tabular-nums text-salon-text sm:text-lg">
          {formatCurrency(lineTotal)}
        </p>
      </div>

      <div className="flex justify-end sm:justify-center">
        <IconButton
          variant="danger"
          size={36}
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
        >
          <X size={20} />
        </IconButton>
      </div>
    </article>
  )
}
