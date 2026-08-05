import type { CatalogueSubGroup, SubGroupPayload } from '../types/subGroup'
export async function fetchSubGroups(
    parentGroupId?: string,
  ): Promise<CatalogueSubGroup[]> {
    // Mock until GET /api/sub-groups is ready
    await new Promise((r) => setTimeout(r, 200))
    const all: CatalogueSubGroup[] = [
      {
        id: 'sgrp-1',
        parentGroupId: 'g1', // must match mock groups ids from fetchGroups
        code: 'HAIR',
        name: 'Hair Treatments',
        showOnBackOffice: false,
      },
      {
        id: 'sgrp-2',
        parentGroupId: 'g1',
        code: 'CUT',
        name: 'Haircuts',
        showOnBackOffice: false,
      },
    ]
    if (!parentGroupId) return all
    return all.filter((s) => s.parentGroupId === parentGroupId)
  }
export async function createSubGroup(
  payload: SubGroupPayload,
): Promise<CatalogueSubGroup> {
  // Mock until backend POST /api/sub-groups (or /api/groups/sub) is ready
  await new Promise((r) => setTimeout(r, 400))
  return {
    id: `sgrp-${Date.now()}`,
    parentGroupId: payload.parentGroupId,
    code: payload.code.trim(),
    name: payload.name.trim(),
    nameAr: payload.nameAr?.trim() || undefined,
    showOnBackOffice: payload.showOnBackOffice,
  }
}

export async function updateSubGroup(
  id: string,
  payload: SubGroupPayload,
): Promise<CatalogueSubGroup> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    id,
    parentGroupId: payload.parentGroupId,
    code: payload.code.trim(),
    name: payload.name.trim(),
    nameAr: payload.nameAr?.trim() || undefined,
    showOnBackOffice: payload.showOnBackOffice,
  }
  
}