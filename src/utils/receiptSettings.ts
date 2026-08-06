/**
 * Receipt company details from POS parameter table (headings / TRN / footers).
 */
import { apiService } from '../api/apiService'
import type { PrintMeta } from '../lib/printBillReceipt'

export type ReceiptSettings = {
  heading1: string
  heading2: string
  heading3: string
  heading4: string
  heading5: string
  footer1: string
  footer2: string
  taxRegNo: string
}

const empty: ReceiptSettings = {
  heading1: '',
  heading2: '',
  heading3: '',
  heading4: '',
  heading5: '',
  footer1: '',
  footer2: '',
  taxRegNo: '',
}

let cache: ReceiptSettings | null = null

export function clearReceiptSettingsCache() {
  cache = null
}

export function mapParametersToReceiptSettings(
  raw: Record<string, unknown>,
): ReceiptSettings {
  return {
    heading1: String(raw.heading1Counter ?? raw.heading1 ?? '').trim(),
    heading2: String(raw.heading2Counter ?? raw.heading2 ?? '').trim(),
    heading3: String(raw.heading3Counter ?? raw.heading3 ?? '').trim(),
    heading4: String(raw.heading4Counter ?? raw.heading4 ?? '').trim(),
    heading5: String(raw.heading5Counter ?? raw.heading5 ?? '').trim(),
    footer1: String(raw.heading6Counter ?? raw.footer1 ?? '').trim(),
    footer2: String(raw.heading7Counter ?? raw.footer2 ?? '').trim(),
    taxRegNo: String(raw.taxRegistrationNo ?? raw.taxRegNo ?? '').trim(),
  }
}

export async function fetchReceiptSettings(force = false): Promise<ReceiptSettings> {
  if (!force && cache) return cache
  try {
    const raw = await apiService.fetchParameters()
    cache = mapParametersToReceiptSettings(raw)
  } catch {
    cache = { ...empty }
  }
  return cache
}

/** Merge parameter headings into print meta (explicit meta wins). */
export async function withReceiptPrintMeta(meta: PrintMeta = {}): Promise<PrintMeta> {
  const s = await fetchReceiptSettings()
  const addressLines = [s.heading2, s.heading3, s.heading4, s.heading5].filter(Boolean)
  return {
    ...meta,
    companyName: meta.companyName || s.heading1 || undefined,
    address: meta.address || addressLines.join('\n') || undefined,
    trn: meta.trn || s.taxRegNo || undefined,
    footer: meta.footer || s.footer1 || undefined,
    footer2: meta.footer2 || s.footer2 || undefined,
  }
}
