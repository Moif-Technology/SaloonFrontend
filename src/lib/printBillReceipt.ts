/**
 * Tax Invoice thermal print — same design as Counter-pos printBillReceipt.js
 * Adapted for Salon POS viewer shape (salesMaster / salesItems).
 */
import { apiService } from '../api/apiService'
import { buildCode39Svg } from './barcodeSvg'
import {
  buildReceiptBarcodeBlockHtml,
  buildReceiptBillSummaryHtml,
  buildReceiptDiscountAdjustmentHtml,
  buildReceiptDocumentHtml,
  buildReceiptItemDescHtml,
  buildReceiptItemsTableHeadHtml,
  buildReceiptSettlementLineHtml,
  buildReceiptTaxDetailsHtml,
  buildReceiptTotalLineHtml,
  escReceipt as esc,
  formatDocBarcode,
  fmtMoney,
  fmtQty,
  fmtReceiptDateTime,
  openReceiptPrintWindow,
  RECEIPT_BARCODE_EXTRA_CSS,
  RECEIPT_LABELS,
  buildReceiptBiLabel,
} from './receiptPrintTheme'
import { getPosSession } from '../utils/posSession'
import {
  isSplitBill,
  normalizeBillPaymentMode,
  paymentModeLabel,
  splitPayModeLabel,
} from '../utils/paymentModes'
import type { PaymentSplit, SettleOrderData } from '../types/settlement'

export interface ReceiptBillItem {
  productId?: number | string
  productCode?: string
  description: string
  descriptionArabic?: string
  qty: number
  unitPrice: number
  lineTotal: number
  vatPer?: number
  vatAmt?: number
  discount?: number
}

export interface ReceiptBill {
  salesId?: string | number
  billNo?: string | number
  billDate?: string
  billTime?: string
  paymentMode?: string
  counterNo?: string | number
  staffName?: string
  remarks?: string
  taxableAmt?: number
  taxAmt?: number
  taxRate?: number
  discountAmt?: number
  roundOff?: number
  amount?: number
  paidAmount?: number
  balanceAmount?: number
  outstandingBalance?: number
  customerOsBalance?: number
  company?: {
    companyName?: string
    companyAddress?: string
    companyPhone?: string
    branchName?: string
    taxRegistrationNo?: string
  }
  customer?: {
    customerId?: string | number
    customerCode?: string
    customerName?: string
    address?: string
    taxRegNo?: string
    mobileNo?: string
    telephone?: string
  }
  items: ReceiptBillItem[]
  paymentSplits?: PaymentSplit[]
}

export interface PrintMeta {
  companyName?: string
  branchName?: string
  phone?: string
  address?: string
  trn?: string
  counterNo?: string | number
  /** Draft copy for customer (not a tax invoice) */
  draft?: boolean
}

function isWalkInCustomer(bill: ReceiptBill) {
  const c = bill?.customer
  if (!c?.customerId) return true
  const name = String(c.customerName ?? '').trim().toLowerCase()
  return !name || name === 'walk-in' || name === 'walkin' || name === 'walk in'
}

function resolveCompanyHeader(bill: ReceiptBill, meta: PrintMeta) {
  const co = bill.company ?? {}
  return {
    name: co.companyName ?? meta.companyName ?? 'MOIF TECHNOLOGY',
    address: co.companyAddress ?? meta.address ?? '',
    phone: co.companyPhone ?? meta.phone ?? '',
    branch: co.branchName ?? meta.branchName ?? '',
    trn: co.taxRegistrationNo ?? meta.trn ?? '',
  }
}

function lineUnitDisplay(it: ReceiptBillItem) {
  const qty = Math.abs(Number(it.qty) || 1)
  const total = Number(it.lineTotal) || 0
  if (qty > 0 && total) return fmtMoney(total / qty)
  return fmtMoney(it.unitPrice)
}

/** Map salon GET /salon-pos/sales/viewer/:id → Counter-style ReceiptBill */
export function mapSalonViewerBill(raw: Record<string, unknown>): ReceiptBill {
  const master = (raw.salesMaster ?? raw) as Record<string, unknown>
  const itemsRaw = (raw.salesItems ?? raw.items ?? []) as Record<string, unknown>[]
  const splitsRaw = (raw.paymentSplits ?? []) as Record<string, unknown>[]

  const paymentSplits = splitsRaw
    .map((s) => ({
      payMode: splitPayModeLabel(s.payMode ?? s.PayMode ?? 'CASH'),
      amount: Number(s.amount ?? s.Amount ?? s.bill_amount ?? 0),
      tip: Number(s.tip ?? s.Tip ?? s.tip_amount ?? 0),
      refNo: String(s.refNo ?? s.RefNo ?? s.ref_no ?? ''),
    }))
    .filter((s) => Number(s.amount) > 0 || Number(s.tip) > 0)

  const rawMode = master.PaymentMode ?? master.paymentMode ?? 'CASH'
  const paymentMode = isSplitBill(rawMode, paymentSplits)
    ? 'MULTIPAYMENT'
    : normalizeBillPaymentMode(rawMode)

  return {
    salesId: (master.SalesID ?? master.salesId) as string | number | undefined,
    billNo: (master.BillNo ?? master.billNo) as string | number | undefined,
    billDate: String(master.BillDate ?? master.billDate ?? ''),
    billTime: String(master.BillTime ?? master.billTime ?? master.BillDate ?? ''),
    paymentMode,
    counterNo: (master.CounterNo ?? master.counterNo ?? '') as string | number,
    staffName: String(master.CashierName ?? master.SalesManName ?? master.staffName ?? ''),
    remarks: String(master.Remarks ?? master.remarks ?? ''),
    taxableAmt: Number(master.TaxableAmount ?? master.taxableAmt ?? 0),
    taxAmt: Number(master.Tax1AmountM ?? master.taxAmt ?? 0),
    taxRate: Number(master.Tax1RateM ?? master.taxRate ?? 5),
    discountAmt: Number(master.DiscountAmount ?? master.discountAmt ?? 0),
    roundOff: Number(master.RoundOffAdj ?? master.roundOff ?? 0),
    amount: Number(master.Amount ?? master.amount ?? 0),
    paidAmount: Number(master.PaidAmount ?? master.paidAmount ?? master.Amount ?? 0),
    balanceAmount: Number(master.BalancePaid ?? master.balanceAmount ?? 0),
    customer: {
      customerId: (master.CustomerID ?? master.customerId) as string | number | undefined,
      customerCode: String(master.CustomerCode ?? master.customerCode ?? ''),
      customerName: String(master.CustomerName ?? master.customerName ?? 'Walk-in'),
      address: String(master.Address ?? master.address ?? ''),
      taxRegNo: String(master.TaxRegNo ?? master.taxRegNo ?? ''),
      mobileNo: String(master.MobileNo ?? master.mobileNo ?? ''),
      telephone: String(master.Telephone ?? master.telephone ?? ''),
    },
    items: itemsRaw.map((it) => ({
      productCode: String(it.BarCode ?? it.productCode ?? ''),
      description: String(it.ShortDescription ?? it.description ?? it.ItemName ?? 'Item'),
      descriptionArabic: String(it.DescriptionArabic ?? it.descriptionArabic ?? ''),
      qty: Number(it.Qty ?? it.qty ?? 0),
      unitPrice: Number(it.UnitPrice ?? it.unitPrice ?? 0),
      lineTotal: Number(it.LineTotal ?? it.lineTotal ?? it.SubTotalC ?? 0),
      vatPer: Number(it.Tax1RateC ?? it.vatPer ?? 5),
      vatAmt: Number(it.Tax1AmountC ?? it.vatAmt ?? 0),
      discount: Number(it.DiscountAmount ?? it.discount ?? it.discountAmount ?? 0),
    })),
    paymentSplits,
  }
}

/** Build a printable bill from settle payload + API result (fallback if viewer fails). */
export function billFromSettleResult(
  orderData: SettleOrderData,
  result: Record<string, unknown>,
): ReceiptBill {
  const session = getPosSession()
  const items = (orderData.items ?? []).map((it) => ({
    productId: it.productId,
    productCode: String(it.productId ?? ''),
    description: it.shortDescription || 'Item',
    descriptionArabic: it.arabicDescription || '',
    qty: Number(it.qty) || 0,
    unitPrice: Number(it.unitPrice) || 0,
    lineTotal: Number(it.subTotalC) + Number(it.tax1AmountC ?? 0),
    vatPer: Number(it.tax1RateC) || 5,
    vatAmt: Number(it.tax1AmountC) || 0,
  }))

  return {
    salesId: String(result.salesId ?? ''),
    billNo: String(result.billNo ?? ''),
    billDate: new Date().toISOString(),
    billTime: new Date().toISOString(),
    paymentMode: String(result.paymentMode ?? orderData.paymentMode ?? 'CASH'),
    counterNo: orderData.counterNo ?? session.counterNo,
    staffName: orderData.cashierName ?? session.staffName,
    remarks: orderData.comments || '',
    taxableAmt: orderData.taxableAmount ?? orderData.subTotal,
    taxAmt: orderData.tax1Amount ?? 0,
    taxRate: orderData.tax1Rate ?? 5,
    discountAmt: orderData.discountAmount ?? 0,
    roundOff: orderData.roundOffAdj ?? 0,
    amount: orderData.netAmount,
    paidAmount: Number(result.paidAmount ?? orderData.paidAmount ?? orderData.netAmount) || 0,
    balanceAmount: Number(result.balancePaid ?? 0) || 0,
    outstandingBalance: Number(result.outstandingBalance ?? 0) || 0,
    customer: {
      customerId: orderData.customerId,
      customerCode: orderData.customerCode,
      customerName: orderData.customerName,
      address: orderData.address,
      taxRegNo: orderData.taxRegNo,
      mobileNo: orderData.mobileNo,
    },
    items,
    paymentSplits: orderData.paymentSplits,
  }
}

export function buildBillReceiptHtml(bill: ReceiptBill, meta: PrintMeta = {}) {
  const co = resolveCompanyHeader(bill, meta)
  const isDraft = !!meta.draft
  const invoiceTitle = isDraft ? 'Draft Copy' : 'Tax Invoice'
  const invoiceTitleAr = isDraft ? 'مسودة' : 'فاتورة ضريبية'
  const docLabel = isDraft ? 'JOB #' : 'BILL #'

  const billNoLabel = String(bill.billNo ?? bill.salesId ?? '')
  const barcodeText = !isDraft ? formatDocBarcode(billNoLabel) : ''
  const barcodeSvg = barcodeText
    ? buildCode39Svg(barcodeText, { height: 64, printWidthMm: 68 })
    : ''

  const items = bill.items ?? []
  const itemCount = items.length
  const qtyTotal = items.reduce((s, it) => s + Math.abs(Number(it.qty) || 0), 0)

  const payMode = paymentModeLabel(bill.paymentMode, bill.paymentSplits)
  const settlement = isDraft
    ? 'PENDING'
    : isSplitBill(bill.paymentMode, bill.paymentSplits)
      ? 'M-Pay'
      : payMode

  const taxableAmt = Number(bill.taxableAmt) || 0
  const taxAmt = Number(bill.taxAmt) || 0
  const billAmount = Number(bill.amount) || 0
  const paidAmount = isDraft ? 0 : Number(bill.paidAmount ?? bill.amount) || 0
  const balAmount = isDraft ? billAmount : Number(bill.balanceAmount) || 0
  const discountAmt = Number(bill.discountAmt) || 0
  const roundOff = bill.roundOff != null ? Number(bill.roundOff) : 0

  const itemRows = items
    .map((it, idx) => {
      const vatPer = Number(it.vatPer) || Number(bill.taxRate) || 5
      const vatAmt = Number(it.vatAmt) || 0
      const code = it.productCode || (it.productId ? String(it.productId) : '')
      const isLast = idx === items.length - 1
      return `
      <tr class="item-main">
        <td class="desc">${buildReceiptItemDescHtml(it, esc)}</td>
        <td class="c">${fmtQty(it.qty)}</td>
        <td class="r">${lineUnitDisplay(it)}</td>
        <td class="r b">${fmtMoney(it.lineTotal)}</td>
      </tr>
      <tr class="item-sub${isLast ? ' item-sub-last' : ''}">
        <td colspan="2" class="sub">${esc(code)}</td>
        <td colspan="2" class="r sub">VAT@${vatPer}% (${fmtMoney(vatAmt)})</td>
      </tr>
    `
    })
    .join('')

  let customerBlock = ''
  if (!isWalkInCustomer(bill) && bill.customer) {
    const c = bill.customer
    const phone = [c.mobileNo, c.telephone].filter(Boolean).join(' / ')
    customerBlock = `
      <div class="dash"></div>
      <div class="row"><span class="lbl">Customer</span><span class="val">${esc(c.customerName)}</span></div>
      ${c.customerCode ? `<div class="row"><span class="lbl">Code</span><span class="val">${esc(c.customerCode)}</span></div>` : ''}
      ${c.taxRegNo ? `<div class="row"><span class="lbl">TRN</span><span class="val">${esc(c.taxRegNo)}</span></div>` : ''}
      ${phone ? `<div class="row"><span class="lbl">Tel</span><span class="val">${esc(phone)}</span></div>` : ''}
      ${c.address ? `<div class="row addr"><span class="lbl">Address</span><span class="val">${esc(c.address)}</span></div>` : ''}
    `
  } else if (bill.customer?.customerName) {
    customerBlock = `
      <div class="dash"></div>
      <div class="row"><span class="lbl">Customer</span><span class="val">${esc(bill.customer.customerName)}</span></div>
    `
  }

  let creditBlock = ''
  if (!isDraft && normalizeBillPaymentMode(bill.paymentMode) === 'CREDIT' && bill.customer?.customerId) {
    const os = Number(bill.customerOsBalance) || Number(bill.outstandingBalance) || 0
    creditBlock = `
      <div class="pair-row">
        <span></span>
        <span class="pair">${buildReceiptBiLabel(RECEIPT_LABELS.osBalance, ` : ${fmtMoney(os)}`)}</span>
      </div>
    `
  }

  let splitBlock = ''
  const splits = (bill.paymentSplits ?? []).filter((s) => Number(s.amount) > 0)
  if (!isDraft && isSplitBill(bill.paymentMode, splits) && splits.length) {
    splitBlock = `
      <div class="pair-row small" style="margin-top:4px"><span class="lbl"><b>Split Payment</b></span><span></span></div>
      ${splits
        .map(
          (s) => `
      <div class="pair-row small">
        <span class="lbl">${esc(splitPayModeLabel(s.payMode))}</span>
        <span class="val">${fmtMoney(Number(s.amount) || 0)}</span>
      </div>
    `,
        )
        .join('')}
    `
  }

  const phoneLine = co.phone ? `<div class="meta-line">Ph: ${esc(co.phone)}</div>` : ''
  const draftBanner = isDraft
    ? `<div class="draft-banner">*** DRAFT — FOR CUSTOMER REFERENCE ***<div class="draft-banner-ar">مسودة — ليست فاتورة ضريبية</div></div>`
    : ''

  const bodyHtml = `
  <div class="store-name">${esc(co.name)}</div>
  ${co.branch ? `<div class="meta-line">${esc(co.branch)}</div>` : ''}
  ${phoneLine}
  ${co.address ? `<div class="meta-line">${esc(co.address)}</div>` : ''}
  ${co.trn ? `<div class="meta-line">TRN: ${esc(co.trn)}</div>` : ''}

  <hr class="dash" />
  <div class="title-row">
    <span>${invoiceTitle}</span>
    <span class="title-ar">${invoiceTitleAr}</span>
  </div>
  ${draftBanner}
  <hr class="dash" />

  <div class="row">
    <span class="row-left"><span class="lbl">${docLabel}</span> : ${esc(billNoLabel)}</span>
    <span class="row-right">${fmtReceiptDateTime(bill.billTime ?? bill.billDate)}</span>
  </div>
  <div class="row">
    <span class="row-left"><span class="lbl">COUNTER</span> : ${esc(bill.counterNo ?? meta.counterNo ?? '')}</span>
    <span class="row-right"><span class="lbl">CASHIER</span> : ${esc(bill.staffName ?? 'CASHIER')}</span>
  </div>
  ${customerBlock}
  ${bill.remarks?.trim() ? `<div class="row"><span class="lbl">Comments</span><span class="val">${esc(bill.remarks.trim())}</span></div>` : ''}

  <hr class="dash" />
  <table class="items">
    <thead>
      ${buildReceiptItemsTableHeadHtml({ withPrice: true })}
    </thead>
    <tbody>
      ${itemRows || '<tr><td colspan="4" class="center">No items</td></tr>'}
    </tbody>
  </table>

  <hr class="dash" />
  ${buildReceiptDiscountAdjustmentHtml({ taxableAmt, discountAmt, roundOff, fmtMoney })}
  ${buildReceiptTotalLineHtml(billAmount, fmtMoney)}
  ${buildReceiptSettlementLineHtml(settlement, esc)}
  ${splitBlock}
  ${buildReceiptBillSummaryHtml({ itemCount, qtyTotal, billAmount, paidAmount, balAmount, fmtMoney, fmtQty })}
  ${creditBlock}

  <hr class="dash" />
  ${buildReceiptTaxDetailsHtml(taxableAmt, taxAmt, billAmount, fmtMoney)}

  ${
    !isDraft
      ? `<hr class="dash" />
  ${buildReceiptBarcodeBlockHtml({
    label: 'Scan for reprint',
    barcodeText,
    barcodeSvg,
    displayText: billNoLabel,
    esc,
  })}`
      : ''
  }

  <hr class="dash" />
  <div class="footer">${
    isDraft ? 'Draft Copy — Not a Tax Invoice' : 'Thank You......Visit Again'
  }</div>
  `

  const draftCss = isDraft
    ? `
  .draft-banner {
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.4px;
    margin: 4px 0 2px;
  }
  .draft-banner-ar {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    font-size: 11px;
    direction: rtl;
    margin-top: 2px;
  }
  `
    : ''

  return buildReceiptDocumentHtml({
    title: isDraft
      ? `Draft ${billNoLabel || 'Job'}`
      : barcodeText || billNoLabel || 'Receipt',
    bodyHtml,
    extraCss: RECEIPT_BARCODE_EXTRA_CSS + draftCss,
  })
}

export async function printBillFromData(bill: ReceiptBill, meta: PrintMeta = {}) {
  if (!bill) throw new Error('No bill data to print')
  const html = buildBillReceiptHtml(bill, meta)
  openReceiptPrintWindow(html)
}

/** Build receipt bill from open job (GET /job/:id) for draft print. */
export function billFromJobDetails(
  details: Record<string, unknown>,
  listRow?: Record<string, unknown>,
): ReceiptBill {
  const session = getPosSession()
  const master = (details.job ?? {}) as Record<string, unknown>
  const lines = (details.data ?? []) as Record<string, unknown>[]
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('This job has no items')
  }

  const jobId = String(master.JobID ?? master.jobId ?? lines[0]?.JobID ?? '')
  const jobNo = String(
    master.JobNo ?? master.jobNo ?? lines[0]?.JobNo ?? lines[0]?.KotNumber ?? jobId,
  ).trim()

  let taxable = 0
  let taxAmt = 0
  const items = lines.map((line) => {
    const qty = Number(line.Qty ?? line.qty ?? 0) || 0
    const unitPrice = Number(line.UnitPrice ?? line.unitPrice ?? 0) || 0
    const sub = Number(line.SubTotal ?? line.subTotal ?? qty * unitPrice) || 0
    const vatAmt = Number(line.Tax1AmountC ?? line.tax1AmountC ?? 0) || 0
    const vatPer = Number(line.Tax1RateC ?? line.tax1RateC ?? 5) || 5
    const lineTotal =
      Number(line.LineTotal ?? line.lineTotal ?? sub + vatAmt) || sub + vatAmt
    taxable += sub
    taxAmt += vatAmt
    return {
      productId: Number(line.ProductID ?? line.productID ?? 0) || undefined,
      productCode: String(line.BarCode ?? line.ProductID ?? line.productID ?? ''),
      description: String(line.ShortDescription ?? line.shortDescription ?? 'Item'),
      descriptionArabic: String(line.DescriptionArabic ?? ''),
      qty,
      unitPrice,
      lineTotal,
      vatPer,
      vatAmt,
    }
  })

  const amountFromMaster = Number(master.Amount ?? master.amount ?? 0)
  const amount = amountFromMaster || taxable + taxAmt
  const taxFromMaster = Number(master.Tax1Amount ?? master.tax1Amount ?? 0)
  const taxableFromMaster = Number(master.SubTotal ?? master.subTotal ?? 0)

  const customerName = String(
    listRow?.CustomerName ?? listRow?.customerName ?? master.CustomerName ?? 'Walk-in',
  )
  const mobile = String(
    listRow?.MobileNo ?? listRow?.mobileNo ?? master.MobileNo ?? '',
  ).trim()

  const startRaw =
    listRow?.StartTime ?? listRow?.KotTime ?? master.StartTime ?? master.startTime

  return {
    salesId: jobId,
    billNo: jobNo || jobId,
    billDate: startRaw ? String(startRaw) : new Date().toISOString(),
    billTime: startRaw ? String(startRaw) : new Date().toISOString(),
    paymentMode: 'CASH',
    counterNo: session.counterNo,
    staffName: String(
      listRow?.PrimaryStylistName ??
        listRow?.staffName ??
        master.PrimaryStylistName ??
        session.staffName ??
        'CASHIER',
    ),
    remarks: String(master.Remarks ?? master.remarks ?? ''),
    taxableAmt: taxableFromMaster || taxable,
    taxAmt: taxFromMaster || taxAmt,
    taxRate: 5,
    discountAmt: 0,
    roundOff: 0,
    amount,
    paidAmount: 0,
    balanceAmount: amount,
    customer: {
      customerId: (master.CustomerID ?? listRow?.CustomerID) as string | number | undefined,
      customerName,
      mobileNo: mobile,
    },
    items,
  }
}

/** Draft copy print from Job List — same layout as invoice, marked Draft. */
export async function printJobDraft(
  jobId: string | number,
  listRow?: Record<string, unknown>,
  meta: PrintMeta = {},
) {
  const session = getPosSession()
  const details = await apiService.fetchKotDetails(String(jobId))
  const bill = billFromJobDetails(details, listRow)
  await printBillFromData(bill, {
    companyName: 'MOIF TECHNOLOGY',
    counterNo: session.counterNo,
    ...meta,
    draft: true,
  })
  return bill
}

export async function printBillReceipt(salesId: string | number, meta: PrintMeta = {}) {
  const raw = await apiService.fetchSalesViewerBill(String(salesId))
  const bill = mapSalonViewerBill(raw)
  await printBillFromData(bill, meta)
  return bill
}

/** After settle: prefer viewer refetch (like Counter-pos), fallback to local payload. */
export async function printSettlementBill(opts: {
  salesId?: string | number
  orderData?: SettleOrderData
  settleResult?: Record<string, unknown>
  meta?: PrintMeta
}) {
  const session = getPosSession()
  const meta: PrintMeta = {
    companyName: 'MOIF TECHNOLOGY',
    counterNo: session.counterNo,
    ...opts.meta,
  }

  try {
    if (opts.salesId) {
      const raw = await apiService.fetchSalesViewerBill(String(opts.salesId))
      const bill = mapSalonViewerBill(raw)
      // Viewer may omit multi-pay splits — keep settle payload splits
      if ((!bill.paymentSplits || bill.paymentSplits.length === 0) && opts.orderData?.paymentSplits?.length) {
        bill.paymentSplits = opts.orderData.paymentSplits
        bill.paymentMode = opts.orderData.paymentMode ?? bill.paymentMode
      }
      if (opts.orderData?.paymentMode && !bill.paymentMode) {
        bill.paymentMode = opts.orderData.paymentMode
      }
      await printBillFromData(bill, meta)
      return
    }
  } catch {
    // fall through to local data
  }

  if (opts.orderData && opts.settleResult) {
    const bill = billFromSettleResult(opts.orderData, opts.settleResult)
    await printBillFromData(bill, meta)
    return
  }

  throw new Error('No bill data available to print')
}
