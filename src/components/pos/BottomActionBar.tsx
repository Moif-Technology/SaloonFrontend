import { useEffect, useId, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  Save,
  CalendarClock,
  User,
  Percent,
  Printer,
  Pause,
  MessageSquare,
  Banknote,
  CreditCard,
  MoreHorizontal,
  ClipboardList,
} from 'lucide-react'
import Button from '../common/Button'

interface BottomActionBarProps {
  onSettlement: () => void
  onSaveBill: () => void
  onAppointment: () => void
  onCustomer: () => void
  onDiscount: () => void
  onBillPrint: () => void
  /** Opens Job List (saved jobs) — occupies Hold Bill slot */
  onJobList: () => void
  onNote: () => void
  onQuickCash: () => void
  onCard: () => void
  /** Optional — QR Pay is hidden for now */
  onQrPay?: () => void
  /** Print last settled invoice for this counter */
  onBillPrintLast?: () => void
  /** Optional: park current bill locally */
  onHoldBill?: () => void
  settlementDisabled?: boolean
}

interface MoreMenuItem {
  id: string
  label: string
  icon: ReactNode
  onSelect: () => void
  accent?: 'default' | 'success'
}

function MoreMenuRow({
  item,
  onActivate,
}: {
  item: MoreMenuItem
  onActivate: () => void
}) {
  const accentClass =
    item.accent === 'success' ? 'text-salon-success' : 'text-salon-primary'

  return (
    <button
      type="button"
      role="menuitem"
      className={[
        'flex w-full items-center gap-3.5 px-4 text-left',
        'min-h-[56px] py-3.5',
        'text-base font-semibold text-salon-text md:text-lg',
        'transition-colors duration-100',
        'hover:bg-salon-primary-light/60',
        'active:bg-salon-primary-light',
        'focus-visible:bg-salon-primary-light/60 focus-visible:outline-none',
        'first:rounded-t-xl last:rounded-b-xl',
      ].join(' ')}
      onClick={onActivate}
    >
      <span
        className={[
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
          'bg-salon-bg',
          accentClass,
        ].join(' ')}
        aria-hidden
      >
        {item.icon}
      </span>
      <span className="min-w-0 flex-1">{item.label}</span>
    </button>
  )
}

export default function BottomActionBar({
  onSettlement,
  onSaveBill,
  onAppointment,
  onCustomer,
  onDiscount,
  onBillPrint,
  onJobList,
  onNote,
  onQuickCash,
  onCard,
  onBillPrintLast,
  onHoldBill,
  settlementDisabled,
}: BottomActionBarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const menuId = useId()

  const closeMore = () => setMoreOpen(false)

  const moreItems: MoreMenuItem[] = [
    {
      id: 'note',
      label: 'Note',
      icon: <MessageSquare size={20} strokeWidth={2.25} />,
      onSelect: onNote,
    },
    ...(onHoldBill
      ? [
          {
            id: 'hold-bill',
            label: 'Hold Bill',
            icon: <Pause size={20} strokeWidth={2.25} />,
            onSelect: onHoldBill,
          } satisfies MoreMenuItem,
        ]
      : []),
    {
      id: 'quick-cash',
      label: 'Quick Cash',
      icon: <Banknote size={20} strokeWidth={2.25} />,
      accent: 'success',
      onSelect: onQuickCash,
    },
    {
      id: 'card',
      label: 'Card',
      icon: <CreditCard size={20} strokeWidth={2.25} />,
      onSelect: onCard,
    },
    ...(onBillPrintLast
      ? [
          {
            id: 'bill-print',
            label: 'Bill Print',
            icon: <Printer size={20} strokeWidth={2.25} />,
            onSelect: onBillPrintLast,
          } satisfies MoreMenuItem,
        ]
      : []),
  ]

  useEffect(() => {
    if (!moreOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        setMoreOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [moreOpen])

  function handleMoreSelect(item: MoreMenuItem) {
    closeMore()
    item.onSelect()
  }

  const label = (text: string) => (
    <span className="hidden lg:inline whitespace-nowrap">{text}</span>
  )

  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_2fr_2fr] grid-rows-2 gap-1.5 p-3 sm:gap-3 md:p-4">
      <Button size="secondary" icon={<CalendarClock size={20} />} onClick={onAppointment}>
        {label('Appointment')}
      </Button>
      <Button size="secondary" icon={<User size={20} />} onClick={onCustomer}>
        {label('Customer')}
      </Button>
      <Button size="secondary" icon={<Percent size={20} />} onClick={onDiscount}>
        {label('Discount')}
      </Button>
      <Button
        variant="outline"
        size="stretch"
        className="row-span-2"
        icon={<Save size={22} />}
        onClick={onSaveBill}
      >
        Save Bill
      </Button>
      <Button
        variant="primary"
        size="stretch"
        className="row-span-2 justify-between px-5"
        disabled={settlementDisabled}
        onClick={onSettlement}
      >
        <span className="flex items-center gap-3">Settlement</span>
        <ArrowRight size={26} />
      </Button>

      <Button size="secondary" icon={<Printer size={20} />} onClick={onBillPrint}>
        {label('Print')}
      </Button>
      <Button size="secondary" icon={<ClipboardList size={20} />} onClick={onJobList}>
        {label('Job List')}
      </Button>

      <div className={`relative ${moreOpen ? 'z-50' : ''}`}>
        <Button
          size="secondary"
          icon={<MoreHorizontal size={20} />}
          onClick={() => setMoreOpen((v) => !v)}
          className={[
            'w-full',
            moreOpen ? 'border-salon-primary/50 bg-salon-primary-light/40' : '',
          ].join(' ')}
          aria-expanded={moreOpen}
          aria-haspopup="menu"
          aria-controls={moreOpen ? menuId : undefined}
        >
          {label('More')}
        </Button>

        {moreOpen && (
          <>
            <div className="fixed inset-0 z-40" aria-hidden onClick={closeMore} />
            <div
              id={menuId}
              role="menu"
              aria-label="More payment actions"
              className={[
                'absolute bottom-full right-0 z-50 mb-2',
                'w-[min(100vw-1.5rem,17.5rem)] min-w-[13.5rem]',
                'overflow-hidden rounded-xl',
                'border border-white/50 bg-white/90 backdrop-blur-xl',
                'shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_28px_rgba(31,17,20,0.14),0_2px_8px_rgba(31,17,20,0.06)]',
              ].join(' ')}
              style={{ animation: 'fadeIn 140ms ease-out' }}
            >
              <ul className="m-0 list-none divide-y divide-salon-border/80 p-0">
                {moreItems.map((item) => (
                  <li key={item.id} role="none">
                    <MoreMenuRow item={item} onActivate={() => handleMoreSelect(item)} />
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
