/** How the cashier is collecting payment from the POS More menu */
export type PaymentMethod = 'card' | 'qr' | 'cash'

/** Simulated terminal / UPI lifecycle for UI-only POS */
export type PaymentFlowStatus =
  | 'idle'
  | 'waiting'
  | 'processing'
  | 'success'
  | 'failed'
  | 'expired'

export interface MerchantUpiConfig {
  /** e.g. salon@okaxis */
  vpa: string
  /** Shown on customer UPI app */
  payeeName: string
  /** Optional note on UPI txn */
  transactionNote?: string
}
/** Payload returned when cash tender is confirmed */
export interface CashPaymentResult {
  method: 'cash'
  amountDue: number
  cashTendered: number
  change: number
}
