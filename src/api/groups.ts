import type { GroupPayload, CatalogueGroup } from '../types/group'
import { apiService } from './apiService'

function toCatalogue(raw: Record<string, unknown>, fallback?: Partial<GroupPayload>): CatalogueGroup {
  const status = String(raw.rStatus ?? raw.RStatus ?? 'ACTIVE').toUpperCase()
  const sortRaw = raw.sortOrder ?? raw.SortOrder ?? raw.sort_order ?? fallback?.sortOrder
  const sortOrder = Number(sortRaw)
  return {
    id: String(raw.groupId ?? raw.GroupID ?? ''),
    name: String(
      raw.groupDescription ?? raw.GroupDescription ?? fallback?.name ?? '',
    ).trim(),
    code: String(raw.groupCode ?? raw.GroupCode ?? fallback?.code ?? '') || undefined,
    active: status === 'ACTIVE' || status === '',
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
  }
}

export async function fetchGroups(): Promise<CatalogueGroup[]> {
  const rows = await apiService.fetchGroups()
  return rows
    .map((g) => toCatalogue(g))
    .filter((g) => g.id && g.id !== '0')
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
}

export async function createGroup(payload: GroupPayload): Promise<CatalogueGroup> {
  const body: Record<string, unknown> = {
    groupCode: payload.code?.trim() || undefined,
    groupDescription: payload.name.trim(),
  }
  if (payload.sortOrder != null && Number.isFinite(Number(payload.sortOrder))) {
    body.sortOrder = Number(payload.sortOrder)
  }
  const raw = await apiService.createGroup(body)
  const created = toCatalogue(raw, payload)
  if (!payload.active && created.id) {
    await apiService.deleteGroup(created.id)
    return { ...created, active: false }
  }
  return { ...created, active: true }
}

export async function updateGroup(
  id: string,
  payload: GroupPayload,
): Promise<CatalogueGroup> {
  if (!payload.active) {
    // Soft-delete hides group from POS / list (r_status DELETED)
    await apiService.deleteGroup(id)
    return {
      id,
      name: payload.name.trim(),
      code: payload.code.trim(),
      active: false,
      sortOrder: payload.sortOrder,
    }
  }

  const body: Record<string, unknown> = {
    groupCode: payload.code.trim(),
    groupDescription: payload.name.trim(),
  }
  if (payload.sortOrder != null && Number.isFinite(Number(payload.sortOrder))) {
    body.sortOrder = Number(payload.sortOrder)
  }
  const raw = await apiService.updateGroup(id, body)
  return { ...toCatalogue(raw, payload), active: true }
}
