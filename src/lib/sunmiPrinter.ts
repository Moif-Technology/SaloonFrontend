import { Capacitor, registerPlugin, type Plugin } from '@capacitor/core'
import { RECEIPT_THERMAL_HTML_CSS } from './receiptPrintTheme'

export interface SunmiPrinterPlugin extends Plugin {
  /**
   * Print HTML content on Sunmi printer
   */
  printHtml(options: { html: string }): Promise<void>

  /**
   * Print plain text on Sunmi printer
   */
  printText(options: { text: string }): Promise<void>

  /**
   * Print bitmap image on Sunmi printer
   */
  printBitmap(options: { bitmap: string }): Promise<void>

  /**
   * Get printer connection status
   */
  getPrinterStatus(): Promise<{ connected: boolean }>

  /**
   * Feed paper on the printer
   */
  feedPaper(options?: { lines?: number }): Promise<void>
}

const SunmiPrinter = registerPlugin<SunmiPrinterPlugin>('SunmiPrinter')

/**
 * Sunmi D3 Mini / built-in printer — true on Capacitor Android APK.
 */
export function isSunmiDevice(): boolean {
  if (Capacitor.getPlatform() === 'android') return true
  if (typeof window === 'undefined') return false
  return (
    /Sunmi/i.test(navigator.userAgent) ||
    (window as unknown as { sunmiPrinter?: unknown }).sunmiPrinter !== undefined ||
    (window as unknown as { __SUNMI_DEVICE__?: boolean }).__SUNMI_DEVICE__ === true
  )
}

/**
 * Print HTML receipt using Sunmi printer
 */
export async function printReceiptOnSunmi(html: string): Promise<void> {
  if (!isSunmiDevice()) {
    throw new Error('Not running on Sunmi device')
  }

  try {
    await SunmiPrinter.printHtml({
      html: String(html ?? '').replace('</head>', `<style>${RECEIPT_THERMAL_HTML_CSS}</style></head>`),
    })
  } catch (err) {
    console.error('Sunmi print error:', err)
    throw err
  }
}

/**
 * Check Sunmi printer status
 */
export async function checkSunmiPrinterStatus(): Promise<boolean> {
  if (!isSunmiDevice()) {
    return false
  }

  try {
    const { checkAndroidPrinterStatus } = await import('./androidPrinter')
    const result = await checkAndroidPrinterStatus()
    return result.available
  } catch (err) {
    console.error('Sunmi status check error:', err)
    return false
  }
}

/**
 * Feed paper on Sunmi printer
 */
export async function feedSunmiPaper(lines: number = 3): Promise<void> {
  if (!isSunmiDevice()) {
    throw new Error('Not running on Sunmi device')
  }

  try {
    await SunmiPrinter.feedPaper({ lines })
  } catch (err) {
    console.error('Sunmi feed paper error:', err)
    throw err
  }
}

export default SunmiPrinter
