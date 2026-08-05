import { useEffect, useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
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
            <ul className="flex flex-col gap-2">
              {visible.map((a) => {
                const alreadyLoaded =
                  loadedAppointmentIds.has(a.id) || a.loadedIntoBill === true
                const blocked =
                  alreadyLoaded ||
                  a.status === 'cancelled' ||
                  a.status === 'completed'
                const serviceNames = a.services.map((s) => s.name).join(', ')

                return (
                  <li
                    key={a.id}
                    className="rounded-xl border border-salon-border bg-salon-bg/40 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        {/* Compact header: time · status · customer */}
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="shrink-0 text-[15px] font-bold tabular-nums leading-none text-salon-primary">
                            {formatTime12(a.time)}
                          </span>
                          <span
                            className={[
                              'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide',
                              statusBadgeClass(a.status),
                            ].join(' ')}
                          >
                            {statusLabel(a.status)}
                          </span>
                          <p className="min-w-0 truncate text-[15px] leading-tight">
                            <span className="font-semibold text-salon-text">
                              {a.customerName}
                            </span>
                            {a.mobile ? (
                              <span className="font-medium text-salon-muted">
                                {' '}
                                • {a.mobile}
                              </span>
                            ) : null}
                          </p>
                        </div>

                        {/* Services + stylist (dense secondary block) */}
                        <p
                          className="mt-1 line-clamp-2 text-sm leading-snug text-salon-text"
                          title={serviceNames}
                        >
                          {serviceNames}
                        </p>
                        <p className="mt-0.5 truncate text-xs font-medium leading-snug text-salon-muted">
                          {a.stylistName ? (
                            <span>Stylist: {a.stylistName}</span>
                          ) : (
                            <span>Stylist: —</span>
                          )}
                          {a.notes ? (
                            <span className="text-salon-muted/80">
                              {' '}
                              · Note: {a.notes}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="primary"
                        size="compact"
                        disabled={blocked}
                        onClick={() => onSelect(a)}
                        className="h-11 min-w-[132px] shrink-0 self-center px-3 text-sm"
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