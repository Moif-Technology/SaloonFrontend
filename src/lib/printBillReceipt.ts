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
  buildReceiptStoreHeaderHtml,
  buildReceiptTaxDetailsHtml,
  buildReceiptTotalLineHtml,
  escReceipt as esc,
  formatDocBarcode,
  fmtMoney,
  fmtQty,
  fmtReceiptDateTime,
  RECEIPT_BARCODE_EXTRA_CSS,
  RECEIPT_LABELS,
  buildReceiptBiLabel,
  receiptInvoiceTitles,
  hasCompanyTaxNumber,
} from './receiptPrintTheme'
import { getPosSession } from '../utils/posSession'
import { receiptPrintMeta } from '../utils/receiptSettings'
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
  /** Tip when not stored on split rows (single-tender settle). */
  tipAmount?: number
  jobNo?: string
  stylistName?: string
  chairNo?: string | number
}

export interface PrintMeta {
  companyName?: string
  heading1?: string
  heading2?: string
  heading3?: string
  heading4?: string
  heading5?: string
  branchName?: string
  phone?: string
  address?: string
  trn?: string
  footer?: string
  footer2?: string
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

export function billTipTotal(bill: ReceiptBill): number {
  const fromSplits = (bill.paymentSplits ?? []).reduce(
    (sum, s) => sum + (Number(s.tip) || 0),
    0,
  )
  if (fromSplits > 0.001) return fromSplits
  return Number(bill.tipAmount) || 0
}

/** Active tender rows for receipt / viewer (amount or tip). */
export function activePaymentSplits(bill: ReceiptBill): PaymentSplit[] {
  return (bill.paymentSplits ?? []).filter(
    (s) => Number(s.amount) > 0 || Number(s.tip) > 0,
  )
}

function resolveReceiptHeadings(bill: ReceiptBill, meta: PrintMeta) {
  const co = bill.company ?? {}
  let h1 = String(meta.heading1 ?? co.companyName ?? meta.companyName ?? '').trim()
  let h2 = String(meta.heading2 ?? '').trim()
  let h3 = String(meta.heading3 ?? '').trim()
  let h4 = String(meta.heading4 ?? '').trim()
  let h5 = String(meta.heading5 ?? '').trim()

  if (!h2 && !h3 && !h4 && !h5 && meta.address) {
    const legacy = String(meta.address)
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
    if (!h1 && legacy[0]) h1 = legacy[0]
    if (legacy.length > 1 && !h2) h2 = legacy[1]
    if (legacy.length > 2 && !h3) h3 = legacy[2]
    if (legacy.length > 3 && !h4) h4 = legacy[3]
    if (legacy.length > 4 && !h5) h5 = legacy[4]
  }

  if (!h1 && co.companyAddress) {
    h1 = String(co.companyName ?? meta.companyName ?? 'MOIF TECHNOLOGY').trim()
  }

  return {
    heading1: h1,
    heading2: h2,
    heading3: h3,
    heading4: h4,
    heading5: h5,
    trn: String(co.taxRegistrationNo ?? meta.trn ?? '').trim(),
    branch: String(co.branchName ?? meta.branchName ?? '').trim(),
    phone: String(co.companyPhone ?? meta.phone ?? '').trim(),
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
      payMode: String(s.payMode ?? s.PayMode ?? 'CASH'),
      amount: Number(s.amount ?? s.Amount ?? s.bill_amount ?? 0),
      tip: Number(s.tip ?? s.Tip ?? s.tip_amount ?? 0),
      refNo: String(s.refNo ?? s.RefNo ?? s.ref_no ?? ''),
    }))
    .filter((s) => Number(s.amount) > 0 || Number(s.tip) > 0)

  const rawMode = master.PaymentMode ?? master.paymentMode ?? 'CASH'
  const paymentMode = normalizeBillPaymentMode(rawMode)

  return {
    salesId: (master.SalesID ?? master.salesId) as string | number | undefined,
    billNo: (master.BillNo ?? master.billNo) as string | number | undefined,
    billDate: String(master.BillDate ?? master.billDate ?? ''),
    billTime: String(master.BillTime ?? master.billTime ?? master.BillDate ?? ''),
    paymentMode,
    counterNo: (master.CounterNo ?? master.counterNo ?? '') as string | number,
    staffName: String(master.CashierName ?? master.SalesManName ?? master.staffName ?? ''),
    jobNo: String(master.JobNo ?? master.jobNo ?? master.KotNumber ?? master.kotNumber ?? ''),
    stylistName: String(
      master.StylistName ?? master.stylistName ?? master.SalesManName ?? '',
    ),
    chairNo: (master.ChairNo ?? master.chairNo ?? master.StationID ?? master.stationId ?? '') as
      | string
      | number,
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
    jobNo: String(orderData.jobNo ?? orderData.kotNumber ?? result.jobNo ?? '').trim() || undefined,
    stylistName: orderData.stylistName ?? '',
    chairNo: orderData.stationId ?? session.stationId,
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
    tipAmount: Number(orderData.tipAmount) || 0,
  }
}

export function buildBillReceiptHtml(bill: ReceiptBill, meta: PrintMeta = {}) {
  const headings = resolveReceiptHeadings(bill, meta)
  const isDraft = !!meta.draft
  const hasTrn = hasCompanyTaxNumber(headings.trn)
  const { en: invoiceTitle, ar: invoiceTitleAr } = receiptInvoiceTitles({
    trn: headings.trn,
    draft: isDraft,
  })

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
      ? 'MULTIPAYMENT'
      : payMode

  const taxableAmt = Number(bill.taxableAmt) || 0
  const taxAmt = Number(bill.taxAmt) || 0
  const billAmount = Number(bill.amount) || 0
  const paidAmount = isDraft ? 0 : Number(bill.paidAmount ?? bill.amount) || 0
  const tipTotal = isDraft ? 0 : billTipTotal(bill)
  const balAmount = isDraft ? billAmount : Number(bill.balanceAmount) || 0
  const discountAmt = Number(bill.discountAmt) || 0
  const roundOff = bill.roundOff != null ? Number(bill.roundOff) : 0

  const itemRows = items
    .map((it, idx) => {
      const vatPer = Number(it.vatPer) || Number(bill.taxRate) || 5
      const vatAmt = Number(it.vatAmt) || 0
      const isLast = idx === items.length - 1
      const vatRow = hasTrn
        ? `<tr class="item-sub${isLast ? ' item-sub-last' : ''}">
        <td colspan="4" class="r sub">VAT@${vatPer}% (${fmtMoney(vatAmt)})</td>
      </tr>`
        : ''
      return `
      <tr class="item-main">
        <td class="desc">${buildReceiptItemDescHtml(it, esc)}</td>
        <td class="c">${fmtQty(it.qty)}</td>
        <td class="r">${lineUnitDisplay(it)}</td>
        <td class="r b">${fmtMoney(it.lineTotal)}</td>
      </tr>
      ${vatRow}
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
  const splits = activePaymentSplits(bill)
  if (!isDraft && isSplitBill(bill.paymentMode, splits) && splits.length) {
    const tipSum = splits.reduce((a, s) => a + (Number(s.tip) || 0), 0)
    splitBlock = `
      <div class="pair-row small" style="margin-top:4px">
        <span class="lbl"><b>Split Payment</b></span>
        <span class="val">${splits.length} tender${splits.length === 1 ? '' : 's'}</span>
      </div>
      ${splits
        .map((s) => {
          const tip = Number(s.tip) || 0
          const mode = splitPayModeLabel(s.payMode)
          const tipRow =
            tip > 0.001
              ? `
      <div class="pair-row small">
        <span class="lbl">${esc(mode)} Tip</span>
        <span class="val">${fmtMoney(tip)}</span>
      </div>`
              : ''
          return `
      <div class="pair-row small">
        <span class="lbl">${esc(mode)}</span>
        <span class="val">${fmtMoney(Number(s.amount) || 0)}</span>
      </div>${tipRow}`
        })
        .join('')}
      ${
        tipSum > 0.001
          ? `
      <div class="pair-row small">
        <span class="lbl"><b>Tip Total</b></span>
        <span class="val">${fmtMoney(tipSum)}</span>
      </div>`
          : ''
      }
    `
  } else if (!isDraft && tipTotal > 0.001) {
    splitBlock = `
      <div class="pair-row small">
        <span class="lbl">${buildReceiptBiLabel(RECEIPT_LABELS.tip)}</span>
        <span class="val">${fmtMoney(tipTotal)}</span>
      </div>
    `
  }

  const footerMain =
    meta.footer?.trim() ||
    (isDraft ? 'Draft Copy — Not a Tax Invoice' : 'Thank You......Visit Again')
  const footerExtra = meta.footer2?.trim() ?? ''
  const draftBanner = isDraft
    ? `<div class="draft-banner">*** DRAFT — FOR CUSTOMER REFERENCE ***<div class="draft-banner-ar">مسودة — ليست فاتورة ضريبية</div></div>`
    : ''

  const bodyHtml = `
  ${buildReceiptStoreHeaderHtml(headings, esc)}

  <hr class="dash" />
  <div class="title-row">
    <span>${invoiceTitle}</span>
    <span class="title-ar">${invoiceTitleAr}</span>
  </div>
  ${draftBanner}
  <hr class="dash" />

  <div class="row">
    <span class="row-left"><span class="lbl">BILL #</span> : ${esc(billNoLabel)}</span>
    <span class="row-right">${fmtReceiptDateTime(bill.billTime ?? bill.billDate)}</span>
  </div>
  ${
    bill.jobNo
      ? `<div class="row">
    <span class="row-left"><span class="lbl">JOB #</span> : ${esc(bill.jobNo)}</span>
    <span class="row-right"></span>
  </div>`
      : ''
  }
  <div class="row">
    <span class="row-left"><span class="lbl">COUNTER</span> : ${esc(bill.counterNo ?? meta.counterNo ?? '')}</span>
    <span class="row-right"><span class="lbl">CASHIER</span> : ${esc(bill.staffName ?? 'CASHIER')}</span>
  </div>
  <div class="row">
    <span class="row-left"><span class="lbl">CHAIR</span> : ${esc(bill.chairNo ?? '')}</span>
    <span class="row-right"><span class="lbl">STYLIST</span> : ${esc(bill.stylistName ?? '')}</span>
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
  ${buildReceiptDiscountAdjustmentHtml({ taxableAmt, discountAmt, roundOff, fmtMoney, showTaxLabels: hasTrn })}
  ${buildReceiptTotalLineHtml(billAmount, fmtMoney)}
  ${buildReceiptSettlementLineHtml(settlement, esc)}
  ${splitBlock}
  ${buildReceiptBillSummaryHtml({ itemCount, qtyTotal, billAmount, paidAmount, balAmount, tipTotal, fmtMoney, fmtQty })}
  ${creditBlock}

  ${
    hasTrn
      ? `<hr class="dash" />
  ${buildReceiptTaxDetailsHtml(taxableAmt, taxAmt, billAmount, fmtMoney)}`
      : ''
  }

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
  <div class="footer">${esc(footerMain)}</div>
  ${footerExtra ? `<div class="footer">${esc(footerExtra)}</div>` : ''}
  `

  const draftCss = isDraft
    ? `
  .draft-banner {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.4px;
    margin: 4px 0 2px;
  }
  .draft-banner-ar {
    font-family: "Segoe UI", Tahoma, Arial, sans-serif;
    font-size: 15px;
    font-weight: 700;
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
  const { isNativePosApp, printReceiptHtml } = await import('./androidPrinter')

  if (isNativePosApp()) {
    try {
      await printReceiptHtml(html)
      return
    } catch (err) {
      console.warn('HTML receipt print failed, using command fallback:', err)
      const { printAndroidBill } = await import('./androidPosPrinter')
      await printAndroidBill(bill, meta)
      return
    }
  }

  await printReceiptHtml(html)
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
  await printBillFromData(
    bill,
    receiptPrintMeta({
      counterNo: session.counterNo,
      ...meta,
      draft: true,
    }),
  )
  return bill
}

export async function printBillReceipt(salesId: string | number, meta: PrintMeta = {}) {
  const raw = await apiService.fetchSalesViewerBill(String(salesId))
  const bill = mapSalonViewerBill(raw)
  await printBillFromData(bill, receiptPrintMeta(meta))
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
  const meta: PrintMeta = receiptPrintMeta({
    counterNo: session.counterNo,
    ...opts.meta,
  })

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
      if (Number(opts.orderData?.tipAmount) > 0 && !(billTipTotal(bill) > 0.001)) {
        bill.tipAmount = Number(opts.orderData?.tipAmount) || 0
      }
      if (opts.orderData?.jobNo) bill.jobNo = String(opts.orderData.jobNo)
      if (opts.orderData?.stylistName) bill.stylistName = opts.orderData.stylistName
      if (opts.orderData?.stationId) bill.chairNo = opts.orderData.stationId
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
