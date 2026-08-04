import type { LucideIcon } from 'lucide-react'

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
}

export interface BillTotals {
  subtotal: number
  discount: number
  total: number
}
