import { useState, useMemo } from 'react'
import { Clock, Search, X } from 'lucide-react'
import Button from '../common/Button'
import { useSnackbar } from '../../context/SnackbarContext'

type UpcomingBooking = {
  id: string
  bookingRef: string
  dateTime: string
  clientName: string
  phone: string
  service: string
  staff: string
  status: string
}

const MOCK_BOOKINGS: UpcomingBooking[] = [
  {
    id: '1',
    bookingRef: 'BK-1042',
    dateTime: '18 Aug 2026, 10:30 AM',
    clientName: 'Emily Watson',
    phone: '555-0142',
    service: 'Haircut & Blow Dry',
    staff: 'Jessica',
    status: 'upcoming',
  },
  {
    id: '2',
    bookingRef: 'BK-1043',
    dateTime: '18 Aug 2026, 1:00 PM',
    clientName: 'Jessica Taylor',
    phone: '555-0188',
    service: 'Colour & Highlights',
    staff: 'Mia',
    status: 'upcoming',
  },
  {
    id: '3',
    bookingRef: 'BK-1044',
    dateTime: '18 Aug 2026, 3:15 PM',
    clientName: 'Brian Adams',
    phone: '555-0194',
    service: 'Beard Trim',
    staff: 'David',
    status: 'upcoming',
  },
]

interface UpcomingBookingsModalProps {
  open: boolean
  onClose: () => void
  onCheckIn?: (booking: UpcomingBooking) => void
}
export default function UpcomingBookingsModal({
  open,
  onClose,
  onCheckIn,
}: UpcomingBookingsModalProps) {
  const [search, setSearch] = useState('')
const [bookings, setBookings] = useState(MOCK_BOOKINGS)
const { showSnackbar } = useSnackbar()
const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'custom'>('today')

function handleCheckIn(bookingRef: string) {
  const booking = bookings.find((item) => item.bookingRef === bookingRef)
  if (!booking || booking.status === 'checked in') return

  setBookings((prev) =>
    prev.map((item) =>
      item.bookingRef === bookingRef ? { ...item, status: 'checked in' } : item,
    ),
  )

  onCheckIn?.(booking)
  showSnackbar(`${booking.clientName} checked in successfully`, 'success')
}

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  function isDueNow(dateTime: string): boolean {
    const parsed = new Date(dateTime.replace(',', ''))
    if (isNaN(parsed.getTime())) return false
    const now = Date.now()
    const diff = parsed.getTime() - now
    return diff >= 0 && diff <= 15 * 60 * 1000
  }

  const q = search.trim().toLowerCase()
  const visible = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        b.clientName.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
      if (!matchesSearch) return false
      if (dateFilter === 'today') return b.dateTime.startsWith(todayStr)
      if (dateFilter === 'tomorrow') return b.dateTime.startsWith(tomorrowStr)
      return true // 'custom' shows all (no extra picker yet)
    })
  }, [bookings, q, dateFilter, todayStr, tomorrowStr])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upcoming-bookings-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Clock size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="upcoming-bookings-title"
                className="text-xl font-bold text-salon-text"
              >
                Upcoming Bookings
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                View and check-in scheduled client appointments
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

        <div className="flex shrink-0 border-b border-salon-border px-5 py-3">
          <label className="relative min-w-0 flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client name or phone..."
              className="h-12 w-full rounded-xl border-2 border-salon-border bg-white py-2 pl-10 pr-3 text-base font-medium outline-none focus:border-salon-primary"
            />
          </label>
          <div className="ml-3 flex shrink-0 gap-1.5">
            {(['today', 'tomorrow', 'custom'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setDateFilter(f)}
                className={`h-10 rounded-lg px-3 text-xs font-semibold capitalize transition-colors ${dateFilter === f
                    ? 'bg-salon-primary text-white'
                    : 'border border-salon-border bg-white text-salon-muted hover:bg-salon-surface'
                  }`}
              >
                {f === 'today' ? 'Today' : f === 'tomorrow' ? 'Tomorrow' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3 md:px-5">
          {visible.length === 0 ? (
            <p className="py-12 text-center text-lg font-medium text-salon-muted">
              No bookings found.
            </p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                  <th className="px-2 py-2">Booking Ref</th>
                  <th className="px-2 py-2">Date & Time</th>
                  <th className="px-2 py-2">Client Name</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Assigned Staff</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((b) => (
                  <tr key={b.id} className="border-b border-salon-border">
                    <td className="px-2 py-2 font-semibold text-salon-text">{b.bookingRef}</td>
                    <td className="px-2 py-2 text-salon-text">{b.dateTime}</td>
                    <td className="px-2 py-2 font-medium text-salon-text">{b.clientName}</td>
                    <td className="px-2 py-2 text-salon-muted">{b.phone}</td>
                    <td className="px-2 py-2 text-salon-text">{b.service}</td>
                    <td className="px-2 py-2 text-salon-text">{b.staff}</td>
                    <td className="px-2 py-2">
                      {isDueNow(b.dateTime) ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Due Now
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-salon-primary-light px-2.5 py-0.5 text-xs font-semibold capitalize text-salon-primary">
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-right">
  {b.status === 'checked in' ? (
    <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-green-100 px-3 text-xs font-semibold text-green-700">
      ✓ Checked In
    </span>
  ) : (
    <button
      type="button"
      onClick={() => handleCheckIn(b.bookingRef)}
      className="h-8 rounded-lg bg-salon-primary px-3 text-xs font-semibold text-white hover:opacity-90"
    >
      Check-in
    </button>
  )}
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            fullWidth
            onClick={onClose}
          >
            Close
          </Button>
        </footer>
      </div>
    </div>
  )
}
