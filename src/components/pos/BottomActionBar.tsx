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
  QrCode,
  MoreHorizontal,
} from 'lucide-react'
import Button from '../common/Button'

interface BottomActionBarProps {
  onSettlement: () => void
  onSaveBill: () => void
  onAppointment: () => void
  onCustomer: () => void
  onDiscount: () => void
  onBillPrint: () => void
  onHoldBill: () => void
  onNote: () => void
  onQuickCash: () => void
  onCard: () => void
  onQrPay: () => void
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
  onHoldBill,
  onNote,
  onQuickCash,
  onCard,
  onQrPay,
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
    {
      id: 'qr-pay',
      label: 'QR Pay',
      icon: <QrCode size={20} strokeWidth={2.25} />,
      accent: 'success',
      onSelect: onQrPay,
    },
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

  /* 3-col on phones (2 rows), single fluid row from md up — keeps Discount touch-friendly */
  const secondaryBtnClass =
    'min-h-11 min-w-0 w-full px-1.5 sm:px-2 md:flex-1 ' +
    'text-[11px] leading-tight xs:text-xs sm:text-sm md:text-base ' +
    '[&>svg]:size-[18px] sm:[&>svg]:size-5 md:[&>svg]:size-[22px] ' +
    'truncate'

  return (
    <div className="flex flex-col gap-2 bg-white p-2 xs:p-3 md:gap-4 md:p-4">
      <div className="grid grid-cols-3 gap-1.5 xs:gap-2 md:flex md:gap-3">
        <Button
          size="secondary"
          icon={<CalendarClock size={22} />}
          onClick={onAppointment}
          className={secondaryBtnClass}
        >
          <span className="truncate">Appointment</span>
        </Button>
        <Button
          size="secondary"
          icon={<User size={22} />}
          onClick={onCustomer}
          className={secondaryBtnClass}
        >
          <span className="truncate">Customer</span>
        </Button>
        <Button
          size="secondary"
          icon={<Percent size={22} />}
          onClick={onDiscount}
          className={secondaryBtnClass}
          aria-label="Apply discount"
        >
          <span className="truncate">Discount</span>
        </Button>
        <Button
          size="secondary"
          icon={<Printer size={22} />}
          onClick={onBillPrint}
          className={secondaryBtnClass}
        >
          <span className="truncate">Print</span>
        </Button>
        <Button
          size="secondary"
          icon={<Pause size={22} />}
          onClick={onHoldBill}
          className={secondaryBtnClass}
        >
          <span className="truncate">Hold Bill</span>
        </Button>

        <div className={`relative min-w-0 w-full md:flex-1 ${moreOpen ? 'z-50' : ''}`}>
          <Button
            size="secondary"
            icon={<MoreHorizontal size={22} />}
            onClick={() => setMoreOpen((v) => !v)}
            className={[
              secondaryBtnClass,
              moreOpen ? 'border-salon-primary/50 bg-salon-primary-light/40' : '',
            ].join(' ')}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            aria-controls={moreOpen ? menuId : undefined}
          >
            <span className="truncate">More</span>
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
                  'border border-salon-border bg-white',
                  'shadow-[0_8px_28px_rgba(31,17,20,0.14),0_2px_8px_rgba(31,17,20,0.06)]',
                ].join(' ')}
                style={{ animation: 'fadeIn 140ms ease-out' }}
              >
                <ul className="m-0 list-none divide-y divide-salon-border/80 p-0">
                  {moreItems.map((item) => (
                    <li key={item.id} role="none">
                      <MoreMenuRow
                        item={item}
                        onActivate={() => handleMoreSelect(item)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

        <div className="flex gap-2 md:gap-3">
        <Button
          variant="secondary"
          size="primary"
          icon={<Save size={24} />}
          onClick={onSaveBill}
          className="min-w-0 flex-[1] text-base sm:text-lg md:text-xl [&>svg]:size-5 sm:[&>svg]:size-6"
        >
          <span className="truncate">Save Bill</span>
        </Button>
        <Button
          variant="primary"
          size="primary"
          disabled={settlementDisabled}
          onClick={onSettlement}
          className="min-w-0 flex-[1.5] justify-between px-3 sm:px-5 [&>svg]:size-5 sm:[&>svg]:size-6"
        >
          <span className="truncate">Settlement</span>
          <ArrowRight size={26} className="shrink-0" />
        </Button>
      </div>
    </div>
  )
}
