import { Capacitor } from '@capacitor/core'
import { isSunmiDevice, checkSunmiPrinterStatus } from '../lib/sunmiPrinter'

export interface PrintConfig {
  useSunmi: boolean
  isMobile: boolean
  isNative: boolean
  printerAvailable: boolean
  paperWidth: number // mm
}

let cachedConfig: PrintConfig | null = null
let configPromise: Promise<PrintConfig> | null = null

/**
 * Detect print capabilities
 */
export async function detectPrintConfig(): Promise<PrintConfig> {
  // Return cached config if already detected
  if (cachedConfig) {
    return cachedConfig
  }

  // Return existing promise if detection in progress
  if (configPromise) {
    return configPromise
  }

  // Start detection
  configPromise = (async () => {
    const config: PrintConfig = {
      isMobile: Capacitor.isNativePlatform(),
      isNative: Capacitor.isNativePlatform(),
      useSunmi: false,
      printerAvailable: false,
      paperWidth: 80, // Default thermal receipt width: 80mm
    }

    // Check if Sunmi device
    if (config.isMobile && isSunmiDevice()) {
      config.useSunmi = true
      try {
        config.printerAvailable = await checkSunmiPrinterStatus()
      } catch (err) {
        console.warn('Failed to check Sunmi printer status:', err)
        config.printerAvailable = false
      }
    }

    cachedConfig = config
    configPromise = null
    return config
  })()

  return configPromise
}

/**
 * Get print config (with caching)
 */
export async function getPrintConfig(): Promise<PrintConfig> {
  if (cachedConfig) {
    return cachedConfig
  }
  return detectPrintConfig()
}

/**
 * Reset print config cache (useful for testing)
 */
export function resetPrintConfig(): void {
  cachedConfig = null
  configPromise = null
}

/**
 * Format receipt width for the detected device
 */
export function getReceiptWidth(): string {
  const width = cachedConfig?.paperWidth ?? 80
  return `${width}mm`
}

/**
 * Get human-readable printer name
 */
export async function getPrinterName(): Promise<string> {
  const config = await getPrintConfig()

  if (config.useSunmi) {
    return 'Sunmi Thermal Printer'
  }

  if (config.isMobile) {
    return 'Mobile Device Printer'
  }

  return 'Browser Print'
}

/**
 * Check if direct thermal printing available
 */
export async function isDirectPrintAvailable(): Promise<boolean> {
  const config = await getPrintConfig()
  return config.useSunmi && config.printerAvailable
}

/**
 * Log print device info (for debugging)
 */
export async function logPrintDeviceInfo(): Promise<void> {
  const config = await getPrintConfig()
  const printerName = await getPrinterName()

  console.log('=== Print Device Info ===')
  console.log(`Platform: ${config.isNative ? 'Native (APK)' : 'Web'}`)
  console.log(`Printer: ${printerName}`)
  console.log(`Paper Width: ${config.paperWidth}mm`)
  console.log(`Direct Print: ${config.useSunmi ? 'Yes (Sunmi)' : 'No (Browser)'}`)
  console.log(`Printer Available: ${config.printerAvailable}`)
}
