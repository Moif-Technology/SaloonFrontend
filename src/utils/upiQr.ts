import type { MerchantUpiConfig } from '../types/payment'

/**
 * Builds a UPI intent string. Scanning this with GPay/PhonePe opens pay flow.
 * Replace merchant config with real salon VPA from backend/settings later.
 */
export function buildUpiPaymentUrl(
  amount: number,
  merchant: MerchantUpiConfig,
  transactionRef?: string,
): string {
  const pa = encodeURIComponent(merchant.vpa)
  const pn = encodeURIComponent(merchant.payeeName)
  const am = encodeURIComponent(amount.toFixed(2))
  const cu = 'INR'
  const tn = encodeURIComponent(merchant.transactionNote ?? 'Salon payment')
  const tr = transactionRef
    ? `&tr=${encodeURIComponent(transactionRef)}`
    : ''

  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=${cu}&tn=${tn}${tr}`
}

/** Free QR image URL for UI dev (no npm package). Swap for local QR lib later. */
export function qrImageUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`
}

/** Demo merchant — replace with env / branch settings */
export const DEMO_MERCHANT: MerchantUpiConfig = {
  vpa: 'salonpos@upi',
  payeeName: 'Salon POS',
  transactionNote: 'Salon services',
}