import { Wifi, BatteryFull } from 'lucide-react'

interface StatusStripProps {
  staffInitial: string
  staffName: string
  billNo: string
  date: string
  time: string
}

export default function StatusStrip({ staffInitial, staffName, billNo, date, time }: StatusStripProps) {
  return (
    <footer className="flex items-center justify-between px-5 h-10 text-sm text-salon-muted shrink-0">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-salon-primary text-white text-xs font-bold">
          {staffInitial}
        </span>
        <span className="font-medium">{staffName}</span>
      </div>
      <span>Bill No: {billNo}</span>
      <div className="flex items-center gap-3">
        <span>{date}</span>
        <span>{time}</span>
        <Wifi size={16} />
        <BatteryFull size={16} />
      </div>
    </footer>
  )
}
