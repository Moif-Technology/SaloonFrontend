import {
  ArrowRight,
  Save,
  CalendarClock,
  User,
  Percent,
  Printer,
  Pause,
  MoreHorizontal,
} from 'lucide-react'
import Button from '../common/Button'

interface BottomActionBarProps {
  onSettlement: () => void
  onSaveBill: () => void
  onAppointment: () => void
  onCustomer: () => void
  onDiscount: () => void
  onPrint: () => void
  onHoldBill: () => void
  onMore: () => void
  settlementDisabled?: boolean
}

export default function BottomActionBar({
  onSettlement,
  onSaveBill,
  onAppointment,
  onCustomer,
  onDiscount,
  onPrint,
  onHoldBill,
  onMore,
  settlementDisabled,
}: BottomActionBarProps) {
  const label = (text: string) => <span className="hidden lg:inline whitespace-nowrap">{text}</span>

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      <div className="grid grid-cols-[1fr_1fr_1fr_2fr_2fr] items-center gap-1.5 sm:gap-3">
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
          size="primary"
          icon={<Save size={22} />}
          onClick={onSaveBill}
        >
          Save Bill
        </Button>
        <Button
          variant="primary"
          size="primary"
          disabled={settlementDisabled}
          onClick={onSettlement}
          icon={<ArrowRight size={22} />}
        >
          Settlement
        </Button>
      </div>

      <div className="grid grid-cols-[1fr_1fr_1fr_2fr_2fr] items-center gap-1.5 sm:gap-3">
        <Button size="secondary" icon={<Printer size={20} />} onClick={onPrint}>
          {label('Print')}
        </Button>
        <Button size="secondary" icon={<Pause size={20} />} onClick={onHoldBill}>
          {label('Hold Bill')}
        </Button>
        <Button size="secondary" icon={<MoreHorizontal size={20} />} onClick={onMore}>
          {label('More')}
        </Button>
      </div>
    </div>
  )
}
