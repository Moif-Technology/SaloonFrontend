/** POS appointment status — labels match cashier workflow */
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'completed'
  | 'cancelled'

export type AppointmentListFilter =
  | 'today'
  | 'upcoming'
  | 'completed'
  | 'cancelled'

export interface AppointmentServiceRef {
  productId: string | number
  name: string
  price: number
  qty: number
}

export interface Appointment {
  id: string
  /** Local calendar date YYYY-MM-DD */
  date: string
  /** Display / sort time HH:mm (24h) */
  time: string
  customerId?: string
  customerName: string
  mobile?: string
  services: AppointmentServiceRef[]
  stylistId?: string
  stylistName?: string
  status: AppointmentStatus
  notes?: string
  /** Set when converted into the active bill (dedupe) */
  loadedIntoBill?: boolean
}

export interface AppointmentFilters {
  date: string // YYYY-MM-DD
  listFilter: AppointmentListFilter
  search: string
  stylistId: string | 'all'
}