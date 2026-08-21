/**
 * Sunmi built-in printer — ESC/command path (Counter-pos style).
 * Reliable on D3 Mini 58mm; avoids blank HTML-to-bitmap renders.
 */
import { registerPlugin } from '@capacitor/core'
import { formatDocBarcode, fmtReceiptDateTime, RECEIPT_HEADING_BITMAP, hasCompanyTaxNumber, receiptInvoiceTitles } from './receiptPrintTheme'
import type { PrintMeta, ReceiptBill, ReceiptBillItem } from './printBillReceipt'
import { billTipTotal } from './printBillReceipt'
import { isNativePosApp } from './androidPrinter'
import {
  isSplitBill,
  normalizeBillPaymentMode,
  paymentModeLabel,
  splitPayModeLabel,
  PM,
} from '../utils/paymentModes'
import { getShopTaxRate } from '../utils/receiptSettings'
import { parseTaxRate } from '../utils/taxRate'

const SunmiPrinter = registerPlugin('SunmiPrinter', {
  web: () => ({
    print: () => Promise.reject(new Error('Sunmi printer not available on web')),
  }),
})

/** Sunmi 80mm active print width (576 dots). */
export const SUNMI_BITMAP_WIDTH = 576
const LINE_WIDTH = 48

function clean(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .replace(/[^\x20-\x7E]/g, '')
    .trim()
}

function money(value: unknown) {
  const n = Number(value) || 0
  return (Math.round(n * 100) / 100).toFixed(2)
}

function clip(value: unknown, width: number) {
  const safe = clean(value)
  return safe.length > width ? safe.slice(0, width) : safe
}

function padRight(value: unknown, width: number) {
  return clip(value, width).padEnd(width, ' ')
}

function padLeft(value: unknown, width: number) {
  return clip(value, width).padStart(width, ' ')
}

function center(value: unknown, width = LINE_WIDTH) {
  const safe = clip(value, width)
  const left = Math.floor((width - safe.length) / 2)
  return `${' '.repeat(Math.max(0, left))}${safe}`.padEnd(width, ' ')
}

function fixedColumns(parts: Array<{ value?: unknown; width?: number; align?: string }>) {
  return parts
    .map((part) => {
      const value = part.value ?? ''
      const width = part.width ?? 0
      const align = part.align ?? 'left'
      if (align === 'right') return padLeft(value, width)
      if (align === 'center') return center(value, width).slice(0, width)
      return padRight(value, width)
    })
    .join('')
    .slice(0, LINE_WIDTH)
}

function wrapLines(value: unknown, width = LINE_WIDTH) {
  const safe = clean(value)
  if (!safe) return [] as string[]
  const words = safe.split(' ')
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    if (!line) {
      line = word
    } else if (line.length + 1 + word.length <= width) {
      line += ` ${word}`
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

function plainDivider(char = '-') {
  return char.repeat(LINE_WIDTH)
}

function textBitmapCommand(lines: string[], opts: { width?: number; padding?: number; textSize?: number } = {}) {
  return {
    type: 'receiptTextBitmap',
    text: lines.join('\n'),
    width: opts.width ?? SUNMI_BITMAP_WIDTH,
    padding: opts.padding ?? 8,
    textSize: opts.textSize ?? RECEIPT_HEADING_BITMAP.body,
  }
}

function pairLine(left: unknown, right: unknown, leftWidth = 22, rightWidth = 26) {
  return fixedColumns([
    { value: left, width: leftWidth },
    { value: right, width: rightWidth, align: 'right' },
  ])
}

function amountLine(label: string, value: unknown) {
  return pairLine(label, money(value), 18, 14)
}

function resolveMetaHeadings(meta: PrintMeta = {}, billCompany: ReceiptBill['company'] = {}) {
  let h1 = clean(meta.heading1 ?? billCompany?.companyName ?? meta.companyName)
  let h2 = clean(meta.heading2)
  let h3 = clean(meta.heading3)
  let h4 = clean(meta.heading4)
  let h5 = clean(meta.heading5)

  if (!h2 && !h3 && !h4 && !h5 && meta.address) {
    const legacy = String(meta.address)
      .split(/\n/)
      .map((l) => clean(l))
      .filter(Boolean)
    if (!h1 && legacy[0]) h1 = legacy[0]
    if (legacy[1] && !h2) h2 = legacy[1]
    if (legacy[2] && !h3) h3 = legacy[2]
    if (legacy[3] && !h4) h4 = legacy[3]
    if (legacy[4] && !h5) h5 = legacy[4]
  }

  const trn = clean(billCompany?.taxRegistrationNo ?? meta.trn)
  return { h1, h2, h3, h4, h5, trn }
}

/** Heading 1 largest → heading 5 smallest, then TRN. */
function companyHeaderCommands(meta: PrintMeta = {}, billCompany: ReceiptBill['company'] = {}) {
  const { h1, h2, h3, h4, h5, trn } = resolveMetaHeadings(meta, billCompany)
  const cmds: object[] = []
  const push = (text: string, size: number) => {
    if (!text) return
    cmds.push(
      textBitmapCommand([center(text)], {
        textSize: size,
        padding: cmds.length === 0 ? 4 : 0,
      }),
    )
  }
  push(h1 || 'MOIF TECHNOLOGY', RECEIPT_HEADING_BITMAP.h1)
  push(h2, RECEIPT_HEADING_BITMAP.h2)
  push(h3, RECEIPT_HEADING_BITMAP.h3)
  push(h4, RECEIPT_HEADING_BITMAP.h4)
  push(h5, RECEIPT_HEADING_BITMAP.h5)
  if (trn) push(`TRN: ${trn}`, RECEIPT_HEADING_BITMAP.trn)
  return cmds
}

function billLineUnitDisplay(it: ReceiptBillItem) {
  const qty = Math.abs(Number(it.qty) || 1)
  const total = Number(it.lineTotal) || 0
  if (qty > 0 && total) return money(total / qty)
  return money(it.unitPrice)
}

function finishCommands(
  commands: object[],
  barcodeText: string,
  displayText = '',
  meta: PrintMeta = {},
) {
  if (barcodeText) {
    commands.push(textBitmapCommand([plainDivider(), center('Scan for reprint')], { padding: 2 }))
    commands.push({ type: 'barcode', text: barcodeText, height: 64, width: 2, position: 0 })
    if (displayText) {
      commands.push(textBitmapCommand([center(displayText)], { padding: 0 }))
    }
  }
  const footer1 = clean(meta.footer) || 'Thank You......Visit Again'
  const footer2 = clean(meta.footer2)
  commands.push(
    textBitmapCommand([plainDivider(), center(footer1)], {
      padding: 2,
      textSize: RECEIPT_HEADING_BITMAP.footer,
    }),
  )
  if (footer2) {
    commands.push(
      textBitmapCommand([center(footer2)], {
        padding: 0,
        textSize: RECEIPT_HEADING_BITMAP.h5,
      }),
    )
  }
  commands.push({ type: 'feed', lines: 2 })
  commands.push({ type: 'cut' })
  return commands
}

export function buildBillPrintCommands(bill: ReceiptBill, meta: PrintMeta = {}) {
  if (!bill) throw new Error('No bill data to print')

  const isDraft = !!meta.draft
  const headings = resolveMetaHeadings(meta, bill.company)
  const hasTrn = hasCompanyTaxNumber(headings.trn)
  const invoiceTitle = receiptInvoiceTitles({ trn: headings.trn, draft: isDraft }).en
  const label = String(bill.billNo ?? bill.salesId ?? '')
  const jobNo = clean(bill.jobNo)
  const items = bill.items ?? []
  const itemCount = items.length
  const qtyTotal = items.reduce((s, it) => s + Math.abs(Number(it.qty) || 0), 0)
  const settlement = isDraft
    ? 'PENDING'
    : isSplitBill(bill.paymentMode, bill.paymentSplits)
      ? 'MULTIPAYMENT'
      : paymentModeLabel(bill.paymentMode, bill.paymentSplits)

  const lines = [
    plainDivider(),
    center(invoiceTitle),
    plainDivider(),
    pairLine(`BILL # : ${clean(label)}`, fmtReceiptDateTime(bill.billTime ?? bill.billDate)),
  ]
  if (jobNo) lines.push(`JOB # : ${jobNo}`.slice(0, LINE_WIDTH))
  lines.push(
    pairLine(
      `COUNTER : ${clean(bill.counterNo ?? meta.counterNo ?? '')}`,
      `CASHIER : ${clean(bill.staffName ?? 'CASHIER')}`,
    ),
  )
  lines.push(
    pairLine(
      `CHAIR : ${clean(bill.chairNo ?? '')}`,
      `STYLIST : ${clean(bill.stylistName ?? '')}`,
    ),
  )

  const customerName = clean(bill.customer?.customerName)
  if (customerName && !/^(walk-?in|walk in)$/i.test(customerName)) {
    lines.push(plainDivider())
    lines.push(...wrapLines(`Customer: ${customerName}`))
    if (bill.customer?.customerCode) lines.push(...wrapLines(`Code: ${bill.customer.customerCode}`))
    if (bill.customer?.taxRegNo) lines.push(...wrapLines(`TRN: ${bill.customer.taxRegNo}`))
  } else if (customerName) {
    lines.push(plainDivider())
    lines.push(...wrapLines(`Customer: ${customerName}`))
  }

  if (bill.remarks?.trim()) lines.push(...wrapLines(`Comments: ${bill.remarks}`))

  lines.push(plainDivider())
  lines.push(
    fixedColumns([
      { value: 'Description', width: 24 },
      { value: 'Qty', width: 5, align: 'right' },
      { value: 'Price', width: 9, align: 'right' },
      { value: 'Total', width: 10, align: 'right' },
    ]),
  )
  lines.push(plainDivider('.'))

  for (const it of items) {
    lines.push(...wrapLines(it.description || 'Item'))
    lines.push(
      fixedColumns([
        { value: '', width: 24 },
        { value: String(Math.abs(Number(it.qty) || 0)), width: 5, align: 'right' },
        { value: billLineUnitDisplay(it), width: 9, align: 'right' },
        { value: money(it.lineTotal), width: 10, align: 'right' },
      ]),
    )
    if (hasTrn) {
      const vatPer = parseTaxRate(it.vatPer, parseTaxRate(bill.taxRate, getShopTaxRate()))
      const vatAmt = Number(it.vatAmt) || 0
      lines.push(pairLine('', `VAT@${vatPer}% (${money(vatAmt)})`, 18, 30))
    }
  }

  const taxableAmt = Number(bill.taxableAmt) || 0
  const taxAmt = Number(bill.taxAmt) || 0
  const amount = Number(bill.amount) || 0
  const paidAmount = isDraft ? 0 : Number(bill.paidAmount ?? bill.amount) || 0
  const balanceAmount = isDraft ? amount : Number(bill.balanceAmount) || 0
  const discountAmt = Number(bill.discountAmt) || 0
  const roundOff = bill.roundOff != null ? Number(bill.roundOff) : 0

  lines.push(plainDivider())
  if (discountAmt) lines.push(amountLine('DISCOUNT', discountAmt))
  if (roundOff) lines.push(amountLine('ROUND OFF', roundOff))
  lines.push(amountLine('TOTAL :', amount))
  lines.push(`SETTLEMENT : ${settlement}`.slice(0, LINE_WIDTH))

  const tipTotal = isDraft ? 0 : billTipTotal(bill)
  const splits = (bill.paymentSplits ?? []).filter(
    (s) => Number(s.amount) > 0 || Number(s.tip) > 0,
  )

  if (!isDraft && isSplitBill(bill.paymentMode, splits) && splits.length) {
    lines.push(`SPLIT PAYMENT (${splits.length})`.slice(0, LINE_WIDTH))
    for (const split of splits) {
      const mode = splitPayModeLabel(split.payMode)
      if (Number(split.amount) > 0) {
        lines.push(amountLine(mode, Number(split.amount) || 0))
      }
      if (Number(split.tip) > 0.001) {
        lines.push(amountLine(`${mode} TIP`, Number(split.tip) || 0))
      }
    }
    if (tipTotal > 0.001) {
      lines.push(amountLine('TIP TOTAL', tipTotal))
    }
  } else if (!isDraft && tipTotal > 0.001) {
    lines.push(amountLine('TIP', tipTotal))
  }

  lines.push(pairLine(`ITEMS : ${itemCount}`, `BILL AMOUNT : ${money(amount)}`))
  lines.push(pairLine(`QTY : ${qtyTotal}`, `PAID AMOUNT : ${money(paidAmount)}`))
  if (!isDraft && tipTotal > 0.001) {
    lines.push(pairLine('', `TIP : ${money(tipTotal)}`))
  }
  lines.push(pairLine('', `BAL. AMOUNT : ${money(balanceAmount)}`))

  if (!isDraft && normalizeBillPaymentMode(bill.paymentMode) === PM.CREDIT && bill.customer?.customerId) {
    const os = Number(bill.customerOsBalance) || Number(bill.outstandingBalance) || 0
    lines.push(amountLine('O/S BALANCE', os))
  }

  if (hasTrn && !isDraft) {
    lines.push(plainDivider())
    lines.push(center('Tax Details'))
    lines.push(
      fixedColumns([
        { value: 'Taxable Amount', width: 18 },
        { value: 'Tax Amount', width: 14, align: 'right' },
        { value: 'Bill Amount', width: 16, align: 'right' },
      ]),
    )
    lines.push(
      fixedColumns([
        { value: money(taxableAmt), width: 18 },
        { value: money(taxAmt), width: 14, align: 'right' },
        { value: money(amount), width: 16, align: 'right' },
      ]),
    )
  }

  const commands = [...companyHeaderCommands(meta, bill.company), textBitmapCommand(lines)]
  const barcodeText = isDraft ? '' : formatDocBarcode(label)
  return finishCommands(commands, barcodeText, label, meta)
}

export async function printAndroidCommands(commands: object[]) {
  if (!isNativePosApp()) return false
  await (SunmiPrinter as { print: (o: { commands: object[] }) => Promise<unknown> }).print({ commands })
  return true
}

export async function printAndroidBill(bill: ReceiptBill, meta: PrintMeta = {}) {
  return printAndroidCommands(buildBillPrintCommands(bill, meta))
}

function fmtReportDate(d = new Date()) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  const day = String(dt.getDate()).padStart(2, '0')
  const mon = dt.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  return `${day}/${mon}/${dt.getFullYear()}`
}

function fmtReportTime(d = new Date()) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '-'
  return dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function reportAmountLine(label: string, value: unknown) {
  return pairLine(label, money(value), 30, 18)
}

/** Minimal X/Z counter close slip for 80mm thermal. */
export function buildCounterClosePrintCommands(
  data: Record<string, unknown> = {},
  meta: PrintMeta & {
    reportType?: string
    closeNo?: string
    reportAt?: Date
    counterNo?: string | number
    isCopy?: boolean
  } = {},
) {
  const reportType = String(meta.reportType ?? data.reportType ?? 'X').toUpperCase()
  const reportAt = meta.reportAt ? new Date(meta.reportAt) : new Date()
  const isCopy = Boolean(meta.isCopy)

  const cashSales = Number(data.finalTotalCash ?? data.totalCash ?? data.CashAmount) || 0
  const cardSales = Number(data.totalCard ?? data.CreditCardAmount) || 0
  const onlineSales = Number(data.totalOnline ?? data.OnlineAmount) || 0
  const cashToCollect = Number(data.cashToBeCollected ?? data.AmountToBeCollected) || 0
  const collectedCash = Number(data.collectedCash ?? data.CollectedAmount) || 0
  const cashDifference = Number(data.cashDifference ?? data.CashDifference) || 0
  const taxableAmt = Number(data.TaxableAmount ?? data.taxableAmount) || 0
  const discountAmt = Number(data.totalDiscount ?? data.DiscountAmount) || 0
  const taxAmt = Number(data.totalTax ?? data.TaxAmount) || 0
  const totalAmt = Number(data.grossAmount ?? data.TotalAmount) || 0
  const totalTip = Number(data.totalTip ?? data.TipAmount) || 0
  const cashTip = Number(data.totalCashTip ?? data.CashTipAmount) || 0
  const cardTip = Number(data.totalCardTip ?? data.CardTipAmount) || 0

  const lines = [
    plainDivider(),
    ...(isCopy ? [center('Copy**'), plainDivider()] : []),
    center(`${reportType} - REPORT`),
    plainDivider(),
    pairLine('DATE', fmtReportDate(reportAt), 18, 30),
    pairLine('TIME', fmtReportTime(reportAt), 18, 30),
    pairLine('COUNTER', meta.counterNo ?? data.CounterNo ?? data.counterNo ?? '', 18, 30),
    pairLine('CLOSE #', meta.closeNo ?? data.closeNo ?? '-', 18, 30),
    plainDivider(),
    reportAmountLine('CASH SALES', cashSales),
    reportAmountLine('CREDIT CARD SALES', cardSales),
    reportAmountLine('ONLINE SALES', onlineSales),
    reportAmountLine('TOTAL CASH IN', Number(data.cashIn ?? data.CashIN) || 0),
    reportAmountLine('TOTAL CASH OUT', Number(data.cashOut ?? data.CashOUt) || 0),
    reportAmountLine('CASH TO BE COLLECTED', cashToCollect),
    reportAmountLine('COLLECTED CASH', collectedCash),
    reportAmountLine('CASH DIFFERENCE', cashDifference),
    plainDivider(),
    center('TOTAL SALES'),
    reportAmountLine('TAXABLE AMOUNT', taxableAmt),
    reportAmountLine('DISCOUNT', discountAmt),
    reportAmountLine('TAX AMOUNT', taxAmt),
    reportAmountLine('TOTAL AMOUNT', totalAmt),
  ]
  lines.push(reportAmountLine('TOTAL CASH TIPS', cashTip))
  lines.push(reportAmountLine('TOTAL CARD TIPS', cardTip))
  lines.push(reportAmountLine('TOTAL TIP', totalTip))

  const staffRows = Array.isArray(data.staffSales) ? data.staffSales : []
  if (staffRows.length) {
    lines.push(plainDivider())
    lines.push(center('STAFF WISE'))
    lines.push(
      fixedColumns([
        { value: 'Staff', width: 18 },
        { value: 'Bills', width: 6, align: 'right' },
        { value: 'Amount', width: 12, align: 'right' },
        { value: 'Tip', width: 12, align: 'right' },
      ]),
    )
    lines.push(plainDivider('.'))
    let totalBills = 0
    let totalSales = 0
    let tipSum = 0
    for (const row of staffRows) {
      const r = row as Record<string, unknown>
      const name = clean(r.staffName ?? 'Unknown')
      const bills = Number(r.billCount) || 0
      const sale = Number(r.saleAmount) || 0
      const tip = Number(r.tipAmount) || 0
      totalBills += bills
      totalSales += sale
      tipSum += tip
      lines.push(...wrapLines(name.toUpperCase(), 18))
      lines.push(
        fixedColumns([
          { value: '', width: 18 },
          { value: String(bills), width: 6, align: 'right' },
          { value: money(sale), width: 12, align: 'right' },
          { value: money(tip), width: 12, align: 'right' },
        ]),
      )
    }
    lines.push(plainDivider('.'))
    lines.push(
      fixedColumns([
        { value: 'TOTAL', width: 18 },
        { value: String(totalBills), width: 6, align: 'right' },
        { value: money(totalSales), width: 12, align: 'right' },
        { value: money(tipSum), width: 12, align: 'right' },
      ]),
    )
  }

  const commands: object[] = [
    ...companyHeaderCommands(meta),
    textBitmapCommand(lines),
  ]
  const footer1 = clean(meta.footer) || `${reportType} Report - End`
  commands.push(
    textBitmapCommand([plainDivider(), center(footer1)], {
      padding: 2,
      textSize: RECEIPT_HEADING_BITMAP.footer,
    }),
  )
  const footer2 = clean(meta.footer2)
  if (footer2) {
    commands.push(
      textBitmapCommand([center(footer2)], {
        padding: 0,
        textSize: RECEIPT_HEADING_BITMAP.h5,
      }),
    )
  }
  commands.push({ type: 'feed', lines: 2 })
  commands.push({ type: 'cut' })
  return commands
}

export async function printAndroidCounterReport(
  data: Record<string, unknown>,
  meta: PrintMeta & {
    reportType?: string
    closeNo?: string
    reportAt?: Date
    counterNo?: string | number
    isCopy?: boolean
  } = {},
) {
  return printAndroidCommands(buildCounterClosePrintCommands(data, meta))
}

export { SunmiPrinter }
