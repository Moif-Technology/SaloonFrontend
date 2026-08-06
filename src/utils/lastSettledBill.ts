/**
 * Persist last settled bill so Bill Print works after PIN logout/login.
 */
import type { SettleOrderData } from '../types/settlement'
import { getPosSession } from './posSession'
import { SessionManager } from './sessionManager'

const KEY = 'salon_last_settled_bill'

export type LastSettledBill = {
  salesId: string
  billNo?: string
  companyId: string
  counterNo: number
  orderData: SettleOrderData
  settleResult: Record<string, unknown>
  settledAt: string
}

function scopeKey(): string {
  const companyId = SessionManager.companyId || ''
  const counterNo = getPosSession().counterNo || 0
  return `${KEY}:${companyId}:${counterNo}`
}

export function saveLastSettledBill(opts: {
  salesId: string | number
  billNo?: string | number
  orderData: SettleOrderData
  settleResult: Record<string, unknown>
}): void {
  const salesId = String(opts.salesId ?? '').trim()
  if (!salesId) return
  const payload: LastSettledBill = {
    salesId,
    billNo: opts.billNo != null ? String(opts.billNo) : undefined,
    companyId: SessionManager.companyId || '',
    counterNo: getPosSession().counterNo || 0,
    orderData: opts.orderData,
    settleResult: opts.settleResult,
    settledAt: new Date().toISOString(),
  }
  try {
    localStorage.setItem(scopeKey(), JSON.stringify(payload))
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // ignore quota / private mode
  }
}

export function loadLastSettledBill(): LastSettledBill | null {
  try {
    const scoped = localStorage.getItem(scopeKey())
    const raw = scoped || localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastSettledBill
    if (!parsed?.salesId) return null
    const companyId = SessionManager.companyId || ''
    const counterNo = getPosSession().counterNo || 0
    if (parsed.companyId && companyId && parsed.companyId !== companyId) return null
    if (parsed.counterNo && counterNo && Number(parsed.counterNo) !== Number(counterNo)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}
