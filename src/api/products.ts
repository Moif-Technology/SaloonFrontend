import type { CatalogueProduct, ProductPayload } from '../types/product'

export async function createProduct(
  payload: ProductPayload,
): Promise<CatalogueProduct> {
  // Mock until backend POST /api/products is ready
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `prd-${Date.now()}`,
    name: payload.name.trim(),
    code: payload.code?.trim() || undefined,
    groupId: payload.groupId,
    price: payload.price,
    cost: payload.cost,
    stockQty: payload.stockQty,
    lowStockThreshold: payload.lowStockThreshold,
    active: payload.active,
    showOnBackOffice: payload.showOnBackOffice,
  }
}

export async function updateProduct(
  id: string,
  payload: ProductPayload,
): Promise<CatalogueProduct> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id,
    name: payload.name.trim(),
    code: payload.code?.trim() || undefined,
    groupId: payload.groupId,
    price: payload.price,
    cost: payload.cost,
    stockQty: payload.stockQty,
    lowStockThreshold: payload.lowStockThreshold,
    active: payload.active,
    showOnBackOffice: payload.showOnBackOffice,
  }
}