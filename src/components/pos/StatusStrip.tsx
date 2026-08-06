import { Wifi } from 'lucide-react'

interface StatusStripProps {
  staffInitial: string
  staffName: string
  billNo: string
  date: string
  time: string
}

export default function StatusStrip({ staffInitial, staffName, billNo, date, time }: StatusStripProps) {
  return (
    <footer className="flex items-center justify-between px-3 sm:px-5 h-8 sm:h-9 text-xs sm:text-sm text-salon-muted shrink-0 border-t border-white/40 bg-white/35 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-salon-primary to-salon-primary-dark text-[10px] font-semibold text-white sm:h-6 sm:w-6 sm:text-xs">
          {staffInitial}
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-salon-success ring-1 ring-white sm:h-2 sm:w-2" />
        </span>
        <span className="truncate text-[15px] font-bold text-salon-text sm:text-base">
          {staffName}
        </span>
      </div>
      <span className="hidden font-medium tabular-nums sm:inline">Bill No: {billNo}</span>
      <div className="flex items-center gap-2 sm:gap-3 tabular-nums">
        <span className="hidden sm:inline">{date}</span>
        <span>{time}</span>
        <Wifi size={14} />
      </div>
    </footer>
  )
}
