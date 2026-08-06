import type { CatalogueProduct, ProductPayload } from '../types/product'
import { apiService } from './apiService'
import { SessionManager } from '../utils/sessionManager'

function branchId(): number {
  const n = Number(SessionManager.stationId?.trim() ?? '')
  if (Number.isFinite(n) && n > 0) return n
  return 1
}

function toApiBody(payload: ProductPayload): Record<string, unknown> {
  return {
    branchId: branchId(),
    productName: payload.name.trim(),
    description: payload.name.trim(),
    productCode: payload.code?.trim() || undefined,
    autoCode: !payload.code?.trim(),
    groupId: Number(payload.groupId) || undefined,
    unitPrice: payload.price,
    averageCost: payload.cost ?? 0,
    qtyOnHand: payload.stockQty ?? 0,
    productType: 'Stock',
    productStatus: payload.active ? 'ACTIVE' : 'INACTIVE',
    recordStatus: payload.active ? 'ACTIVE' : 'INACTIVE',
  }
}

function toCatalogue(raw: Record<string, unknown>, fallback: ProductPayload, id?: string): CatalogueProduct {
  const inv =
    raw.inventory && typeof raw.inventory === 'object'
      ? (raw.inventory as Record<string, unknown>)
      : {}
  return {
    id: String(raw.productId ?? raw.ProductID ?? id ?? ''),
    name: String(raw.productName ?? raw.ProductName ?? fallback.name),
    code: String(raw.productCode ?? raw.ProductCode ?? fallback.code ?? '') || undefined,
    groupId: String(raw.groupId ?? raw.GroupID ?? fallback.groupId),
    price: Number(inv.unitPrice ?? raw.unitPrice ?? fallback.price) || 0,
    cost: fallback.cost,
    stockQty: fallback.stockQty,
    lowStockThreshold: fallback.lowStockThreshold,
    active: fallback.active,
    showOnBackOffice: fallback.showOnBackOffice,
  }
}

export async function createProduct(payload: ProductPayload): Promise<CatalogueProduct> {
  const raw = await apiService.createProduct(toApiBody(payload))
  return toCatalogue(raw, payload)
}

export async function updateProduct(
  id: string,
  payload: ProductPayload,
): Promise<CatalogueProduct> {
  const raw = await apiService.updateProduct(id, toApiBody(payload))
  return toCatalogue(raw, payload, id)
}
