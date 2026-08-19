import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import Button from '../common/Button'
import IconButton from '../common/IconButton'
import { useSnackbar } from '../../context/SnackbarContext'
import { toDateKey, addDays, formatDateLabel } from '../../utils/appointmentDate'
import NewBookingModal from './NewBookingModal'
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

interface AppointmentCalendarModalProps {
  open: boolean
  onClose: () => void
  onSave?: () => void
}

export default function AppointmentCalendarModal({
  open,
  onClose,
  
}: AppointmentCalendarModalProps) {
  const { showSnackbar } = useSnackbar()
  const [appointments, setAppointments] = useState([
    { id: 1, clientName: 'Ananya', service: 'Haircut', stylist: 'Jessica', time: '10:00 AM' },
  ])
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
 
const [view, setView] = useState<CalendarView>('day')
  const [dateKey, setDateKey] = useState(() => toDateKey())
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [slotDraft, setSlotDraft] = useState<{
    date: string
    time: string
    stylist: string
  } | null>(null)

  useEffect(() => {
    if (!showToast) return
    const timer = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timer)
  }, [showToast])
  
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

  {view === 'day' && (
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
            const appt = appointments.find(
              (a) => a.stylist === stylist && a.time === slot,
            )
            return (
              <div
                key={`${slot}-${stylist}`}
                className={[
                  'relative h-14 border-b border-r border-salon-border p-1',
                  appt ? 'bg-white' : 'group cursor-pointer bg-white hover:bg-rose-50/70',
                ].join(' ')}
                onClick={
                  appt
                    ? undefined
                    : () => {
                        setSlotDraft({ date: dateKey, time: slot, stylist })
                        setNewBookingOpen(true)
                      }
                }
              >
                {appt ? (
                  <div className="h-full rounded-lg bg-salon-primary/10 px-2 py-1 ring-1 ring-salon-primary/15">
                    <p className="truncate text-[11px] font-semibold text-salon-primary">
                      {appt.clientName} — {appt.service}
                    </p>
                    <p className="text-[10px] text-salon-muted">{appt.time}</p>
                  </div>
                ) : (
                  <span
                    className="pointer-events-none absolute inset-0 flex items-center justify-center text-salon-primary/35 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </span>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )}

 
    {view === 'week' && (() => {
      const [y, m, d] = dateKey.split('-').map(Number)
      const selected = new Date(y, m - 1, d)
      const dow = selected.getDay() // 0=Sun
      const weekStart = new Date(selected)
      weekStart.setDate(selected.getDate() - dow)
      const weekDays = Array.from({ length: 7 }, (_, i) => {
        const dt = new Date(weekStart)
        dt.setDate(weekStart.getDate() + i)
        return dt
      })
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return (
        <div
          className="grid min-w-[640px]"
          style={{ gridTemplateColumns: `72px repeat(7, minmax(100px, 1fr))` }}
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 border-b border-r border-salon-border bg-salon-surface px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-salon-muted">
            Time
          </div>
          {weekDays.map((dt, i) => (
            <div
              key={i}
              className="sticky top-0 z-10 border-b border-r border-salon-border bg-salon-surface px-2 py-2 text-center text-sm font-semibold text-salon-text"
            >
              <span className="block text-[11px] font-normal text-salon-muted">{dayLabels[dt.getDay()]}</span>
              {dt.getDate()}
            </div>
          ))}
    
          {/* Time slot rows */}
          {timeSlots.map((slot) => (
            <div key={slot} className="contents">
              <div className="border-b border-r border-salon-border px-2 py-3 text-xs font-medium text-salon-muted">
                {slot}
              </div>
              {weekDays.map((dt, i) => {
                const dk = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`
                const dayAppts = appointments.filter((a) => a.time === slot)
                return (
                  <div
                    key={i}
                    className="relative h-14 border-b border-r border-salon-border p-1 group cursor-pointer bg-white hover:bg-rose-50/70"
                    onClick={() => {
                      setDateKey(dk)
                      setSlotDraft({ date: dk, time: slot, stylist: stylists[0] })
                      setNewBookingOpen(true)
                    }}
                  >
                    {dayAppts.length > 0 && dk === dateKey ? (
                      <div className="h-full rounded-lg bg-salon-primary/10 px-2 py-1 ring-1 ring-salon-primary/15">
                        <p className="truncate text-[11px] font-semibold text-salon-primary">
                          {dayAppts[0].clientName} — {dayAppts[0].service}
                        </p>
                      </div>
                    ) : (
                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-salon-primary/35 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                        <Plus size={14} strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )
    })()}
  

  {view === 'month' && (() => {
  const [y, m] = dateKey.split('-').map(Number)
  const firstDay = new Date(y, m - 1, 1).getDay()
  const daysInMonth = new Date(y, m, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1
  )
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return (
    <div className="p-3">
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-salon-border">
        {dayLabels.map((dl) => (
          <div key={dl} className="bg-salon-surface px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-salon-muted">
            {dl}
          </div>
        ))}
        {cells.map((day, i) => {
          const dk = day
            ? `${String(y).padStart(4,'0')}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            : null
          const hasAppt = dk
            ? appointments.some((a) => a.time && dk === dateKey && day !== null)
            : false
          return (
            <div
              key={i}
              className={[
              'min-h-[80px] bg-white p-2.5 text-xs flex flex-col',
                day ? 'cursor-pointer hover:bg-rose-50/60' : 'bg-salon-surface/40',
                dk === dateKey ? 'ring-2 ring-inset ring-salon-primary/40' : '',
              ].join(' ')}
              onClick={() => { if (dk) setDateKey(dk) }}
            >
              {day && (
                <>
                  <span className={[
  'mb-1 ml-auto flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold',
  dk === dateKey ? 'bg-salon-primary text-white' : 'text-salon-text',
].join(' ')}>
                    {day}
                  </span>
                  {hasAppt && (
                    <div className="mt-1 truncate rounded bg-salon-primary/10 px-1 py-0.5 text-[10px] font-semibold text-salon-primary ring-1 ring-salon-primary/15">
                      {appointments.find(() => dk === dateKey)?.clientName}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
})()}

</div>
     
      
<footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
        <Button variant="secondary" size="compact" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" fullWidth onClick={() => { showSnackbar('Changes saved successfully', 'success'); onClose() }}>
  Save Changes
</Button>
      </footer>
      </div>  
      </div>   {/* ← line ~291: closes white calendar card */}

      <NewBookingModal
        open={newBookingOpen}
        onClose={() => {
          setNewBookingOpen(false)
          setSlotDraft(null)
        }}
        initialDate={slotDraft?.date}
        initialTime={slotDraft?.time}
        initialStylist={slotDraft?.stylist}
        timeSlots={timeSlots}
        stylists={stylists}
        onCreate={(values) => {
          setAppointments((prev) => [
            ...prev,
            {
              id: Date.now(),
              clientName: values.clientName,
              service: values.service,
              stylist: values.stylist,
              time: values.time,
            },
          ])
          showSnackbar(
            `Booking created for ${values.clientName} at ${values.time}`,
            'success',
          )
          setNewBookingOpen(false)
          setSlotDraft(null)
        }}
      />
          
          {showToast && (
  <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-[#83263c] bg-[#6b1d2f] px-4 py-3 shadow-xl animate-[slideUp_0.25s_ease-out]">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
    <p className="text-[12px] font-medium text-white">{toastMessage}</p>
  </div>
)}
</div>    
  )
}