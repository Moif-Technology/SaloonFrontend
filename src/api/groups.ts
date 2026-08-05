import type { GroupPayload, CatalogueGroup } from '../types/group'
import { serviceGroups } from '../data/mockCatalogue'

export async function fetchGroups(): Promise<CatalogueGroup[]> {
  // Mock until GET /api/groups is ready
  await new Promise((r) => setTimeout(r, 200))
  return serviceGroups.map((g, index) => ({
    id: g.id,
    name: g.name,
    active: true,
    sortOrder: index,
  }))
}

export async function createGroup(payload: GroupPayload) {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `grp-${Date.now()}`,
    name: payload.name.trim(),
    code: payload.code.trim(),
    active: payload.active,
    sortOrder: payload.sortOrder,
  }
}

export async function updateGroup(id: string, payload: GroupPayload) {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id,
    ...payload,
    name: payload.name.trim(),
    code: payload.code.trim(),
  }
}