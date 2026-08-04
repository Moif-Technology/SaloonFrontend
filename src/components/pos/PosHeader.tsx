import { Menu, User, CalendarDays, MoreVertical } from 'lucide-react'

interface PosHeaderProps {
  time: string
  customerLabel: string
  onMenu: () => void
  onCustomer: () => void
  onAppointment: () => void
  onMore: () => void
}

export default function PosHeader({
  time,
  customerLabel,
  onMenu,
  onCustomer,
  onAppointment,
  onMore,
}: PosHeaderProps) {
  return (
    <header className="flex items-center justify-between bg-salon-primary text-white px-5 h-16 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenu}
          aria-label="Menu"
          className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/10"
        >
          <Menu size={26} />
        </button>
        <h1 className="text-[26px] font-bold tracking-wide">SALON POS</h1>
      </div>

      <div className="text-lg font-semibold tabular-nums">{time}</div>

      <div className="flex items-center gap-2">
        <button
          onClick={onCustomer}
          className="flex items-center gap-2 h-11 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-medium"
        >
          <User size={20} />
          {customerLabel}
        </button>
        <button
          onClick={onAppointment}
          className="flex items-center gap-2 h-11 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-lg font-medium"
        >
          <CalendarDays size={20} />
          Appt
        </button>
        <button
          onClick={onMore}
          aria-label="More options"
          className="flex items-center justify-center w-11 h-11 rounded-lg hover:bg-white/10"
        >
          <MoreVertical size={22} />
        </button>
      </div>
    </header>
  )
}
