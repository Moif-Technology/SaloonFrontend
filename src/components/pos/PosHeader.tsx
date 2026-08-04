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
    <header className="relative flex items-center justify-between bg-gradient-to-b from-salon-primary/85 to-salon-primary-dark/85 backdrop-blur-xl text-white px-3 sm:px-5 h-14 sm:h-16 shrink-0 z-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_24px_rgba(121,7,40,0.25)] after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:pointer-events-none">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenu}
          aria-label="Menu"
          className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl transition-colors hover:bg-white/15 active:bg-white/20 shrink-0"
        >
          <Menu size={22} />
        </button>
        <h1 className="text-lg sm:text-xl lg:text-[30px] font-bold tracking-wide whitespace-nowrap">
          SALON POS
        </h1>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-base lg:text-lg font-semibold tabular-nums">
        {time}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onCustomer}
          className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-2.5 sm:px-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-white/20 active:bg-white/25 text-sm sm:text-lg font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <User size={17} />
          <span className="hidden sm:inline">{customerLabel}</span>
        </button>
        <button
          onClick={onAppointment}
          className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-2.5 sm:px-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-white/20 active:bg-white/25 text-sm sm:text-lg font-medium transition-colors whitespace-nowrap shrink-0"
        >
          <CalendarDays size={17} />
          <span className="hidden sm:inline">Appt</span>
        </button>
        <button
          onClick={onMore}
          aria-label="More options"
          className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl transition-colors hover:bg-white/15 active:bg-white/20 shrink-0"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  )
}
