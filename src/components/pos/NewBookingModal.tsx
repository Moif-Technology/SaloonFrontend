import { useEffect, useState } from 'react'
import { CalendarPlus, X } from 'lucide-react'
import Button from '../common/Button'

export interface NewBookingModalProps {
    open: boolean
    onClose: () => void
    onCreate?: (values: {
        date: string
        time: string
        stylist: string
        clientName: string
        service: string
    }) => void
    initialDate?: string
    initialTime?: string
    initialStylist?: string
    timeSlots?: string[]
    stylists?: string[]
}

const DEFAULT_TIME_SLOTS = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
    '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM',
]

const DEFAULT_STYLISTS = ['Jessica', 'David', 'Mia', 'Ava']

export default function NewBookingModal({
    open,
    onClose,
    onCreate,
    initialDate = '2026-08-19',
    initialTime = '10:00 AM',
    initialStylist = 'David',
    timeSlots = DEFAULT_TIME_SLOTS,
    stylists = DEFAULT_STYLISTS,
}: NewBookingModalProps) {
    const [date, setDate] = useState(initialDate)
    const [time, setTime] = useState(initialTime)
    const [stylist, setStylist] = useState(initialStylist)
    const [clientName, setClientName] = useState('')
    const [service, setService] = useState('Haircut')
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        if (!open) return
        setDate(initialDate)
        setTime(initialTime)
        setStylist(initialStylist)
        setClientName('')
        setService('Haircut')
        setSubmitted(false)
    }, [open, initialDate, initialTime, initialStylist,])

    if (!open) return null

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-booking-title"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
                {/* Header */}
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
                                    <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
                            <CalendarPlus size={22} />
                        </span>
                        <div className="min-w-0">
                            <h2 id="new-booking-title" className="text-xl font-bold text-salon-text">
                                New Booking
                            </h2>
                            <p className="mt-0.5 text-sm font-medium text-salon-muted">
                                Schedule a new appointment
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

                {/* Body */}
                <div className="min-h-0 flex-1 overflow-auto bg-slate-50/80 px-5 py-4">
                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-salon-text">
                            Date
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="mt-1 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary"
                            />
                        </label>

                        <label className="block text-sm font-semibold text-salon-text">
                            Time
                            <select
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="mt-1 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary"
                            >
                                {timeSlots.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </label>

                        <label className="block text-sm font-semibold text-salon-text">
                            Stylist
                            <select
                                value={stylist}
                                onChange={(e) => setStylist(e.target.value)}
                                className="mt-1 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary"
                            >
                                {stylists.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </label>
                        <label className="block text-sm font-semibold text-salon-text">
    Client Name
    <input
        type="text"
        value={clientName}
        onChange={(e) => setClientName(e.target.value)}
        placeholder="e.g. David"
        className={[
            'mt-1 h-12 w-full rounded-xl border-2 bg-white px-3 text-base font-medium outline-none',
            submitted && !clientName.trim()
                ? 'border-red-400 focus:border-red-500'
                : 'border-salon-border focus:border-salon-primary',
        ].join(' ')}
    />
    {submitted && !clientName.trim() && (
        <p className="mt-1 text-xs font-medium text-red-500">Client name is required</p>
    )}
</label>

                        <label className="block text-sm font-semibold text-salon-text">
                            Service
                            <input
                                type="text"
                                value={service}
                                onChange={(e) => setService(e.target.value)}
                                placeholder="e.g. Haircut"
                                className="mt-1 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary"
                            />
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
                    <Button variant="secondary" size="compact" fullWidth onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="compact"
                        fullWidth
                        onClick={() => {
                            setSubmitted(true)
                            if (!clientName.trim()) return
                            onCreate?.({ date, time, stylist, clientName: clientName.trim(), service: service.trim() || 'Service' })
                            onClose()
                          }}
                    >
                        Create Booking
                    </Button>
                </footer>
            </div>
        </div>
    )
}