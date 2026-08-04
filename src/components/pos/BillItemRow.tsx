import { Minus, Plus, X } from 'lucide-react'
import IconButton from '../common/IconButton'
import type { BillItem } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

interface BillItemRowProps {
  item: BillItem
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
}

export default function BillItemRow({ item, onIncrement, onDecrement, onRemove }: BillItemRowProps) {
  const amount = item.qty * item.price

  return (
    <div className="flex items-center gap-3 py-3 border-b border-salon-border">
      <div className="flex-1 min-w-0">
        <p className="text-[24px] leading-tight font-semibold text-salon-text truncate">
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <IconButton
            size={30}
            onClick={() => onDecrement(item.id)}
            aria-label={`Decrease ${item.name} quantity`}
            className="bg-salon-primary-light"
          >
            <Minus size={16} />
          </IconButton>
          <span className="text-lg font-semibold w-6 text-center">{item.qty}</span>
          <IconButton
            size={30}
            onClick={() => onIncrement(item.id)}
            aria-label={`Increase ${item.name} quantity`}
            className="bg-salon-primary-light"
          >
            <Plus size={16} />
          </IconButton>
          <span className="text-[18px] text-salon-muted ml-1">
            x {formatCurrency(item.price)}
          </span>
        </div>
      </div>
      <p className="text-[24px] font-bold text-salon-text w-24 text-right">
        {formatCurrency(amount)}
      </p>
      <IconButton
        variant="danger"
        size={40}
        onClick={() => onRemove(item.id)}
        aria-label={`Remove ${item.name}`}
      >
        <X size={22} />
      </IconButton>
    </div>
  )
}
