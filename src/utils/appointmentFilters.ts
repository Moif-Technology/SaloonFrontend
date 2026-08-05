import type { Appointment, AppointmentFilters } from '../types/appointment'
import { toDateKey } from './appointmentDate'

export function filterAppointments(
  items: Appointment[],
  filters: AppointmentFilters,
  now = new Date(),
): Appointment[] {
  const today = toDateKey(now)
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return items
    .filter((a) => {
      // Date selector is source of truth for which day is shown
      if (a.date !== filters.date) return false

      if (filters.stylistId !== 'all' && a.stylistId !== filters.stylistId) {
        return false
      }

      if (filters.listFilter === 'completed' && a.status !== 'completed') return false
      if (filters.listFilter === 'cancelled' && a.status !== 'cancelled') return false
      if (filters.listFilter === 'upcoming') {
        if (a.status === 'cancelled' || a.status === 'completed') return false
        if (a.date < today) return false
        if (a.date === today) {
          const [hh, mm] = a.time.split(':').map(Number)
          if (hh * 60 + mm < nowMinutes) return false
        }
      }
      // listFilter === 'today' → only date match (all statuses that day)

      const q = filters.search.trim().toLowerCase()
      if (q) {
        const name = a.customerName.toLowerCase()
        const mobile = (a.mobile ?? '').replace(/\s/g, '')
        const qDigits = q.replace(/\s/g, '')
        if (!name.includes(q) && !mobile.includes(qDigits)) return false
      }

      return true
    })
    .sort((a, b) => a.time.localeCompare(b.time))
}

/** Count badge: non-cancelled appointments for a given day (matches header “Appt”) */
export function countDayAppointments(items: Appointment[], dateKey: string): number {
  return items.filter((a) => a.date === dateKey && a.status !== 'cancelled').length
}

export function uniqueStylists(items: Appointment[]): { id: string; name: string }[] {
  const map = new Map<string, string>()
  for (const a of items) {
    if (a.stylistId && a.stylistName) map.set(a.stylistId, a.stylistName)
  }
  return [...map.entries()].map(([id, name]) => ({ id, name }))
}