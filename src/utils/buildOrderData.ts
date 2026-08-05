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

/** Payload for POST /salon-pos/job/save before settle (unsaved cart path). */
export function buildJobSavePayload(billItems: BillItem[], taxRate = DEFAULT_TAX_RATE) {
  const session = getPosSession()
  const items = billItems.map((item) => {
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
  return {
    StationID: session.stationId,
    stationId: session.stationId,
    PrimaryStylistID: session.staffId,
    gvCashierID: session.staffId,
    gvUserName: session.staffName,
    gvCounterNo: String(session.counterNo),
    CustomerID: 0,
    customerId: 0,
    txtDiscount: 0,
    lblSubTotalAmt: sub,
    lblTax1Total: tax,
    lblRound: 0,
    lblBillTotal: sub + tax,
    txtNoofCustomer: 0,
    txtRemarks: '',
    btnname: 'JobSave',
    Items: items,
    items,
  }
}
