export interface CustomerFormValues {
    name: string
    mobile: string
    email: string
    address: string
  }
  
  export interface CustomerPayload {
    name: string
    mobile: string
    email?: string
    address?: string
    /** Existing customer_code — required by API on update when not regenerating */
    code?: string
  }
  
  export type CustomerWizardStep = 1 | 2 | 3 | 4