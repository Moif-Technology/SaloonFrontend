export interface GroupFormValues {
  name: string
  code?: string
  active: boolean
  sortOrder?: number
}

export interface GroupPayload {
  name: string
  code?: string
  active: boolean
  sortOrder?: number
}

/** Optional: for edit mode later */
export interface CatalogueGroup {
  id: string
  name: string
  code?: string
  active: boolean
  sortOrder?: number
}
