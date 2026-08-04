import type { Appointment } from '../types/appointment'
import { toDateKey, addDays } from '../utils/appointmentDate'
import { products } from './mockCatalogue'

function priceOf(productId: string): number {
  return products.find((p) => p.id === productId)?.price ?? 0
}

function nameOf(productId: string): string {
  return products.find((p) => p.id === productId)?.name ?? productId
}

function svc(productId: string, qty = 1) {
  return {
    productId,
    name: nameOf(productId),
    price: priceOf(productId),
    qty,
  }
}

/** Seed list — treat as the only in-app appointment store until real API exists */
export function buildMockAppointments(now = new Date()): Appointment[] {
  const today = toDateKey(now)
  const tomorrow = addDays(today, 1)

  return [
    {
      id: 'appt-1',
      date: today,
      time: '09:30',
      customerId: 'c-1',
      customerName: 'Priya Nair',
      mobile: '9876543210',
      services: [svc('p-haircut'), svc('p-hair-wash')],
      stylistId: 'st-aya',
      stylistName: 'Aya',
      status: 'confirmed',
      notes: 'Regular client',
    },
    {
      id: 'appt-2',
      date: today,
      time: '10:15',
      customerName: 'Rahul Mehta',
      mobile: '9988776655',
      services: [svc('p-beard-trim')],
      stylistId: 'st-sam',
      stylistName: 'Sam',
      status: 'scheduled',
    },
    {
      id: 'appt-3',
      date: today,
      time: '11:00',
      customerName: 'Ananya Krishnan',
      mobile: '9123456780',
      services: [svc('p-facial'), svc('p-clean-up')],
      stylistId: 'st-aya',
      stylistName: 'Aya',
      status: 'arrived',
      notes: 'Allergy: product X',
    },
    {
      id: 'appt-4',
      date: today,
      time: '14:00',
      customerName: 'Vikram S',
      mobile: '9000011122',
      services: [svc('p-keratin')],
      stylistId: 'st-leo',
      stylistName: 'Leo',
      status: 'completed',
    },
    {
      id: 'appt-5',
      date: today,
      time: '15:30',
      customerName: 'Meera Das',
      mobile: '9887766554',
      services: [svc('p-manicure'), svc('p-pedicure')],
      stylistId: 'st-sam',
      stylistName: 'Sam',
      status: 'cancelled',
      notes: 'Rescheduled by client',
    },
    {
      id: 'appt-6',
      date: tomorrow,
      time: '10:00',
      customerName: 'Arjun Patel',
      mobile: '9112233445',
      services: [svc('p-global-colour')],
      stylistId: 'st-leo',
      stylistName: 'Leo',
      status: 'scheduled',
    },
  ]
}