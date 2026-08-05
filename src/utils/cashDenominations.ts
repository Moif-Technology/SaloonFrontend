/**
 * Builds cash quick-select amounts from the grand total.
 * Always includes exact total first, then rounded “next bill” options.
 */
export function buildCashDenominations(
    total: number,
    options?: {
      /** Standard notes to offer when larger than total (default Indian notes) */
      bills?: number[]
      maxChips?: number
    },
  ): number[] {
    const bills = options?.bills ?? [50, 100, 200, 500, 2000]
    const maxChips = options?.maxChips ?? 8
    if (!Number.isFinite(total) || total <= 0) return bills.slice(0, 4)
  
    const exact = Math.round(total * 100) / 100
    const set = new Set<number>()
    set.add(exact)
  
    // Round up to nice ceilings (e.g. 545 → 550, 600, 1000…)
    const ceils = [10, 50, 100, 500, 1000]
    for (const step of ceils) {
      const rounded = Math.ceil(exact / step) * step
      if (rounded >= exact) set.add(rounded)
    }
  
    // Bills that cover the total
    for (const bill of bills) {
      if (bill >= exact) set.add(bill)
    }
  
    // Multiples of largest small bill when needed (e.g. 2×500)
    for (const bill of [500, 1000, 2000]) {
      if (bill * 2 >= exact && bill * 2 !== exact) set.add(bill * 2)
    }
  
    return Array.from(set)
      .filter((n) => n >= exact)
      .sort((a, b) => a - b)
      .slice(0, maxChips)
  }