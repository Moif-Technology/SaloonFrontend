export type DiscountMode = 'percentage' | 'flat'

/** Values applied to the current bill (persisted while bill is open). */
export interface AppliedDiscount {
  mode: DiscountMode
  /** Percent 0–100, or flat currency amount */
  value: number
  promoCode?: string
}

export const PERCENT_PRESETS = [5, 10, 15, 20, 25, 50] as const
export const FLAT_PRESETS = [50, 100, 200, 500] as const

/** Demo promo codes until backend coupon API is wired */
export const PROMO_CATALOGUE: Record<
  string,
  { mode: DiscountMode; value: number; label: string }
> = {
  SALON10: { mode: 'percentage', value: 10, label: '10% off' },
  SALON20: { mode: 'percentage', value: 20, label: '20% off' },
  SAVE50: { mode: 'flat', value: 50, label: '₹50 off' },
  SAVE100: { mode: 'flat', value: 100, label: '₹100 off' },
}

/**
 * Converts stored discount rules into a bill-line amount (currency).
 * Never exceeds subtotal.
 */
export function computeDiscountAmount(
  subtotal: number,
  discount: AppliedDiscount | null,
): number {
  if (!discount || discount.value <= 0 || subtotal <= 0) return 0
  if (discount.mode === 'percentage') {
    const pct = Math.min(Math.max(discount.value, 0), 100)
    return Math.min((subtotal * pct) / 100, subtotal)
  }
  return Math.min(Math.max(discount.value, 0), subtotal)
}

/** Store VAT rate (%) — used by DiscountModal preview UI */
export const STORE_VAT_PERCENT = 5

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export interface DiscountFinancialBreakdown {
  subtotal: number
  discountAmount: number
  taxableAmount: number
  vatPercent: number
  vatAmount: number
  finalTotal: number
}

/**
 * Live bill preview after discount (Arshidha DiscountModal UI).
 * Actual settle totals still use Sonu `computeBillTotals` (line tax rates).
 */
export function computeDiscountFinancialBreakdown(
  subtotal: number,
  discount: AppliedDiscount | null,
  vatPercent: number = STORE_VAT_PERCENT,
): DiscountFinancialBreakdown {
  const safeSubtotal = Math.max(subtotal, 0)
  const discountAmount = roundMoney(computeDiscountAmount(safeSubtotal, discount))
  const taxableAmount = roundMoney(Math.max(safeSubtotal - discountAmount, 0))
  const rate = Math.max(vatPercent, 0)
  const vatAmount = roundMoney((taxableAmount * rate) / 100)
  const finalTotal = roundMoney(taxableAmount + vatAmount)
  return {
    subtotal: roundMoney(safeSubtotal),
    discountAmount,
    taxableAmount,
    vatPercent: rate,
    vatAmount,
    finalTotal,
  }
}
