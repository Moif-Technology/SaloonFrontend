import { useRef, useState } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'
import IconButton from '../common/IconButton'
import type { BillItem } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

const REMOVE_ANIM_MS = 220
const CLICK_GUARD_MS = 250

interface BillItemRowProps {
  item: BillItem
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onEditQty?: (id: string) => void
  selectionMode?: boolean
  selected?: boolean
  onEnterSelection?: (id: string) => void
  onToggleSelect?: (id: string) => void
}

export default function BillItemRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
  onEditQty,
  selectionMode = false,
  selected = false,
  onEnterSelection,
  onToggleSelect,
}: BillItemRowProps) {
  const lineTotal = item.qty * item.price
  const [removing, setRemoving] = useState(false)
  const lastClickRef = useRef(0)

  function guardedClick(action: () => void) {
    const now = Date.now()
    if (now - lastClickRef.current < CLICK_GUARD_MS) return
    lastClickRef.current = now
    action()
  }

  function handleRemove() {
    if (removing) return
    setRemoving(true)
    setTimeout(() => onRemove(item.id), REMOVE_ANIM_MS)
  }

  function handleRowClick() {
    if (selectionMode) onToggleSelect?.(item.id)
  }

  function handleRowDoubleClick() {
    if (!selectionMode) onEnterSelection?.(item.id)
  }

  return (
    <article
      onClick={handleRowClick}
      onDoubleClick={handleRowDoubleClick}
      className={[
        'grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 border-b border-white/40 py-3.5',
        'sm:grid-cols-[minmax(0,1fr)_72px_88px_96px_40px] sm:items-center sm:gap-3 sm:py-3',
        'origin-top transition-all ease-in select-none',
        selectionMode ? 'cursor-pointer' : '',
        selected ? 'bg-salon-primary-light/50' : '',
        removing
          ? 'pointer-events-none scale-95 opacity-0'
          : 'scale-100 opacity-100',
      ].join(' ')}
      style={{ transitionDuration: `${REMOVE_ANIM_MS}ms` }}
    >
      <div className="flex min-w-0 items-center gap-2 sm:col-auto">
        {selectionMode && (
          <span
            className={[
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
              selected
                ? 'border-salon-primary bg-salon-primary text-white'
                : 'border-salon-border bg-white',
            ].join(' ')}
            aria-hidden
          >
            {selected && <Check size={13} strokeWidth={3} />}
          </span>
        )}
        <p className="truncate text-base font-semibold leading-snug text-salon-text sm:text-lg">
          {item.name}
        </p>
      </div>

      <div className="flex justify-center">
        <div className="flex items-center gap-1.5 rounded-full border border-salon-border bg-white px-1.5 py-1">
          <IconButton
            size={24}
            onClick={(e) => {
              e.stopPropagation()
              guardedClick(() => onDecrement(item.id))
            }}
            disabled={selectionMode}
            aria-label={`Decrease ${item.name} quantity`}
            className="text-salon-primary"
          >
            <Minus size={13} />
          </IconButton>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onEditQty?.(item.id)
            }}
            disabled={selectionMode}
            className="min-w-5 rounded-md text-center text-sm font-bold tabular-nums text-salon-text hover:bg-black/5"
            aria-label={`Edit quantity ${item.qty}`}
          >
            {item.qty}
          </button>
          <IconButton
            size={24}
            onClick={(e) => {
              e.stopPropagation()
              guardedClick(() => onIncrement(item.id))
            }}
            disabled={selectionMode}
            aria-label={`Increase ${item.name} quantity`}
            className="text-salon-primary"
          >
            <Plus size={13} />
          </IconButton>
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium tabular-nums text-salon-text text-sm sm:text-base">
          {formatCurrency(item.price)}
        </p>
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
          onClick={(e) => {
            e.stopPropagation()
            handleRemove()
          }}
          disabled={removing || selectionMode}
          aria-label={`Remove ${item.name}`}
        >
          <X size={20} />
        </IconButton>
      </div>
    </article>
  )
}
