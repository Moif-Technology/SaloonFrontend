/** Form state for Product Entry modal */
export interface ProductFormValues {
    name: string
    code?: string
    groupId: string
    price?: number
    cost?: number
    stockQty?: number
    lowStockThreshold?: number
    active: boolean
    showOnBackOffice: boolean
  }
  
  /** Payload sent to create/update API */
  export interface ProductPayload {
    name: string
    code?: string
    groupId: string
    price: number
    cost?: number
    stockQty?: number
    lowStockThreshold?: number
    active: boolean
    showOnBackOffice: boolean
  }
  
  /** Full catalogue product (create result / edit mode) */
  export interface CatalogueProduct {
    id: string
    name: string
    code?: string
    groupId: string
    price: number
    cost?: number
    stockQty?: number
    lowStockThreshold?: number
    active: boolean
    showOnBackOffice: boolean
  }