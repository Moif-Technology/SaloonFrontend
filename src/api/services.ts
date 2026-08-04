import type { CatalogueService, ServicePayload } from '../types/service'

export async function createService(
  payload: ServicePayload,
): Promise<CatalogueService> {
  // Mock until backend POST /api/products (or /api/salon-pos/services) is ready
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `svc-${Date.now()}`,
    code: payload.code.trim(),
    name: payload.name.trim(),
    nameAr: payload.nameAr?.trim() || undefined,
    groupId: payload.groupId,
    subGroupId: payload.subGroupId,
    price: payload.price,
    durationMinutes: payload.durationMinutes,
    showOnBackOffice: payload.showOnBackOffice,
  }
}

export async function updateService(
  id: string,
  payload: ServicePayload,
): Promise<CatalogueService> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id,
    code: payload.code.trim(),
    name: payload.name.trim(),
    nameAr: payload.nameAr?.trim() || undefined,
    groupId: payload.groupId,
    subGroupId: payload.subGroupId,
    price: payload.price,
    durationMinutes: payload.durationMinutes,
    showOnBackOffice: payload.showOnBackOffice,
  }
}