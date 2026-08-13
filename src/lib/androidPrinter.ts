import { Capacitor, registerPlugin } from '@capacitor/core'
import { RECEIPT_THERMAL_HTML_CSS } from './receiptPrintTheme'

/** Running inside the Salon POS Capacitor APK (not Chrome browser). */
export function isNativePosApp(): boolean {
  return Capacitor.isNativePlatform()
}

/** @deprecated use isNativePosApp */
export const IS_ANDROID_POS = isNativePosApp()

const SunmiPrinter = registerPlugin('SunmiPrinter', {
  web: () => ({
    isAvailable: () => Promise.resolve({ available: false }),
    printHtml: () => Promise.reject(new Error('Install Salon POS APK for built-in printing')),
    openDrawer: () => Promise.resolve({ opened: false }),
  }),
})

/** Sunmi 80mm thermal = 576 dots. */
const SUNMI_THERMAL_BITMAP_WIDTH = 576

export interface PrintOptions {
  html?: string
  width?: number
}

function isSunmiBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Sunmi/i.test(navigator.userAgent)
}

/**
 * Print receipt HTML on the Sunmi built-in printer (D3 Mini inner printer).
 */
export async function printHtmlOnAndroid(html: string, opts: PrintOptions = {}): Promise<void> {
  if (!isNativePosApp()) {
    if (isSunmiBrowser()) {
      throw new Error(
        'Open the Salon POS app (APK), not Chrome. Built-in printer only works in the installed app.',
      )
    }
    throw new Error('Built-in printer is only available in the Android POS app')
  }

  const cleanHtml = String(html ?? '')
    .replace(/<script>[\s\S]*?window\.onload[\s\S]*?<\/script>/gi, '')
    .replace('</head>', `
  <meta name="viewport" content="width=${SUNMI_THERMAL_BITMAP_WIDTH}, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>
    html, body {
      box-sizing: border-box !important;
      width: ${SUNMI_THERMAL_BITMAP_WIDTH}px !important;
      max-width: ${SUNMI_THERMAL_BITMAP_WIDTH}px !important;
      min-width: ${SUNMI_THERMAL_BITMAP_WIDTH}px !important;
      margin: 0 !important;
      background: #fff !important;
      overflow-x: hidden !important;
    }
    body {
      padding: 6px 12px !important;
    }
    ::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
    @page {
      size: auto !important;
      margin: 0 !important;
    }
    ${RECEIPT_THERMAL_HTML_CSS}
  </style>
</head>`)

  await (SunmiPrinter as { printHtml: (o: { html: string; width?: number }) => Promise<unknown> }).printHtml({
    html: cleanHtml,
    width: opts.width ?? SUNMI_THERMAL_BITMAP_WIDTH,
  })
}

/** Built-in Sunmi printer on APK; browser preview only on web dev. */
export async function printReceiptHtml(html: string, opts: PrintOptions = {}): Promise<void> {
  if (isNativePosApp()) {
    await printHtmlOnAndroid(html, opts)
    return
  }

  const { openReceiptPrintWindow } = await import('./receiptPrintTheme')
  await openReceiptPrintWindow(html)
}

export async function checkAndroidPrinterStatus(): Promise<{ available: boolean; message: string }> {
  if (!isNativePosApp()) {
    return {
      available: false,
      message: isSunmiBrowser()
        ? 'Use Salon POS APK — Chrome cannot access built-in printer'
        : 'Not on Android POS app',
    }
  }

  try {
    const result = await (SunmiPrinter as { isAvailable?: () => Promise<{ available?: boolean }> }).isAvailable?.()
    const available = result?.available ?? false
    return {
      available,
      message: available ? 'Sunmi built-in printer ready' : 'Sunmi printer service not connected yet',
    }
  } catch (err) {
    return { available: false, message: String(err) }
  }
}

export { SunmiPrinter }
