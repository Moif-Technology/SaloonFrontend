import { useState } from 'react'
import { Clock, Search, X } from 'lucide-react'
import Button from '../common/Button'

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
  const [bookings] = useState(MOCK_BOOKINGS)

  const q = search.trim().toLowerCase()
  const visible = bookings.filter(
    (b) =>
      !q ||
      b.clientName.toLowerCase().includes(q) ||
      b.phone.toLowerCase().includes(q),
  )

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
                      <span className="inline-flex rounded-full bg-salon-primary-light px-2.5 py-0.5 text-xs font-semibold capitalize text-salon-primary">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                    <button
  type="button"
  onClick={() => onCheckIn?.(b)}
  className="h-8 rounded-lg bg-salon-primary px-3 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
  disabled={!onCheckIn}
>
  Check-in
</button>
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
  