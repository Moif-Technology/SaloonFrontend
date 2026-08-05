/** Form state for Sub Group Entry modal */
export interface SubGroupFormValues {
    parentGroupId: string
    code: string
    name: string
    nameAr: string
    showOnBackOffice: boolean
  }
  
  /** Payload sent to create/update API */
  export interface SubGroupPayload {
    parentGroupId: string
    code: string
    name: string
    nameAr?: string
    showOnBackOffice: boolean
  }
  
  /** Full catalogue sub-group (create result / edit mode) */
  export interface CatalogueSubGroup {
    id: string
    parentGroupId: string
    code: string
    name: string
    nameAr?: string
    showOnBackOffice: boolean
  }