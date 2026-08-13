/** Salon POS payment mode helpers — align with api/src/pos/salon/utils/paymentModes.js */

export const PM = {
  CASH: 'CASH',
  CREDITCARD: 'CREDITCARD',
  CREDIT: 'CREDIT',
  MULTIPAYMENT: 'MULTIPAYMENT',
  ONLINE: 'ONLINE',
  COMPLIMENT: 'COMPLIMENT',
} as const

export type CanonicalPayMode = (typeof PM)[keyof typeof PM] | string

function up(v: unknown) {
  return String(v ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

/** Normalize bill-level payment_mode from API / DB. */
export function normalizeBillPaymentMode(mode: unknown): string {
  const m = up(mode)
  if (!m) return PM.CASH
  if (m === 'CARD' || m === 'CC' || m === 'CREDITCARD') return PM.CREDITCARD
  if (
    m === 'MULTI' ||
    m === 'MULTIPAYMENT' ||
    m === 'MULTIPAY' ||
    m === 'MPAY' ||
    m === 'M-PAY' ||
    m === 'MPAYMENT' ||
    m === 'SPLIT' ||
    m === 'SPLITPAY' ||
    m === 'SPLITPAYMENT'
  ) {
    return PM.MULTIPAYMENT
  }
  if (m === 'CREDIT') return PM.CREDIT
  if (m === 'ONLINE') return PM.ONLINE
  if (m === 'COMPLIMENT' || m === 'COMPLIMENTARY' || m === 'COMP') return PM.COMPLIMENT
  return m === 'CASH' ? PM.CASH : m || PM.CASH
}

/** Normalize a split-row pay mode for display / print. */
export function normalizeSplitPayMode(mode: unknown): string {
  const m = up(mode)
  if (m === 'CARD' || m === 'CC' || m === 'CREDITCARD') return PM.CREDITCARD
  if (m === 'ONLINE') return PM.ONLINE
  if (m === 'VOUCHER') return 'VOUCHER'
  if (m === 'CREDIT') return PM.CREDIT
  if (m === 'COMPLIMENT' || m === 'COMPLIMENTARY') return PM.COMPLIMENT
  return PM.CASH
}

export function isMultiPaymentMode(mode: unknown): boolean {
  return normalizeBillPaymentMode(mode) === PM.MULTIPAYMENT
}

/**
 * True if bill is multi/split payment.
 * Header MULTIPAYMENT always counts; otherwise need 2+ tender rows
 * (single CASH/CARD bills also store one sales_payment_split row).
 */
export function isSplitBill(
  mode: unknown,
  splits?: Array<{ payMode?: string; amount?: number }> | null,
): boolean {
  if (isMultiPaymentMode(mode)) return true
  const active = (splits ?? []).filter((s) => Number(s.amount) > 0)
  return active.length >= 2
}

/** Friendly label for list / detail header. */
export function paymentModeLabel(
  mode: unknown,
  splits?: Array<{ payMode?: string; amount?: number }> | null,
): string {
  if (isSplitBill(mode, splits)) return 'M-Pay'
  const n = normalizeBillPaymentMode(mode)
  if (n === PM.CREDITCARD) return 'CARD'
  if (n === PM.COMPLIMENT) return 'COMPLIMENT'
  return n
}

/** Friendly label for a single split row (CASH, CARD, …). */
export function splitPayModeLabel(mode: unknown): string {
  const n = normalizeSplitPayMode(mode)
  if (n === PM.CREDITCARD) return 'CARD'
  return n
}
