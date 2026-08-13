import { isNativePosApp, SunmiPrinter } from './androidPrinter'
import { normalizeBillPaymentMode, normalizeSplitPayMode, PM } from '../utils/paymentModes'
import type { PaymentSplit } from '../types/settlement'

/** True when settlement includes cash (header CASH or M-Pay cash split). */
export function shouldOpenCashDrawer(
  paymentMode: unknown,
  splits?: PaymentSplit[] | null,
): boolean {
  const mode = normalizeBillPaymentMode(paymentMode)
  if (mode === PM.CASH) return true
  if (mode === PM.MULTIPAYMENT && Array.isArray(splits)) {
    return splits.some(
      (s) => normalizeSplitPayMode(s.payMode) === PM.CASH && Number(s.amount) > 0,
    )
  }
  return false
}

/** Pulse Sunmi cash drawer (APK only). Failures are logged, not thrown. */
export async function openCashDrawer(): Promise<boolean> {
  if (!isNativePosApp()) return false
  try {
    const plugin = SunmiPrinter as {
      openDrawer?: () => Promise<{ opened?: boolean }>
      print?: (o: { commands: object[] }) => Promise<unknown>
    }
    if (plugin.openDrawer) {
      await plugin.openDrawer()
      return true
    }
    await plugin.print?.({ commands: [{ type: 'openDrawer' }] })
    return true
  } catch (err) {
    console.warn('Cash drawer open failed:', err)
    return false
  }
}

export async function openCashDrawerIfNeeded(
  paymentMode: unknown,
  splits?: PaymentSplit[] | null,
): Promise<void> {
  if (shouldOpenCashDrawer(paymentMode, splits)) {
    await openCashDrawer()
  }
}
