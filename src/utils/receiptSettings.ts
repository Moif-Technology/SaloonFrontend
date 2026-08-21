/**
 * Receipt company details from POS parameter table (headings / TRN / footers).
 * Loaded once after login; bill / draft / counter-close print uses cache only.
 */
import { apiService } from '../api/apiService'
import type { PrintMeta } from '../lib/printBillReceipt'
import { parseTaxRate } from './taxRate'

export type ReceiptSettings = {
  heading1: string
  heading2: string
  heading3: string
  heading4: string
  heading5: string
  footer1: string
  footer2: string
  taxRegNo: string
  /** Shop default tax % from parameter table (`tax1`). */
  tax1: number
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
  tax1: 0,
}

let cache: ReceiptSettings | null = null
let loadPromise: Promise<ReceiptSettings> | null = null

export function clearReceiptSettingsCache() {
  cache = null
  loadPromise = null
}

export function setReceiptSettingsCache(settings: ReceiptSettings) {
  cache = { ...settings }
}

function pickText(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = raw[key]
    if (val == null) continue
    const s = String(val).trim()
    if (s && s.toLowerCase() !== 'null') return s
  }
  return ''
}

export function mapParametersToReceiptSettings(
  raw: Record<string, unknown>,
): ReceiptSettings {
  return {
    heading1: pickText(raw, 'heading1Counter', 'heading1_counter', 'heading1'),
    heading2: pickText(raw, 'heading2Counter', 'heading2_counter', 'heading2'),
    heading3: pickText(raw, 'heading3Counter', 'heading3_counter', 'heading3'),
    heading4: pickText(raw, 'heading4Counter', 'heading4_counter', 'heading4'),
    heading5: pickText(raw, 'heading5Counter', 'heading5_counter', 'heading5'),
    footer1: pickText(raw, 'heading6Counter', 'heading6_counter', 'footer1'),
    footer2: pickText(raw, 'heading7Counter', 'heading7_counter', 'footer2'),
    taxRegNo: pickText(raw, 'taxRegistrationNo', 'tax_registration_no', 'taxRegNo', 'trn'),
    tax1: parseTaxRate(raw.Tax1 ?? raw.tax1),
  }
}

/** Cached settings for forms (no API). */
export function peekReceiptSettingsCache(): ReceiptSettings | null {
  return cache ? { ...cache } : null
}

/** Cached shop tax % from parameter table — sync, no network. */
export function getShopTaxRate(): number {
  return cache?.tax1 ?? 0
}

/** Sync read — used by all print paths; never calls the API. */
export function getReceiptSettings(): ReceiptSettings {
  return cache ? { ...cache } : { ...empty }
}

function mergeSettingsIntoPrintMeta(meta: PrintMeta, s: ReceiptSettings): PrintMeta {
  return {
    ...meta,
    heading1: meta.heading1 || meta.companyName || s.heading1 || undefined,
    heading2: meta.heading2 || s.heading2 || undefined,
    heading3: meta.heading3 || s.heading3 || undefined,
    heading4: meta.heading4 || s.heading4 || undefined,
    heading5: meta.heading5 || s.heading5 || undefined,
    companyName: meta.companyName || meta.heading1 || s.heading1 || undefined,
    address:
      meta.address ||
      [s.heading2, s.heading3, s.heading4, s.heading5].filter(Boolean).join('\n') ||
      undefined,
    trn: meta.trn || s.taxRegNo || undefined,
    footer: meta.footer || s.footer1 || undefined,
    footer2: meta.footer2 || s.footer2 || undefined,
  }
}

/** Merge cached shop details into print meta — sync, no network. */
export function receiptPrintMeta(meta: PrintMeta = {}): PrintMeta {
  return mergeSettingsIntoPrintMeta(meta, getReceiptSettings())
}

/**
 * Fetch parameter-table headings from API (login / POS mount / POS Setup only).
 * Dedupes concurrent calls unless force=true.
 */
export async function loadReceiptSettings(force = false): Promise<ReceiptSettings> {
  if (!force && cache) return { ...cache }
  if (!force && loadPromise) return loadPromise

  const run = async (): Promise<ReceiptSettings> => {
    try {
      const raw = await apiService.fetchParameters()
      cache = mapParametersToReceiptSettings(raw)
    } catch (err) {
      if (force) throw err
      cache = cache ?? { ...empty }
    }
    return { ...cache! }
  }

  if (force) return run()

  loadPromise = run().finally(() => {
    loadPromise = null
  })
  return loadPromise
}

/** @deprecated Use loadReceiptSettings — kept for POS Setup dialog. */
export async function fetchReceiptSettings(force = false): Promise<ReceiptSettings> {
  return loadReceiptSettings(force)
}

/** Persist bill headings and refresh cache. */
export async function saveReceiptSettings(settings: ReceiptSettings): Promise<ReceiptSettings> {
  await apiService.saveCompanyDetails({
    heading1: settings.heading1,
    heading2: settings.heading2,
    heading3: settings.heading3,
    heading4: settings.heading4,
    heading5: settings.heading5,
    footer1: settings.footer1,
    footer2: settings.footer2,
    taxRegNo: settings.taxRegNo,
  })
  const fresh = await loadReceiptSettings(true)
  setReceiptSettingsCache(fresh)
  return fresh
}
