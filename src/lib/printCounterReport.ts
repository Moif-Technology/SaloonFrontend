/**
 * Thermal X/Z counter report print — Counter-pos printCounterReport style.
 */
import {
  buildReceiptDocumentHtml,
  escReceipt as esc,
  openReceiptPrintWindow,
} from './receiptPrintTheme'
import { fmtMoney } from '../utils/posSession'
import { counterCloseNum } from './counterCloseMapper'

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

function countRow(label: string, count: number, amount = 0) {
  return `
  <tr>
    <td>${esc(label)}</td>
    <td class="c">${count}</td>
    <td class="r">${fmtMoney(amount)}</td>
  </tr>`
}

export function buildCounterReportHtml(
  data: Record<string, unknown>,
  meta: {
    companyName?: string
    counterNo?: string | number
    reportType?: string
    closeNo?: string
    reportAt?: Date
  } = {},
) {
  const reportType = String(meta.reportType ?? data.reportType ?? 'X').toUpperCase()
  const reportAt = meta.reportAt ? new Date(meta.reportAt) : new Date()
  const coName = meta.companyName ?? 'MOIF TECHNOLOGY'

  const cashSales = counterCloseNum(data.totalCash ?? data.finalTotalCash)
  const creditReceived = counterCloseNum(data.creditReceiptCash ?? data.ReceiptAmount)
  const cashIn = counterCloseNum(data.cashIn ?? data.CashIN)
  const cashOut = counterCloseNum(data.cashOut ?? data.CashOUt)
  const refund = counterCloseNum(data.totalRefund ?? data.RefundAmount)
  const cashToCollect = counterCloseNum(data.cashToBeCollected ?? data.AmountToBeCollected)
  const collectedCash = counterCloseNum(data.collectedCash ?? data.CollectedAmount)
  const cashDifference = counterCloseNum(data.cashDifference ?? data.CashDifference)
  const creditSales = counterCloseNum(data.totalCredit ?? data.CreditAmount)
  const cardSales = counterCloseNum(data.totalCard ?? data.CreditCardAmount)
  const onlineSales = counterCloseNum(data.totalOnline ?? data.OnlineAmount)
  const receiptCard = counterCloseNum(data.creditReceiptCard ?? data.ReceiptAmountCCard)
  const voucherSales = counterCloseNum(data.totalVoucher ?? data.VoucherAmount)
  const totalDiscount = counterCloseNum(data.totalDiscount ?? data.DiscountAmount)
  const totalSales = counterCloseNum(data.grossAmount ?? data.TotalAmount)
  const taxAmount = counterCloseNum(data.totalTax ?? data.TaxAmount)

  const billCount = Number(data.billCount ?? data.BillCount ?? 0) || 0
  const cashBillCount = Number(data.cashBillCount ?? data.CashBillCount ?? 0) || 0
  const cardBillCount = Number(data.cardBillCount ?? data.CreditCardBillCount ?? 0) || 0
  const creditBillCount = Number(data.creditBillCount ?? data.CreditBillCount ?? 0) || 0
  const multiBillCount = Number(data.multiBillCount ?? data.MultiBillCount ?? 0) || 0
  const complimentBillCount = Number(data.complimentBillCount ?? data.ComplimentBillCount ?? 0) || 0

  const closeNo = String(meta.closeNo ?? data.closeNo ?? '')
  const counterNo = String(meta.counterNo ?? data.CounterNo ?? data.counterNo ?? '')

  const financialRows = [
    ['CASH SALES', cashSales],
    ['CREDIT RECEIVED', creditReceived],
    ['TOTAL CASH IN', cashIn],
    ['TOTAL CASH OUT', cashOut],
    ['REFUND', refund],
    ['CASH TO BE COLLECTED', cashToCollect],
    ['COLLECTED CASH', collectedCash],
    ['CASH DIFFERENCE', cashDifference],
    ['CREDIT SALES', creditSales],
    ['CREDIT CARD SALES', cardSales],
    ['ONLINE SALES', onlineSales],
    ['RECEIPT CREDIT CARD', receiptCard],
    ['VOUCHER SALES', voucherSales],
    ['TOTAL DISCOUNT', totalDiscount],
    ['TOTAL SALES', totalSales],
    ['TAX AMOUNT', taxAmount],
  ]
    .map(([label, val]) => amtRow(String(label), Number(val)))
    .join('')

  let staffBlock = ''
  const staffSales = data.staffSales
  if (Array.isArray(staffSales) && staffSales.length) {
    let totalBills = 0
    let totalAmt = 0
    const rows = staffSales
      .map((r) => {
        const row = r as Record<string, unknown>
        const name = String(row.staffName ?? 'Unknown')
        const bills = Number(row.billCount ?? 0) || 0
        const sale = Number(row.saleAmount ?? 0) || 0
        totalBills += bills
        totalAmt += sale
        return countRow(name.toUpperCase(), bills, sale)
      })
      .join('')
    staffBlock = `
  <hr class="dash" />
  <div class="xr-section">STAFF / USER WISE SALES</div>
  <table class="xr-table">
    <thead><tr><th>Staff</th><th class="c">Bills</th><th class="r">Sale Amt</th></tr></thead>
    <tbody>
      ${rows}
      <tr class="xr-total"><td>TOTAL</td><td class="c">${totalBills}</td><td class="r">${fmtMoney(totalAmt)}</td></tr>
    </tbody>
  </table>`
  }

  const extraCss = `
    .xr-title { text-align:center; font-size:15px; font-weight:800; margin:4px 0; }
    .xr-section { text-align:center; font-size:12px; font-weight:800; margin:6px 0 4px; letter-spacing:0.4px; }
    .xr-row { display:flex; justify-content:space-between; font-size:12px; font-weight:700; margin:2px 0; }
    .xr-lbl { flex:1; }
    .xr-val { flex-shrink:0; font-family: ui-monospace, monospace; }
    .xr-cols-head { display:flex; justify-content:space-between; font-size:11px; font-weight:800; border-bottom:1px dashed #000; padding-bottom:3px; margin-bottom:4px; }
    .xr-table { width:100%; border-collapse:collapse; font-size:11px; font-weight:700; margin:4px 0; }
    .xr-table th, .xr-table td { padding:2px 0; }
    .xr-table .c { text-align:center; }
    .xr-table .r { text-align:right; }
    .xr-total td { border-top:1px dashed #000; padding-top:4px; font-weight:800; }
  `

  const bodyHtml = `
  <div class="store-name">${esc(coName)}</div>
  <hr class="dash" />
  <div class="xr-title">${reportType} - REPORT</div>
  <hr class="dash" />
  <div class="xr-row"><span class="xr-lbl">DATE</span><span class="xr-val">${fmtReportDate(reportAt)}</span></div>
  <div class="xr-row"><span class="xr-lbl">TIME</span><span class="xr-val">${fmtReportTime(reportAt)}</span></div>
  <div class="xr-row"><span class="xr-lbl">COUNTER CLOSE#</span><span class="xr-val">${esc(closeNo || '—')}</span></div>
  <div class="xr-row"><span class="xr-lbl">COUNTER</span><span class="xr-val">${esc(counterNo)}</span></div>
  <div class="xr-row"><span class="xr-lbl">BILL COUNT</span><span class="xr-val">${billCount}</span></div>
  <div class="xr-row"><span class="xr-lbl">FIRST BILL</span><span class="xr-val">${esc(String(data.startBillNo ?? '—'))}</span></div>
  <div class="xr-row"><span class="xr-lbl">LAST BILL</span><span class="xr-val">${esc(String(data.endBillNo ?? '—'))}</span></div>
  <hr class="dash" />
  <div class="xr-cols-head"><span>Description</span><span>Amount</span></div>
  ${financialRows}
  <hr class="dash" />
  <div class="xr-section">BILL COUNT</div>
  <div class="xr-row"><span class="xr-lbl">CASH BILL</span><span class="xr-val">${cashBillCount}</span></div>
  <div class="xr-row"><span class="xr-lbl">CREDIT CARD BILL</span><span class="xr-val">${cardBillCount}</span></div>
  <div class="xr-row"><span class="xr-lbl">CREDIT BILL</span><span class="xr-val">${creditBillCount}</span></div>
  <div class="xr-row"><span class="xr-lbl">MULTI PAYMENT BILL</span><span class="xr-val">${multiBillCount}</span></div>
  <div class="xr-row"><span class="xr-lbl">COMPLIMENT BILL</span><span class="xr-val">${complimentBillCount}</span></div>
  ${staffBlock}
  <hr class="dash" />
  <div class="footer">${reportType} Report — End</div>
  `

  return buildReceiptDocumentHtml({
    title: `${reportType} Report`,
    bodyHtml,
    extraCss,
  })
}

export async function printCounterReport(
  data: Record<string, unknown>,
  meta: {
    companyName?: string
    counterNo?: string | number
    reportType?: string
    closeNo?: string
  } = {},
) {
  const html = buildCounterReportHtml(data, meta)
  openReceiptPrintWindow(html)
}
