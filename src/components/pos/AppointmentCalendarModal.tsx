import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Button from '../common/Button'
import IconButton from '../common/IconButton'
import { toDateKey, addDays, formatDateLabel } from '../../utils/appointmentDate'

type CalendarView = 'day' | 'week' | 'month'
const stylists = ['Jessica', 'David', 'Mia', 'Ava']
const timeSlots = [
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
  '7:00 PM',
  '8:00 PM',
]
const mockAppointments = [
    {
      id: 1,
      clientName: 'Ananya',
      service: 'Haircut',
      stylist: 'Jessica',
      time: '10:00 AM',
    },
  ]

interface AppointmentCalendarModalProps {
  open: boolean
  onClose: () => void
  onSave?: () => void
}

export default function AppointmentCalendarModal({
  open,
  onClose,
  onSave,
}: AppointmentCalendarModalProps) {
    const [view, setView] = useState<CalendarView>('day')
    const [dateKey, setDateKey] = useState(() => toDateKey())
  
    if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-calendar-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(860px,92dvh)] max-w-[960px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
  <div className="flex min-w-0 items-start gap-3">
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
      <Calendar size={22} />
    </span>
    <div className="min-w-0">
      <h2
        id="appointment-calendar-title"
        className="text-xl font-bold text-salon-text"
      >
        Appointment Calendar
      </h2>
      <p className="mt-0.5 text-sm font-medium text-salon-muted">
        View and manage appointments by stylist
      </p>
    </div>
  </div>
  <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-hidden px-4 py-4 sm:px-5">
<div className="flex flex-wrap items-center gap-2">
    <IconButton aria-label="Previous date" onClick={() => setDateKey((d) => addDays(d, -1))}>
      <ChevronLeft size={18} />
    </IconButton>
    <span className="min-w-[9rem] text-center text-sm font-semibold text-salon-text">
      {formatDateLabel(dateKey)}
    </span>
    <IconButton aria-label="Next date" onClick={() => setDateKey((d) => addDays(d, 1))}>
      <ChevronRight size={18} />
    </IconButton>

    <div className="ml-auto inline-flex rounded-lg border border-salon-border bg-salon-surface p-0.5">
      {(['day', 'week', 'month'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => setView(v)}
          className={[
            'rounded-md px-2.5 py-1 text-xs font-semibold capitalize',
            view === v
              ? 'bg-salon-primary text-white'
              : 'text-salon-muted hover:text-salon-text',
          ].join(' ')}
        >
          {v}
        </button>
      ))}
    </div>
  </div>

  <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-salon-border">
<div
  className="grid min-w-[640px]"
    style={{ gridTemplateColumns: `72px repeat(${stylists.length}, minmax(120px, 1fr))` }}
  >
    <div className="sticky top-0 z-10 border-b border-r border-salon-border bg-salon-surface px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-salon-muted">
      Time
    </div>
    {stylists.map((stylist) => (
      <div
        key={stylist}
        className="sticky top-0 z-10 border-b border-r border-salon-border bg-salon-surface px-2 py-2 text-center text-sm font-semibold text-salon-text"
      >
        {stylist}
      </div>
    ))}

    {timeSlots.map((slot) => (
      <div key={slot} className="contents">
        <div className="border-b border-r border-salon-border px-2 py-3 text-xs font-medium text-salon-muted">
          {slot}
        </div>
        {stylists.map((stylist) => {
  const appt = mockAppointments.find(
    (a) => a.stylist === stylist && a.time === slot,
  )

  return (
    <div
      key={`${slot}-${stylist}`}
      className="h-14 border-b border-r border-salon-border bg-white p-1"
    >
      {appt ? (
        <div className="h-full rounded-lg bg-salon-primary/10 px-2 py-1 ring-1 ring-salon-primary/15">
          <p className="truncate text-[11px] font-semibold text-salon-primary">
            {appt.clientName} — {appt.service}
          </p>
          <p className="text-[10px] text-salon-muted">{appt.time}</p>
        </div>
      ) : null}
    </div>
  )
})}
      </div>
    ))}
  </div>
</div>
</div>

<footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
  <Button variant="secondary" size="compact" fullWidth onClick={onClose}>
    Cancel
  </Button>
  <Button variant="primary" size="compact" fullWidth onClick={onSave ?? onClose}>
    Save Changes
  </Button>
</footer>
      </div>
    </div>
  )
}