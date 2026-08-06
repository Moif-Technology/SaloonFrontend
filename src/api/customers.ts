import type { CustomerPayload } from '../types/customer'
import { apiService } from './apiService'

export type SavedCustomer = {
  id: string
  name: string
  mobile: string
  email?: string
  address?: string
}

function toSaved(raw: Record<string, unknown>, payload: CustomerPayload): SavedCustomer {
  return {
    id: String(raw.customerId ?? raw.CustomerID ?? raw.id ?? ''),
    name: String(raw.customerName ?? raw.CustomerName ?? payload.name).trim(),
    mobile: String(raw.mobileNo ?? raw.MobileNo ?? payload.mobile).replace(/[\s-]/g, ''),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
  }
}

export async function createCustomer(payload: CustomerPayload): Promise<SavedCustomer> {
  const raw = await apiService.createCustomer({
    customerName: payload.name.trim(),
    mobileNo: payload.mobile.replace(/[\s-]/g, ''),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
    autoCode: true,
    newBarcode: true,
  })
  return toSaved(raw, payload)
}

export async function updateCustomer(
  id: string,
  payload: CustomerPayload,
): Promise<SavedCustomer> {
  const raw = await apiService.updateCustomer(id, {
    customerName: payload.name.trim(),
    mobileNo: payload.mobile.replace(/[\s-]/g, ''),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
  })
  return toSaved(raw, payload)
}
