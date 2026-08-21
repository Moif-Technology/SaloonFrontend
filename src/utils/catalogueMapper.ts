/**
 * Map `/api/groups` + `/api/products` rows into POS catalogue tiles.
 */
import {
  Scissors,
  Sparkles,
  Flower2,
  Paintbrush,
  Hand,
  Droplets,
  Wand2,
  type LucideIcon,
} from 'lucide-react'
import type { Product, ServiceGroup } from '../types/pos'
import { parseTaxRate } from './taxRate'

const GROUP_ICONS: LucideIcon[] = [
  Scissors,
  Sparkles,
  Paintbrush,
  Wand2,
  Flower2,
  Hand,
  Droplets,
]

export function mapGroupRow(raw: Record<string, unknown>, index = 0): ServiceGroup {
  const id = String(raw.GroupID ?? raw.groupId ?? '').trim()
  const name = String(
    raw.GroupDescription ?? raw.groupDescription ?? raw.GroupCode ?? raw.groupCode ?? `Group ${id}`,
  ).trim()
  return {
    id,
    name: name || `Group ${id}`,
    icon: GROUP_ICONS[index % GROUP_ICONS.length],
  }
}

export function mapProductRow(
  raw: Record<string, unknown>,
  index = 0,
): Product | null {
  const inv =
    raw.inventory && typeof raw.inventory === 'object'
      ? (raw.inventory as Record<string, unknown>)
      : {}

  const id = Number(raw.productId ?? raw.ProductID ?? 0)
  if (!Number.isFinite(id) || id < 1) return null

  const name = String(
    raw.productName ??
      raw.ProductName ??
      raw.ShortDescription ??
      raw.shortName ??
      '',
  ).trim()
  if (!name) return null

  const groupId = String(raw.groupId ?? raw.GroupID ?? '').trim()
  const unitPrice =
    Number(inv.unitPrice ?? raw.unitPrice ?? raw.UnitPrice ?? 0) || 0
  const taxRate = parseTaxRate(
    inv.outputTax1Rate ??
      raw.outputTax1Rate ??
      raw.tax1Rate ??
      raw.Tax1Rate,
  )
  const productType = String(
    raw.productType ?? raw.ProductType ?? raw.LineType ?? '',
  )
    .trim()
    .toUpperCase()
  const lineType: Product['lineType'] =
    productType === 'SERVICE' ? 'SERVICE' : 'PRODUCT'

  return {
    id,
    groupId,
    name,
    price: unitPrice,
    taxRate,
    lineType,
    icon: GROUP_ICONS[index % GROUP_ICONS.length],
  }
}

/** POS-shaped product map (same keys as Saloon-POS `productRowForPos`). */
export function productRowForPos(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return { ProductID: '0', ShortDescription: '', UnitPrice: '0' }
  }
  const m = raw as Record<string, unknown>
  const inv =
    m.inventory && typeof m.inventory === 'object'
      ? (m.inventory as Record<string, unknown>)
      : {}

  const pid = m.productId ?? m.ProductID ?? 0
  const name = String(m.productName ?? m.ProductName ?? '').trim()
  const shortName = String(m.shortName ?? m.ShortDescription ?? '').trim()
  const display = shortName || name
  const unitPrice = inv.unitPrice ?? m.unitPrice ?? 0
  const tax1Rate = parseTaxRate(
    inv.outputTax1Rate ?? m.tax1Rate ?? m.Tax1Rate,
  )
  const groupId = m.groupId ?? m.GroupID ?? 0
  const subGroupId = m.subgroupId ?? m.SubGroupID ?? 0
  const productType = String(m.productType ?? m.ProductType ?? '').trim()
  const lineType = productType.toUpperCase() === 'SERVICE' ? 'SERVICE' : 'PRODUCT'

  return {
    ProductID: `${pid}`,
    ProductCode: String(m.productCode ?? m.ProductCode ?? ''),
    ShortDescription: display,
    ProductName: name,
    Barcode: String(m.barcode ?? ''),
    UnitPrice: `${unitPrice}`,
    Tax1Rate: `${tax1Rate}`,
    GroupID: `${groupId}`,
    SubGroupID: `${subGroupId}`,
    Unit: String(m.unitName ?? ''),
    PackQty: `${inv.packQty ?? m.packQty ?? 1}`,
    ProductType: productType,
    LineType: lineType,
  }
}
