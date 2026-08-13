/**
 * Minimal thermal X/Z counter close print for Sunmi / browser.
 */
import { buildReceiptDocumentHtml, buildReceiptStoreHeaderHtml, escReceipt as esc, RECEIPT_FONT } from './receiptPrintTheme'
import { fmtMoney } from '../utils/posSession'
import { counterCloseNum } from './counterCloseMapper'
import type { PrintMeta } from './printBillReceipt'
import { receiptPrintMeta } from '../utils/receiptSettings'

function fmtReportDate(d = new Date()) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  const day = String(dt.getDate()).padStart(2, '0')
  const mon = dt.toLocaleString('en-GB', { month: 'short' }).toUpperCase()
  return `${day}/${mon}/${dt.getFullYear()}`
}

function fmtReportTime(d = new Date()) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function amtRow(label: string, value: number) {
  return `
  <div class="xr-row">
    <span class="xr-lbl">${esc(label)}</span>
    <span class="xr-val">${fmtMoney(value)}</span>
  </div>`
}

function companyHeaderHtml(meta: PrintMeta) {
  return buildReceiptStoreHeaderHtml(
    {
      heading1: meta.heading1 ?? meta.companyName,
      heading2: meta.heading2,
      heading3: meta.heading3,
      heading4: meta.heading4,
      heading5: meta.heading5,
      trn: meta.trn,
    },
    esc,
  )
}

export function buildCounterReportHtml(
  data: Record<string, unknown>,
  meta: {
    companyName?: string
    address?: string
    trn?: string
    footer?: string
    footer2?: string
    counterNo?: string | number
    reportType?: string
    closeNo?: string
    reportAt?: Date
  } = {},
) {
  const reportType = String(meta.reportType ?? data.reportType ?? 'X').toUpperCase()
  const reportAt = meta.reportAt ? new Date(meta.reportAt) : new Date()

  const cashSales = counterCloseNum(data.finalTotalCash ?? data.totalCash)
  const cardSales = counterCloseNum(data.totalCard ?? data.CreditCardAmount)
  const onlineSales = counterCloseNum(data.totalOnline ?? data.OnlineAmount)
  const cashToCollect = counterCloseNum(data.cashToBeCollected ?? data.AmountToBeCollected)
  const collectedCash = counterCloseNum(data.collectedCash ?? data.CollectedAmount)
  const cashDifference = counterCloseNum(data.cashDifference ?? data.CashDifference)
  const taxableAmt = counterCloseNum(data.TaxableAmount ?? data.taxableAmount)
  const discountAmt = counterCloseNum(data.totalDiscount ?? data.DiscountAmount)
  const taxAmt = counterCloseNum(data.totalTax ?? data.TaxAmount)
  const totalAmt = counterCloseNum(data.grossAmount ?? data.TotalAmount)
  const totalTip = counterCloseNum(data.totalTip ?? data.TipAmount)
  const cashTip = counterCloseNum(data.totalCashTip ?? data.CashTipAmount)
  const cardTip = counterCloseNum(data.totalCardTip ?? data.CardTipAmount)

  const counterNo = String(meta.counterNo ?? data.CounterNo ?? data.counterNo ?? '')
  const closeNo = String(meta.closeNo ?? data.closeNo ?? '')

  let staffBlock = ''
  const staffSales = data.staffSales
  if (Array.isArray(staffSales) && staffSales.length) {
    let totalBills = 0
    let totalSales = 0
    let tipSum = 0
    const rows = staffSales
      .map((r) => {
        const row = r as Record<string, unknown>
        const name = String(row.staffName ?? 'Unknown')
        const bills = Number(row.billCount ?? 0) || 0
        const sale = Number(row.saleAmount ?? 0) || 0
        const tip = Number(row.tipAmount ?? 0) || 0
        totalBills += bills
        totalSales += sale
        tipSum += tip
        return `
      <tr>
        <td>${esc(name)}</td>
        <td class="c">${bills}</td>
        <td class="r">${fmtMoney(sale)}</td>
        <td class="r">${fmtMoney(tip)}</td>
      </tr>`
      })
      .join('')
    staffBlock = `
  <hr class="dash" />
  <div class="xr-section">STAFF WISE</div>
  <table class="xr-table">
    <thead><tr><th>Staff</th><th class="c">Bills</th><th class="r">Amount</th><th class="r">Tip</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="xr-total"><td>TOTAL</td><td class="c">${totalBills}</td><td class="r">${fmtMoney(totalSales)}</td><td class="r">${fmtMoney(tipSum)}</td></tr>
    </tbody>
  </table>`
  }

  const footerMain = meta.footer?.trim() || `${reportType} Report — End`
  const footerExtra = meta.footer2?.trim() ?? ''

  const extraCss = `
    .xr-title { text-align:center; font-size:${RECEIPT_FONT.title}px; font-weight:700; margin:4px 0; }
    .xr-section { text-align:center; font-size:${RECEIPT_FONT.row}px; font-weight:700; margin:6px 0 4px; letter-spacing:0.4px; }
    .xr-row { display:flex; justify-content:space-between; font-size:${RECEIPT_FONT.row}px; font-weight:700; margin:3px 0; }
    .xr-lbl { flex:1; font-weight:700; }
    .xr-val { flex-shrink:0; font-family: "Courier New", Courier, monospace; font-weight:700; color:#000; }
    .xr-table { width:100%; border-collapse:collapse; font-size:${RECEIPT_FONT.items}px; font-weight:700; margin:4px 0; }
    .xr-table th { padding:3px 0; font-weight:700; }
    .xr-table td { padding:3px 0; font-weight:700; }
    .xr-table .c { text-align:center; }
    .xr-table .r { text-align:right; font-weight:700; color:#000; }
    .xr-total td { border-top:2px dashed #000; padding-top:4px; font-weight:700; }
  `

  const bodyHtml = `
  ${companyHeaderHtml(meta)}
  <hr class="dash" />
  <div class="xr-title">${reportType} - REPORT</div>
  <hr class="dash" />
  <div class="xr-row"><span class="xr-lbl">DATE</span><span class="xr-val">${fmtReportDate(reportAt)}</span></div>
  <div class="xr-row"><span class="xr-lbl">TIME</span><span class="xr-val">${fmtReportTime(reportAt)}</span></div>
  <div class="xr-row"><span class="xr-lbl">COUNTER</span><span class="xr-val">${esc(counterNo)}</span></div>
  <div class="xr-row"><span class="xr-lbl">CLOSE #</span><span class="xr-val">${esc(closeNo || '—')}</span></div>
  <hr class="dash" />
  ${amtRow('CASH SALES', cashSales)}
  ${amtRow('CREDIT CARD SALES', cardSales)}
  ${amtRow('ONLINE SALES', onlineSales)}
  ${amtRow('TOTAL CASH IN', counterCloseNum(data.cashIn ?? data.CashIN))}
  ${amtRow('TOTAL CASH OUT', counterCloseNum(data.cashOut ?? data.CashOUt))}
  ${amtRow('CASH TO BE COLLECTED', cashToCollect)}
  ${amtRow('COLLECTED CASH', collectedCash)}
  ${amtRow('CASH DIFFERENCE', cashDifference)}
  <hr class="dash" />
  <div class="xr-section">TOTAL SALES</div>
  ${amtRow('TAXABLE AMOUNT', taxableAmt)}
  ${amtRow('DISCOUNT', discountAmt)}
  ${amtRow('TAX AMOUNT', taxAmt)}
  ${amtRow('TOTAL AMOUNT', totalAmt)}
  ${amtRow('TOTAL CASH TIPS', cashTip)}
  ${amtRow('TOTAL CARD TIPS', cardTip)}
  ${amtRow('TOTAL TIP', totalTip)}
  ${staffBlock}
  <hr class="dash" />
  <div class="footer">${esc(footerMain)}</div>
  ${footerExtra ? `<div class="footer">${esc(footerExtra)}</div>` : ''}
  `

  return buildReceiptDocumentHtml({
    title: `${reportType} Report`,
    bodyHtml,
    extraCss,
    autoPrint: false,
  })
}

export async function printCounterReport(
  data: Record<string, unknown>,
  meta: {
    companyName?: string
    counterNo?: string | number
    reportType?: string
    closeNo?: string
    reportAt?: Date
  } = {},
) {
  const printMeta = receiptPrintMeta({
    counterNo: meta.counterNo,
    ...meta,
  })
  const html = buildCounterReportHtml(data, {
    ...printMeta,
    reportAt: meta.reportAt ?? new Date(),
  })
  const { isNativePosApp, printReceiptHtml } = await import('./androidPrinter')

  if (isNativePosApp()) {
    try {
      await printReceiptHtml(html)
      return
    } catch (err) {
      console.warn('HTML counter report failed, using command fallback:', err)
      const { printAndroidCounterReport } = await import('./androidPosPrinter')
      await printAndroidCounterReport(data, {
        ...printMeta,
        reportType: meta.reportType,
        closeNo: meta.closeNo,
        reportAt: meta.reportAt ?? new Date(),
      })
      return
    }
  }

  await printReceiptHtml(html)
}
