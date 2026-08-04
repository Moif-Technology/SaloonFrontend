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
} from 'lucide-react'
import Button from '../common/Button'

interface BottomActionBarProps {
  onDiscount: () => void
  onNote: () => void
  onCustomer: () => void
  onAppointment: () => void
  onHoldBill: () => void
  onBillPrint: () => void
  onSaveBill: () => void
  onQuickCash: () => void
  onCard: () => void
  onQrPay: () => void
  onSettlement: () => void
  settlementDisabled?: boolean
}

export default function BottomActionBar({
  onDiscount,
  onNote,
  onCustomer,
  onAppointment,
  onHoldBill,
  onBillPrint,
  onSaveBill,
  onQuickCash,
  onCard,
  onQrPay,
  onSettlement,
  settlementDisabled,
}: BottomActionBarProps) {
  return (
    <div className="flex flex-col gap-3 bg-white rounded-2xl border border-salon-border p-4">
      <div className="grid grid-cols-6 gap-3">
        <Button size="secondary" icon={<Percent size={22} />} onClick={onDiscount}>
          Discount
        </Button>
        <Button size="secondary" icon={<MessageSquare size={22} />} onClick={onNote}>
          Note
        </Button>
        <Button size="secondary" icon={<User size={22} />} onClick={onCustomer}>
          Customer
        </Button>
        <Button size="secondary" icon={<CalendarClock size={22} />} onClick={onAppointment}>
          Appt
        </Button>
        <Button size="secondary" icon={<Pause size={22} />} onClick={onHoldBill}>
          Hold Bill
        </Button>
        <Button size="secondary" icon={<Printer size={22} />} onClick={onBillPrint}>
          Bill Print
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-3">
        <Button
          variant="secondary"
          size="primary"
          icon={<Save size={24} />}
          onClick={onSaveBill}
          className="col-span-2"
        >
          Save Bill
        </Button>
        <Button
          variant="secondary"
          size="primary"
          icon={<Banknote size={24} className="text-salon-success" />}
          onClick={onQuickCash}
          className="col-span-2"
        >
          Quick Cash
        </Button>
        <Button
          variant="secondary"
          size="primary"
          icon={<CreditCard size={24} />}
          onClick={onCard}
          className="col-span-2"
        >
          Card
        </Button>
        <Button
          variant="secondary"
          size="primary"
          icon={<QrCode size={24} className="text-salon-success" />}
          onClick={onQrPay}
          className="col-span-2"
        >
          QR Pay
        </Button>
        <Button
          variant="primary"
          size="primary"
          disabled={settlementDisabled}
          onClick={onSettlement}
          className="col-span-4 justify-between"
        >
          <span className="flex items-center gap-3">Settlement</span>
          <ArrowRight size={26} />
        </Button>
      </div>
    </div>
  )
}
