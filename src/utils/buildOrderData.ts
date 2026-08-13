import type { BillItem } from '../types/pos'
import type { SettleItem, SettleOrderData } from '../types/settlement'
import { getPosSession, parseProductId } from './posSession'

const DEFAULT_TAX_RATE = 5

function lineTaxRate(item: BillItem, fallback: number) {
  return item.taxRate ?? fallback
}

export function buildSettleItems(billItems: BillItem[], taxRate = DEFAULT_TAX_RATE): SettleItem[] {
  const session = getPosSession()
  return billItems.map((item) => {
    const qty = item.qty
    const unitPrice = item.price
    const discount = 0
    const rate = lineTaxRate(item, taxRate)
    const subTotalC = qty * unitPrice - discount
    const tax1AmountC = (subTotalC * rate) / 100
    const lineType = (item.lineType || 'PRODUCT').toUpperCase()
    return {
      productId: parseProductId(item.productId),
      shortDescription: item.name,
      arabicDescription: '',
      groupId: item.groupId ?? 0,
      qty,
      unitPrice,
      unitCost: 0,
      packQty: 1,
      discount,
      subTotalC,
      tax1RateC: rate,
      tax1AmountC,
      tax2RateC: 0,
      tax2AmountC: 0,
      tax3RateC: 0,
      tax3AmountC: 0,
      lineId: item.lineId,
      stylistId: item.stylistId ?? (session.staffId || undefined),
      lineType,
    }
  })
}

export function buildOrderData(opts: {
  billItems: BillItem[]
  jobId: number
  jobNo?: string | null
  discountAmount?: number
  customerId?: number
  customerName?: string
  taxRate?: number
}): SettleOrderData {
  const session = getPosSession()
  const taxRate = opts.taxRate ?? DEFAULT_TAX_RATE
  const items = buildSettleItems(opts.billItems, taxRate)
  const subTotal = items.reduce((s, i) => s + i.subTotalC, 0)
  const tax1Amount = items.reduce((s, i) => s + (i.tax1AmountC ?? 0), 0)
  const discountAmount = opts.discountAmount ?? 0
  const taxableBefore = subTotal
  const disc = Math.min(Math.max(discountAmount, 0), taxableBefore)
  const ratio = taxableBefore > 0 ? (taxableBefore - disc) / taxableBefore : 1
  const taxableAmount = Math.round((taxableBefore - disc) * 100) / 100
  const taxAfter = Math.round(tax1Amount * ratio * 100) / 100
  const netAmount = Math.max(Math.round((taxableAmount + taxAfter) * 100) / 100, 0)

  return {
    kotId: opts.jobId,
    jobId: opts.jobId,
    counterNo: session.counterNo,
    stationId: session.stationId,
    customerId: opts.customerId ?? 0,
    waiterId: session.staffId,
    tableId: 0,
    areaId: 0,
    noOfCustomer: 0,
    subTotal,
    subTotalM: subTotal,
    discountAmount: disc,
    taxableAmount,
    tax1Amount: taxAfter,
    tax1AmountM: taxAfter,
    tax1Rate: taxableAmount > 0 && taxAfter > 0 ? (taxAfter / taxableAmount) * 100 : taxRate,
    tax1RateM: taxableAmount > 0 && taxAfter > 0 ? (taxAfter / taxableAmount) * 100 : taxRate,
    tax2AmountM: 0,
    tax2RateM: 0,
    tax3AmountM: 0,
    tax3RateM: 0,
    roundOffAdj: 0,
    netAmount,
    paidCurrency: 'AED',
    dbLocation: 'LOCAL',
    items,
    jobNo: opts.jobNo ?? null,
    kotNumber: opts.jobNo ?? null,
    cashierName: session.staffName,
    orderType: 'WALK-IN',
    comments: '',
    customerName: opts.customerName ?? 'Walk-in',
    customerCode: '',
    mobileNo: '',
    address: '',
    taxRegNo: '',
    stylistName: session.staffName,
  }
}

function isSavedJobLine(item: BillItem) {
  return Number(item.lineId) > 0
}

/** Payload for POST /salon-pos/job/save before settle (create or append). */
export function buildJobSavePayload(
  billItems: BillItem[],
  opts?: {
    taxRate?: number
    customerId?: number
    /** Existing open job — append new lines only + sync discount */
    jobId?: number
    discountAmount?: number
  },
) {
  const session = getPosSession()
  const taxRate = opts?.taxRate ?? DEFAULT_TAX_RATE
  const customerId = Number(opts?.customerId) > 0 ? Number(opts?.customerId) : 0
  const existingJobId = Number(opts?.jobId) > 0 ? Number(opts?.jobId) : 0
  const discountAmount = Math.max(0, Number(opts?.discountAmount) || 0)

  // Append path: only send lines that are not yet on the job (no lineId).
  // Sending existing lines again would duplicate them on the server.
  const sourceItems =
    existingJobId > 0 ? billItems.filter((item) => !isSavedJobLine(item)) : billItems

  const items = sourceItems.map((item) => {
    const qty = item.qty
    const rate = item.price
    const taxP = lineTaxRate(item, taxRate)
    const st = qty * rate
    const taxA = (st * taxP) / 100
    const lineType = (item.lineType || 'PRODUCT').toUpperCase()
    return {
      ProductID: parseProductId(item.productId),
      productId: parseProductId(item.productId),
      ItemName: item.name,
      ShortDescription: item.name,
      Qty: qty,
      UnitPrice: rate,
      SubTotal: st,
      TaxPerc: taxP,
      Tax1Rate: taxP,
      Tax1RateC: taxP,
      TaxAmount: taxA,
      Tax1AmountC: taxA,
      ItemDisc: 0,
      LineTotal: st + taxA,
      GroupID: item.groupId ?? 0,
      groupId: item.groupId ?? 0,
      StylistID: item.stylistId ?? session.staffId,
      stylistId: item.stylistId ?? session.staffId,
      LineType: lineType,
      lineType,
    }
  })
  const sub = items.reduce((s, i) => s + Number(i.SubTotal), 0)
  const tax = items.reduce((s, i) => s + Number(i.TaxAmount), 0)
  const payload: Record<string, unknown> = {
    StationID: session.stationId,
    stationId: session.stationId,
    PrimaryStylistID: session.staffId,
    gvCashierID: session.staffId,
    gvUserName: session.staffName,
    gvCounterNo: String(session.counterNo),
    CustomerID: customerId,
    customerId,
    mfCustomerID: customerId,
    txtDiscount: discountAmount,
    BillDiscount: discountAmount,
    billDiscount: discountAmount,
    lblSubTotalAmt: sub,
    lblTax1Total: tax,
    lblRound: 0,
    lblBillTotal: Math.max(sub + tax - discountAmount, 0),
    txtNoofCustomer: 0,
    txtRemarks: '',
    btnname: 'JobSave',
    Items: items,
    items,
  }
  if (existingJobId > 0) {
    payload.CurrentJobID = existingJobId
    payload.currentJobId = existingJobId
    payload.CurrentKOTID = existingJobId
    payload.currentKotId = existingJobId
  }
  return payload
}

/** Map job/save response lines onto the open bill (keeps client row ids where possible). */
export function mergeJobSaveLines(
  current: BillItem[],
  serverLines: Record<string, unknown>[],
  jobId: number,
): BillItem[] {
  if (!Array.isArray(serverLines) || !serverLines.length) return current

  const unused = [...current]
  return serverLines.map((line, idx) => {
    const lineId = Number(line.LineID ?? line.lineId ?? line.KotChildID ?? 0) || undefined
    const productId = Number(line.ProductID ?? line.productId ?? 0) || 0
    const qty = Number(line.Qty ?? line.qty ?? 0) || 0
    const price = Number(line.UnitPrice ?? line.unitPrice ?? 0) || 0
    const stylistId = Number(line.StylistID ?? line.stylistId ?? 0) || undefined
    const groupId = Number(line.GroupID ?? line.groupId ?? 0) || 0
    const taxRate = Number(line.Tax1RateC ?? line.tax1RateC ?? 5) || 5
    const lineType = String(line.LineType ?? line.lineType ?? 'PRODUCT')
    const name = String(line.ShortDescription ?? line.shortDescription ?? 'Item')

    let matchIdx = -1
    if (lineId) {
      matchIdx = unused.findIndex((i) => Number(i.lineId) === lineId)
    }
    if (matchIdx < 0) {
      matchIdx = unused.findIndex(
        (i) =>
          !(Number(i.lineId) > 0) &&
          Number(i.productId) === productId &&
          Number(i.qty) === qty &&
          Number(i.price) === price,
      )
    }
    const prev = matchIdx >= 0 ? unused.splice(matchIdx, 1)[0] : null

    return {
      id: prev?.id ?? `job-${jobId}-line-${lineId ?? idx}`,
      productId: productId || prev?.productId || 0,
      name: name || prev?.name || 'Item',
      qty: qty || prev?.qty || 1,
      price: price || prev?.price || 0,
      groupId: groupId || prev?.groupId || 0,
      taxRate: taxRate || prev?.taxRate || 5,
      lineId,
      stylistId: stylistId ?? prev?.stylistId,
      lineType: lineType || prev?.lineType || 'PRODUCT',
    }
  })
}
