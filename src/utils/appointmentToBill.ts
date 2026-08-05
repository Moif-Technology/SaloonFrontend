import type { Appointment } from '../types/appointment'
import type { BillItem } from '../types/pos'
import { parseProductId } from './posSession'

/**
 * Map appointment services into BillItem[] using appointment service prices
 * (already resolved from catalogue in mock builder).
 */
export function appointmentToBillItems(appt: Appointment): BillItem[] {
  return appt.services.map((s, i) => ({
    id: `bill-${appt.id}-${s.productId}-${i}`,
    productId: parseProductId(s.productId),
    name: s.name,
    qty: s.qty,
    price: s.price,
    lineType: 'SERVICE',
    taxRate: 5,
    appointmentId: appt.id,
    stylistName: appt.stylistName,
  }))
}

/** True if this appointment is already present on the bill */
export function isAppointmentOnBill(
  billItems: BillItem[],
  appointmentId: string,
): boolean {
  return billItems.some((b) => b.appointmentId === appointmentId)
}