/** Bill discount math — same rules as Counter-pos discountCalc.js */

export function roundMoney(value: number, decimals = 2) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  const factor = 10 ** decimals
  return Math.round((n + Number.EPSILON) * factor) / factor
}

export function moneyPlaceholder(decimals = 2) {
  return (0).toFixed(decimals)
}

/** Taxable base = sum of line qty × price (before bill discount, before VAT). */
export function billTaxableBeforeDiscount(
  items: { qty: number; price: number }[],
): number {
  return roundMoney(
    (items ?? []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0),
  )
}

export function resolveDiscountOnTaxable(
  taxableBase: number,
  mode: 'pct' | 'amt',
  pctStr: string,
  amtStr: string,
) {
  const base = Number(taxableBase) || 0
  const absBase = Math.abs(base)
  const sign = base < 0 ? -1 : 1

  let discountAmt: number
  let pct: number

  if (mode === 'amt') {
    const raw = parseFloat(amtStr) || 0
    discountAmt = roundMoney(Math.min(Math.max(raw, 0), absBase))
    pct = absBase > 0 ? roundMoney((discountAmt / absBase) * 100) : 0
  } else {
    pct = Math.min(Math.max(parseFloat(pctStr) || 0, 0), 100)
    discountAmt = roundMoney((absBase * pct) / 100)
  }

  const signedDisc = roundMoney(discountAmt * sign)
  const netTaxable = roundMoney(base - signedDisc)

  return {
    discountAmt: roundMoney(discountAmt),
    pct,
    netTaxable,
    signedDisc,
  }
}

export function previewBillDiscount(
  items: { qty: number; price: number; taxRate?: number }[],
  mode: 'pct' | 'amt',
  pctStr: string,
  amtStr: string,
  defaultTaxRate = 0,
) {
  const taxableBase = billTaxableBeforeDiscount(items)
  const { discountAmt, pct, netTaxable } = resolveDiscountOnTaxable(
    taxableBase,
    mode,
    pctStr,
    amtStr,
  )
  const taxAmt = roundMoney(
    (items ?? []).reduce((s, it) => {
      const line = (Number(it.qty) || 0) * (Number(it.price) || 0)
      const rate = it.taxRate ?? defaultTaxRate
      return s + (line * rate) / 100
    }, 0),
  )
  const ratio = taxableBase !== 0 ? netTaxable / taxableBase : 1
  const taxAfter = roundMoney(taxAmt * ratio)
  const grossTotal = roundMoney(netTaxable + taxAfter)
  return { discountAmt, pct, netTaxable, grossTotal, taxAfter, taxableBase }
}

export function billDiscountInitialState(taxableBase: number, billDiscountAmt: number) {
  const taxable = roundMoney(Number(taxableBase) || 0)
  const amt = roundMoney(Number(billDiscountAmt) || 0)
  if (!amt) return { mode: 'pct' as const, discPct: '', discAmt: '' }
  return {
    mode: 'amt' as const,
    discPct: taxable !== 0 ? String(roundMoney((amt / Math.abs(taxable)) * 100)) : '',
    discAmt: String(amt),
  }
}

/** Apply bill discount to totals (Counter-pos style). */
export function computeBillTotals(
  items: { qty: number; price: number; taxRate?: number }[],
  billDiscountAmt: number,
  defaultTaxRate = 0,
) {
  const subtotal = billTaxableBeforeDiscount(items)
  const taxBefore = roundMoney(
    (items ?? []).reduce((s, it) => {
      const line = (Number(it.qty) || 0) * (Number(it.price) || 0)
      const rate = it.taxRate ?? defaultTaxRate
      return s + (line * rate) / 100
    }, 0),
  )
  const discount = roundMoney(Math.min(Math.max(Number(billDiscountAmt) || 0, 0), subtotal))
  const ratio = subtotal > 0 ? (subtotal - discount) / subtotal : 1
  const taxableAfter = roundMoney(subtotal - discount)
  const tax = roundMoney(taxBefore * ratio)
  return {
    subtotal,
    discount,
    tax,
    taxableAfter,
    total: roundMoney(taxableAfter + tax),
  }
}
