import type { Appointment, AppointmentStatus } from '../types/appointment'
import { buildMockAppointments } from '../data/mockAppointments'

/** In-memory store so header + modal stay synchronized in this session */
let store: Appointment[] | null = null

function getStore(): Appointment[] {
  if (!store) store = buildMockAppointments()
  return store
}

export async function fetchAppointments(): Promise<Appointment[]> {
  await new Promise((r) => setTimeout(r, 200))
  // Later: return axios.get('/api/salon-pos/appointments') …
  return getStore().map((a) => ({ ...a, services: a.services.map((s) => ({ ...s })) }))
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  await new Promise((r) => setTimeout(r, 150))
  const list = getStore()
  const idx = list.findIndex((a) => a.id === id)
  if (idx < 0) throw new Error('Appointment not found')
  list[idx] = { ...list[idx], status }
  return { ...list[idx] }
}

export async function markAppointmentLoaded(id: string): Promise<void> {
  const list = getStore()
  const idx = list.findIndex((a) => a.id === id)
  if (idx >= 0) list[idx] = { ...list[idx], loadedIntoBill: true }
}