/** Maps Counter Close API JSON → Saloon-POS UI keys (counter_close_mapper.dart). */

export function counterCloseNum(v: unknown, d = 0): number {
  if (v == null) return d
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

export function counterCloseInt(v: unknown, d = 0): number {
  if (v == null) return d
  if (typeof v === 'number' && Number.isFinite(v)) return Math.trunc(v)
  const n = parseInt(String(v), 10)
  return Number.isFinite(n) ? n : d
}

function mapStaffSalesList(raw: unknown) {
  if (!Array.isArray(raw)) return [] as Record<string, unknown>[]
  return raw.map((e) => {
    if (!e || typeof e !== 'object') {
      return {
        staffId: null,
        staffName: 'Unknown',
        billCount: 0,
        saleAmount: 0,
        tipAmount: 0,
      }
    }
    const m = e as Record<string, unknown>
    return {
      staffId: m.staffId ?? m.staff_id,
      staffName: String(m.staffName ?? m.staff_name ?? m.CashierName ?? 'Unknown'),
      billCount: counterCloseInt(m.billCount ?? m.bill_count),
      saleAmount: counterCloseNum(m.saleAmount ?? m.sale_amount ?? m.grossAmount),
      tipAmount: counterCloseNum(m.tipAmount ?? m.tip_amount),
      refundAmount: counterCloseNum(m.refundAmount ?? m.refund_amount),
      cashAmount: counterCloseNum(m.cashAmount ?? m.cash_amount),
      cardAmount: counterCloseNum(m.cardAmount ?? m.card_amount),
      creditAmount: counterCloseNum(m.creditAmount ?? m.credit_amount),
    }
  })
}

export function mapCounterCloseForUi(
  api: Record<string, unknown>,
  opts?: {
    staffName?: string
    counterNo?: string | number
    collectedOverride?: number
    differenceOverride?: number
  },
): Record<string, unknown> {
  const totalCash = counterCloseNum(api.totalCash)
  const creditReceiptCash = counterCloseNum(api.creditReceiptCash)
  const cashIn = counterCloseNum(api.cashIn)
  const cashOut = counterCloseNum(api.cashOut)
  const refund = counterCloseNum(api.totalRefund)
  const cashToCollect = counterCloseNum(api.cashToBeCollected)
  const collected =
    opts?.collectedOverride != null
      ? opts.collectedOverride
      : counterCloseNum(api.collectedCash)
  const difference =
    opts?.differenceOverride != null
      ? opts.differenceOverride
      : counterCloseNum(api.cashDifference, collected - cashToCollect)
  const gross = counterCloseNum(api.grossAmount)
  const tax = counterCloseNum(api.totalTax)
  const counterNo = String(api.counterNo ?? opts?.counterNo ?? '')

  return {
    ...api,
    totalCash,
    totalCredit: counterCloseNum(api.totalCredit),
    totalCard: counterCloseNum(api.totalCard),
    totalOnline: counterCloseNum(api.totalOnline),
    totalVoucher: counterCloseNum(api.totalVoucher),
    totalDiscount: counterCloseNum(api.totalDiscount),
    itemDiscountTotal: counterCloseNum(api.itemDiscountTotal),
    totalRefund: refund,
    totalTax: tax,
    totalTip: counterCloseNum(api.totalTip ?? api.total_tip),
    totalCashTip: counterCloseNum(api.totalCashTip ?? api.total_cash_tip),
    totalCardTip: counterCloseNum(api.totalCardTip ?? api.total_card_tip),
    TipAmount: counterCloseNum(api.totalTip ?? api.total_tip),
    CashTipAmount: counterCloseNum(api.totalCashTip ?? api.total_cash_tip),
    CardTipAmount: counterCloseNum(api.totalCardTip ?? api.total_card_tip),
    grossAmount: gross,
    cashIn,
    cashOut,
    creditReceiptCash,
    creditReceiptCard: counterCloseNum(api.creditReceiptCard),
    cashToBeCollected: cashToCollect,
    collectedCash: collected,
    cashDifference: difference,

    AmountToBeCollected: cashToCollect,
    CollectedAmount: collected,
    CashDifference: difference,
    ReceiptAmount: creditReceiptCash,
    AdvanceReceived: 0,
    CashIN: cashIn,
    CashOUt: cashOut,
    finalTotalCash: totalCash - refund,
    RefundAmount: refund,
    CreditAmount: counterCloseNum(api.totalCredit),
    CreditCardAmount: counterCloseNum(api.totalCard),
    OnlineAmount: counterCloseNum(api.totalOnline),
    ReceiptAmountCCard: counterCloseNum(api.creditReceiptCard),
    VoucherAmount: counterCloseNum(api.totalVoucher),
    ComplimentAmount: 0,
    DiscountAmount: counterCloseNum(api.totalDiscount),
    TotalAmount: gross,
    TaxAmount: tax,
    TaxableAmount: Math.max(gross - tax, 0),
    BillCount: counterCloseInt(api.billCount),
    CashBillCount: counterCloseInt(api.cashBillCount),
    CreditCardBillCount: counterCloseInt(api.cardBillCount),
    MultiBillCount: counterCloseInt(api.multiBillCount),
    CreditBillCount: counterCloseInt(api.creditBillCount),
    ComplimentBillCount: counterCloseInt(api.complimentBillCount),
    CounterNo: counterNo,
    cashierName: opts?.staffName ?? String(api.staffName ?? ''),
    closeNo: String(api.closeNo ?? ''),
    reportType: String(api.reportType ?? ''),
    startBillNo: api.startBillNo,
    endBillNo: api.endBillNo,
    staffSales: mapStaffSalesList(api.staffSales),
    cashInOutList: Array.isArray(api.cashInOutList)
      ? (api.cashInOutList as Record<string, unknown>[]).map((e) => {
          if (!e || typeof e !== 'object') {
            return { id: null, transactionType: '', amount: 0, remarks: null }
          }
          const m = e as Record<string, unknown>
          return {
            id: m.id ?? null,
            transactionType: String(m.transactionType ?? m.transaction_type ?? ''),
            amount: counterCloseNum(m.amount),
            remarks: m.remarks != null ? String(m.remarks) : null,
            createdAt: m.createdAt ?? m.created_at ?? null,
          }
        })
      : [],
    totalCustomers: counterCloseInt(api.billCount),
  }
}
