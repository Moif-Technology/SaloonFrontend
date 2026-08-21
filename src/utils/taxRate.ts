/** Parse tax % from API values — preserves 0 (never use `|| 5`). */
export function parseTaxRate(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/** Line tax: explicit item rate, else shop default from parameter table. */
export function resolveLineTaxRate(itemTaxRate: number | undefined, shopTaxRate = 0): number {
  return itemTaxRate ?? shopTaxRate
}
