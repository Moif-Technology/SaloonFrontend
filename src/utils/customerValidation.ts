/** Trimmed non-empty name (mandatory). */
export function isValidCustomerName(name: string): boolean {
    return name.trim().length > 0
  }
  
  /**
   * Mobile: digits only after stripping spaces/dashes.
   * Adjust ONLY here if product requires a fixed length (e.g. 10-digit IN).
   * Do not re-implement these checks inside the UI.
   */
  export function isValidMobile(mobile: string): boolean {
    const digits = mobile.replace(/[\s-]/g, '')
    return /^\d{10}$/.test(digits)
  }
  
  /** Empty is OK (optional). Non-empty must look like an email. */
  export function isValidEmail(email: string): boolean {
    const v = email.trim()
    if (!v) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }
  
  export function getNameError(name: string): string | null {
    if (!isValidCustomerName(name)) return 'Customer name is required'
    return null
  }
  
  export function getMobileError(mobile: string): string | null {
    if (!mobile.trim()) return 'Mobile number is required'
    if (!isValidMobile(mobile)) return 'Enter a valid 10-digit mobile number'
    return null
  }
  
  export function getEmailError(email: string): string | null {
    if (!isValidEmail(email)) return 'Enter a valid email address'
    return null
  }
  
  export function canSaveCustomer(values: {
    name: string
    mobile: string
    email: string
  }): boolean {
    return (
      isValidCustomerName(values.name) &&
      isValidMobile(values.mobile) &&
      isValidEmail(values.email)
    )
  }