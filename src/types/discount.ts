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
