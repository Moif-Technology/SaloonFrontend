import type { LucideIcon } from 'lucide-react'
import type { AppliedDiscount } from './discount'

export interface ServiceGroup {
  id: string
  name: string
  icon: LucideIcon
}

export interface Product {
  id: string
  groupId: string
  name: string
  price: number
  icon: LucideIcon
}

export interface BillItem {
  id: string
  productId: string
  name: string
  qty: number
  price: number
  appointmentId?: string
  stylistName?: string
}

export interface BillTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

/** Snapshot of a cart parked from the POS billing screen */
export interface HeldBill {
  id: string
  billNo: string
  heldAt: string // ISO timestamp
  note: string
  customerName: string
  stylistName: string
  items: BillItem[]
  appliedDiscount: AppliedDiscount | null
  appointmentId: string | null
  subtotal: number
  discount: number
  total: number
}
