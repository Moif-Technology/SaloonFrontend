import type { CustomerPayload } from '../types/customer'

export async function createCustomer(payload: CustomerPayload) {
  // Mock until backend is ready — no real HTTP call
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `tmp-${Date.now()}`,
    name: payload.name.trim(),
    mobile: payload.mobile.replace(/[\s-]/g, ''),
    email: payload.email?.trim() || undefined,
    address: payload.address?.trim() || undefined,
  }
}