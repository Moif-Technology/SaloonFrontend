import { Capacitor, registerPlugin } from '@capacitor/core'

export const IS_ANDROID_POS = Capacitor.getPlatform() === 'android'

const SunmiPrinter = registerPlugin('SunmiPrinter', {
  web: () => ({
    printHtml: () => Promise.reject(new Error('Sunmi printer not available on web')),
  }),
})

const SUNMI_80MM_BITMAP_WIDTH = 576

export interface PrintOptions {
  html?: string
  width?: number
}

/**
 * Print HTML on Sunmi Android device
 */
export async function printHtmlOnAndroid(html: string, opts: PrintOptions = {}): Promise<boolean> {
  if (!IS_ANDROID_POS) {
    console.warn('Not on Android POS device')
    return false
  }

  try {
    console.log('Starting Android print...')

    // Remove auto-print script
    const cleanHtml = String(html ?? '')
      .replace(/<script>[\s\S]*?window\.onload[\s\S]*?<\/script>/i, '')
      .replace('</head>', `
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      background: #fff !important;
    }
    body {
      padding: 10px 12px !important;
    }
    @page {
      size: auto !important;
      margin: 0 !important;
    }
  </style>
</head>`)

    console.log('Calling SunmiPrinter.printHtml()...')
    const result = await (SunmiPrinter as any).printHtml({
      html: cleanHtml,
      width: opts.width ?? SUNMI_80MM_BITMAP_WIDTH,
    })

    console.log('Print result:', result)
    console.log('✓ Printed to Sunmi printer')
    return true
  } catch (err) {
    console.error('✗ Android print error:', err)
    console.error('Error details:', JSON.stringify(err))
    return false
  }
}

/**
 * Check if plugin is available (diagnostic)
 */
export async function checkAndroidPrinterStatus(): Promise<{ available: boolean; message: string }> {
  if (!IS_ANDROID_POS) {
    return { available: false, message: 'Not on Android device' }
  }

  try {
    const result = await (SunmiPrinter as any).getPrinterStatus()
    console.log('Printer status:', result)
    return { available: result?.connected ?? false, message: 'Printer status checked' }
  } catch (err) {
    console.error('Status check error:', err)
    return { available: false, message: String(err) }
  }
}

export { SunmiPrinter }
