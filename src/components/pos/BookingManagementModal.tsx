import { ClipboardList, X } from 'lucide-react'
import { useState } from 'react'
import Button from '../common/Button'

export interface BookingManagementModalProps {
  open: boolean
  onClose: () => void
}

const TABS = [
    { id: 'all', label: 'All' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
    { id: 'no-show', label: 'No-Show' },
  ] as const
  
  type BookingTab = (typeof TABS)[number]['id']

  type BookingRow = {
    id: string
    bookingId: string
    clientName: string
    date: string
    service: string
    totalAmount: number
    paymentStatus: string
    bookingChannel: string
    status: Exclude<BookingTab, 'all'>
  }
  
  
  const MOCK_BOOKINGS: BookingRow[] = [
    { id: '1', bookingId: 'BK-1001', clientName: 'Anita Sharma', date: '18-08-2026', service: 'Haircut + Blow Dry', totalAmount: 1800, paymentStatus: 'Paid', bookingChannel: 'Walk-in', status: 'completed' },
    { id: '2', bookingId: 'BK-1002', clientName: 'Rahul Menon', date: '18-08-2026', service: 'Beard Trim', totalAmount: 450, paymentStatus: 'Refunded', bookingChannel: 'Phone', status: 'cancelled' },
    { id: '3', bookingId: 'BK-1003', clientName: 'Priya Nair', date: '17-08-2026', service: 'Keratin Treatment', totalAmount: 4500, paymentStatus: 'Unpaid', bookingChannel: 'App', status: 'no-show' },
    { id: '4', bookingId: 'BK-1004', clientName: 'Meera Joseph', date: '16-08-2026', service: 'Facial', totalAmount: 2200, paymentStatus: 'Paid', bookingChannel: 'Website', status: 'completed' },
  ]
  
  export default function BookingManagementModal({
    open,
    onClose,
  }: BookingManagementModalProps) {
    const [activeTab, setActiveTab] = useState<BookingTab>('all')

    const rows =
      activeTab === 'all'
        ? MOCK_BOOKINGS
        : MOCK_BOOKINGS.filter((b) => b.status === activeTab)
    
    if (!open) return null
  

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-management-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
     <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
  <div className="flex min-w-0 items-start gap-3">
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
      <ClipboardList size={22} />
    </span>
    <div className="min-w-0">
      <h2
        id="booking-management-title"
        className="text-xl font-bold text-salon-text"
      >
        Booking Management
      </h2>
      <p className="mt-0.5 text-sm font-medium text-salon-muted">
        Master control panel for all salon bookings and history
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

{/* Body — scrollable, light gray */}
<div className="min-h-0 flex-1 overflow-auto bg-slate-50/80">
  <div className="flex flex-wrap gap-1.5 px-5 py-2.5">
    {TABS.map((tab) => {
      const active = activeTab === tab.id
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id)}
          className={[
            'h-9 rounded-lg px-3 text-sm font-semibold transition-colors',
            active
              ? 'bg-salon-primary text-white shadow-sm'
              : 'border border-salon-border bg-white text-salon-muted hover:border-salon-primary/40 hover:text-salon-text',
          ].join(' ')}
        >
          {tab.label}
        </button>
      )
    })}
  </div>
  <div className="px-4 pb-3 md:px-5">
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-salon-border text-salon-muted">
                <th className="px-2 py-2 font-semibold">Booking ID</th>
                <th className="px-2 py-2 font-semibold">Client Name</th>
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 font-semibold">Service</th>
                <th className="px-2 py-2 font-semibold">Total Amount</th>
                <th className="px-2 py-2 font-semibold">Payment Status</th>
                <th className="px-2 py-2 font-semibold">Booking Channel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-salon-border text-salon-text">
                  <td className="px-2 py-2 font-semibold">{b.bookingId}</td>
                  <td className="px-2 py-2">{b.clientName}</td>
                  <td className="px-2 py-2 tabular-nums">{b.date}</td>
                  <td className="px-2 py-2">{b.service}</td>
                  <td className="px-2 py-2 tabular-nums">₹{b.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="px-2 py-2">{b.paymentStatus}</td>
                  <td className="px-2 py-2">{b.bookingChannel}</td>
                </tr>
              ))}
            </tbody>
            </table>
  </div>
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
 