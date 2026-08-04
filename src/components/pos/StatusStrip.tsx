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
      <div className="flex items-center gap-1.5">
        <span className="relative flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-salon-primary to-salon-primary-dark text-white text-[10px] sm:text-xs font-bold">
          {staffInitial}
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-salon-success ring-2 ring-white" />
        </span>
        <span className="font-semibold text-salon-text hidden xs:inline">{staffName}</span>
      </div>
      <span className="font-medium tabular-nums hidden sm:inline">Bill No: {billNo}</span>
      <div className="flex items-center gap-2 sm:gap-3 tabular-nums">
        <span className="hidden sm:inline">{date}</span>
        <span>{time}</span>
        <Wifi size={14} />
      </div>
    </footer>
  )
}
