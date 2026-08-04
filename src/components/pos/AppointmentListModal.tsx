import { useEffect, useMemo, useState } from 'react'
import { X, Search, Clock, User, Phone, Scissors } from 'lucide-react'
import Button from '../common/Button'
import type {
  Appointment,
  AppointmentFilters,
  AppointmentListFilter,
  AppointmentStatus,
} from '../../types/appointment'
import {
  filterAppointments,
  uniqueStylists,
} from '../../utils/appointmentFilters'
import { toDateKey, formatTime12, formatDateLabel } from '../../utils/appointmentDate'
import { statusLabel, statusBadgeClass } from '../../utils/appointmentStatusUi'

export interface AppointmentListModalProps {
  open: boolean
  onClose: () => void
  appointments: Appointment[]
  loading?: boolean
  onSelect: (appointment: Appointment) => void
  onStatusChange?: (id: string, status: AppointmentStatus) => void
  activeAppointmentId?: string | null
  loadedAppointmentIds: Set<string>
}

const FILTER_CHIPS: { id: AppointmentListFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
]

function defaultFilters(): AppointmentFilters {
  return {
    date: toDateKey(),
    listFilter: 'today',
    search: '',
    stylistId: 'all',
  }
}

export default function AppointmentListModal({
  open,
  onClose,
  appointments,
  loading = false,
  onSelect,
  loadedAppointmentIds,
}: AppointmentListModalProps) {
  const [filters, setFilters] = useState<AppointmentFilters>(defaultFilters)

  useEffect(() => {
    if (!open) return
    setFilters(defaultFilters())
  }, [open])

  const stylists = useMemo(() => uniqueStylists(appointments), [appointments])

  const visible = useMemo(
    () => filterAppointments(appointments, filters),
    [appointments, filters],
  )

  if (!open) return null

  const titleDate = formatDateLabel(filters.date)
  const isToday = filters.date === toDateKey()

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-list-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* Header */}
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-salon-border px-5 py-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="appointment-list-title"
                className="text-xl font-bold text-salon-text"
              >
                {isToday ? "Today's Appointments" : 'Appointments'}
              </h2>
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-salon-primary px-2 text-sm font-bold text-white tabular-nums">
                {visible.length}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              {titleDate}
            </p>
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

        {/* Filters */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-salon-border px-5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
              />
              <input
                type="search"
                value={filters.search}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, search: e.target.value }))
                }
                placeholder="Customer name or mobile"
                className="h-12 w-full rounded-xl border-2 border-salon-border bg-white py-2 pl-10 pr-3 text-base font-medium outline-none focus:border-salon-primary"
              />
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  date: e.target.value || toDateKey(),
                }))
              }
              className="h-12 shrink-0 rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary sm:w-[180px]"
            />
            <select
              value={filters.stylistId}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  stylistId: e.target.value as AppointmentFilters['stylistId'],
                }))
              }
              className="h-12 shrink-0 rounded-xl border-2 border-salon-border bg-white px-3 text-base font-medium outline-none focus:border-salon-primary sm:w-[180px]"
            >
              <option value="all">All stylists</option>
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {FILTER_CHIPS.map((chip) => {
              const active = filters.listFilter === chip.id
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() =>
                    setFilters((f) => ({ ...f, listFilter: chip.id }))
                  }
                  className={[
                    'h-11 min-w-[96px] rounded-xl px-4 text-base font-semibold transition-colors',
                    active
                      ? 'bg-salon-primary text-white'
                      : 'border-2 border-salon-border bg-white text-salon-text hover:bg-salon-primary-light/50',
                  ].join(' ')}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-5">
          {loading ? (
            <p className="py-12 text-center text-lg font-medium text-salon-muted">
              Loading appointments…
            </p>
          ) : visible.length === 0 ? (
            <p className="py-12 text-center text-lg font-medium text-salon-muted">
              No appointments for this day / filter.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {visible.map((a) => {
                const alreadyLoaded =
                  loadedAppointmentIds.has(a.id) || a.loadedIntoBill === true
                const blocked =
                  alreadyLoaded ||
                  a.status === 'cancelled' ||
                  a.status === 'completed'

                return (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-salon-border bg-salon-bg/40 p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-lg font-bold tabular-nums text-salon-text">
                            <Clock size={18} className="text-salon-primary" />
                            {formatTime12(a.time)}
                          </span>
                          <span
                            className={[
                              'rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
                              statusBadgeClass(a.status),
                            ].join(' ')}
                          >
                            {statusLabel(a.status)}
                          </span>
                        </div>

                        <p className="flex items-center gap-2 text-lg font-semibold text-salon-text">
                          <User size={18} className="shrink-0 text-salon-muted" />
                          {a.customerName}
                        </p>

                        {a.mobile ? (
                          <p className="flex items-center gap-2 text-base font-medium text-salon-muted">
                            <Phone size={16} className="shrink-0" />
                            {a.mobile}
                          </p>
                        ) : null}

                        <p className="flex items-start gap-2 text-base text-salon-text">
                          <Scissors
                            size={16}
                            className="mt-0.5 shrink-0 text-salon-muted"
                          />
                          <span>
                            {a.services.map((s) => s.name).join(', ')}
                          </span>
                        </p>

                        <p className="text-sm font-medium text-salon-muted">
                          Stylist: {a.stylistName ?? '—'}
                        </p>

                        {a.notes ? (
                          <p className="text-sm text-salon-muted">
                            Note: {a.notes}
                          </p>
                        ) : null}
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="compact"
                        disabled={blocked}
                        onClick={() => onSelect(a)}
                        className="h-12 min-w-[160px] shrink-0 self-stretch md:self-center"
                      >
                        {alreadyLoaded ? 'Already on bill' : 'Convert to Bill'}
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}