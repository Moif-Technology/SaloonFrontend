import { Menu, User, CalendarDays, MoreVertical } from 'lucide-react'

interface PosHeaderProps {
  time: string
  customerLabel: string
  /** How many appointments today (non-cancelled). Shown next to "Appt". */
  appointmentCount?: number
  onMenu: () => void
  onCustomer: () => void
  onAppointment: () => void
  onMore: () => void
}

export default function PosHeader({
  time,
  customerLabel,
  appointmentCount = 0,
  onMenu,
  onCustomer,
  onAppointment,
  onMore,
}: PosHeaderProps) {
  return (
    <header className="relative z-10 flex h-14 shrink-0 items-center justify-between bg-gradient-to-b from-salon-primary/85 to-salon-primary-dark/85 px-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_24px_rgba(121,7,40,0.25)] backdrop-blur-xl after:pointer-events-none after:absolute after:inset-x-0 after:top-0 after:h-1/2 after:bg-gradient-to-b after:from-white/10 after:to-transparent sm:h-16 sm:px-5">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onMenu}
          aria-label="Menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/15 active:bg-white/20 sm:h-11 sm:w-11"
        >
          <Menu size={22} />
        </button>
        <h1 className="whitespace-nowrap text-lg font-bold tracking-wide sm:text-xl lg:text-[30px]">
          SALON POS
        </h1>
      </div>

      <div className="hidden items-center gap-2 text-base font-semibold tabular-nums sm:flex lg:text-lg">
        {time}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          onClick={onCustomer}
          className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/25 bg-white/10 px-2.5 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md transition-colors hover:bg-white/20 active:bg-white/25 sm:h-11 sm:gap-2 sm:px-4 sm:text-lg"
        >
          <User size={17} />
          <span className="hidden sm:inline">{customerLabel}</span>
        </button>

        <button
          type="button"
          onClick={onAppointment}
          aria-label={`Appointments, ${appointmentCount} today`}
          className="flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-white/25 bg-white/10 px-2.5 text-sm font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] backdrop-blur-md transition-colors hover:bg-white/20 active:bg-white/25 sm:h-11 sm:gap-2 sm:px-4 sm:text-lg"
        >
          <CalendarDays size={17} />
          <span className="hidden sm:inline">Appt</span>
          {appointmentCount > 0 && (
            <span className="ml-0.5 min-w-[1.5rem] rounded-md bg-white/25 px-1.5 text-center text-sm font-bold tabular-nums">
              {appointmentCount}
            </span>
          )}
        </button>

        <button
          onClick={onMore}
          aria-label="More options"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors hover:bg-white/15 active:bg-white/20 sm:h-11 sm:w-11"
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  )
}
