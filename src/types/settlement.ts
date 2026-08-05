/** Bill-level payment modes — same as api/src/pos/salon/utils/paymentModes.js */
export type BillPaymentMode =
  | 'CASH'
  | 'CREDITCARD'
  | 'CREDIT'
  | 'MULTIPAYMENT'
  | 'ONLINE'
  | 'COMPLIMENT'

export type PaymentMethodLabel =
  | 'Cash'
  | 'Card'
  | 'Credit'
  | 'M-Pay'
  | 'Online'
  | 'Compliment'

export const PAYMENT_METHOD_TO_API: Record<PaymentMethodLabel, BillPaymentMode> = {
  Cash: 'CASH',
  Card: 'CREDITCARD',
  Credit: 'CREDIT',
  'M-Pay': 'MULTIPAYMENT',
  Online: 'ONLINE',
  Compliment: 'COMPLIMENT',
}

export const ONLINE_SOURCES = ['GHAYATHA', 'ONLINE', 'TALABAT', 'TM DONE'] as const

export const MULTI_PAY_MODES = ['CASH', 'CREDITCARD', 'ONLINE', 'VOUCHER'] as const

export interface PaymentSplit {
  payMode: string
  amount: number
  tip?: number
  refNo?: string
}

export interface SettleItem {
  productId: number
  kotChildID?: number
  uniqueMultiProductId?: number
  shortDescription: string
  arabicDescription?: string
  groupId?: number
  qty: number
  unitPrice: number
  unitCost?: number
  packQty?: number
  discount?: number
  subTotalC: number
  tax1RateC?: number
  tax1AmountC?: number
  tax2RateC?: number
  tax2AmountC?: number
  tax3RateC?: number
  tax3AmountC?: number
  lineId?: number
  stylistId?: number
  lineType?: string
}

export interface SettleOrderData {
  kotId: number
  jobId?: number
  counterNo: number
  stationId: number
  customerId: number
  waiterId?: number
  tableId?: number
  areaId?: number
  noOfCustomer?: number
  subTotal: number
  subTotalM: number
  discountAmount: number
  taxableAmount: number
  tax1Amount: number
  tax1AmountM: number
  tax1Rate: number
  tax1RateM: number
  tax2AmountM?: number
  tax2RateM?: number
  tax3AmountM?: number
  tax3RateM?: number
  roundOffAdj?: number
  netAmount: number
  paidCurrency?: string
  dbLocation?: string
  items: SettleItem[]
  jobNo?: string | null
  kotNumber?: string | null
  cashierName?: string
  orderType?: string
  comments?: string
  customerName?: string
  customerCode?: string
  mobileNo?: string
  address?: string
  taxRegNo?: string
  stylistName?: string
  paidAmount?: number
  paymentMode?: BillPaymentMode
  paymentSplits?: PaymentSplit[]
  onlineSource?: string
  paymentRefNo?: string
  complimentApprovedBy?: string
}

export interface SettleResult {
  ok: boolean
  success?: boolean
  salesId: string
  billNo: string
  jobId?: string
  jobNo?: string
  paymentMode?: string
  balancePaid?: string | number
  outstandingBalance?: string | number
  message?: string
}

export interface CreditCustomer {
  customerId: string
  customerCode: string
  customerName: string
  osAmount: number
  mobileNo?: string
  telephone?: string
  address?: string
  taxRegNo?: string
}

export interface JobSaveResult {
  ok?: boolean
  success?: boolean
  jobId?: string
  currentJobId?: string
  CurrentKOTID?: string
  jobNo?: string
  message?: string
  msg?: string
  kotDetails?: { success?: boolean; data?: Record<string, unknown>[] }
  data?: Record<string, unknown>[]
}
