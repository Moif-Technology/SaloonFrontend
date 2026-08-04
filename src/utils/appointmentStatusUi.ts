import type { AppointmentStatus } from '../types/appointment'

export function statusLabel(status: AppointmentStatus): string {
  const map: Record<AppointmentStatus, string> = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    arrived: 'Arrived',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return map[status]
}

/** Tailwind classes using existing salon palette tokens from index.css */
export function statusBadgeClass(status: AppointmentStatus): string {
  switch (status) {
    case 'scheduled':
      return 'bg-salon-bg text-salon-text border border-salon-border'
    case 'confirmed':
      return 'bg-salon-primary-light text-salon-primary border border-salon-primary/20'
    case 'arrived':
      return 'bg-emerald-50 text-salon-success border border-salon-success/30'
    case 'completed':
      return 'bg-black/5 text-salon-muted border border-salon-border'
    case 'cancelled':
      return 'bg-red-50 text-salon-danger border border-salon-danger/25'
  }
}

