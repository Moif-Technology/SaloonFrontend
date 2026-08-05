import type { LucideIcon } from 'lucide-react'
import type { AppliedDiscount } from './discount'

export interface ServiceGroup {
  id: string
  name: string
  icon: LucideIcon
}

export interface Product {
  /** Real `core.product_master.product_id` — required for job save / settle */
  id: number
  groupId: string
  name: string
  price: number
  icon: LucideIcon
  lineType: 'SERVICE' | 'PRODUCT'
  taxRate?: number
}

export interface BillItem {
  id: string
  productId: number
  name: string
  qty: number
  price: number
  groupId?: number
  taxRate?: number
  lineId?: number
  stylistId?: number
  lineType?: 'SERVICE' | 'PRODUCT' | string
  /** Swetha UI: appointment linkage */
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
  heldAt: string
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
