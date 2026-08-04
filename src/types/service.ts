/** Form state for Service Entry modal */
export interface ServiceFormValues {
    code: string
    name: string
    nameAr: string
    groupId: string
    subGroupId: string
    price?: number
    durationMinutes?: number
    showOnBackOffice: boolean
  }
  
  /** Payload sent to create/update API */
  export interface ServicePayload {
    code: string
    name: string
    nameAr?: string
    groupId: string
    subGroupId: string
    price: number
    durationMinutes?: number
    showOnBackOffice: boolean
  }
  
  /** Full catalogue service (create result / edit mode) */
  export interface CatalogueService {
    id: string
    code: string
    name: string
    nameAr?: string
    groupId: string
    subGroupId: string
    price: number
    durationMinutes?: number
    showOnBackOffice: boolean
  }