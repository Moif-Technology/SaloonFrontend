/**
 * Shared 80mm thermal receipt theme — ported from Counter-pos receiptPrintTheme.js
 */

export const BILL_FONT = '"Courier New", Courier, monospace'
export const RECEIPT_PAGE_WIDTH = '80mm'

export const RECEIPT_FONT = {
  body: 14,
  storeName: 18,
  meta: 13,
  title: 14,
  titleAr: 13,
  row: 13,
  rowSmall: 12,
  items: 13,
  itemsHead: 12,
  itemSub: 12,
  total: 15,
  taxHead: 13,
  taxTable: 12,
  footer: 14,
  printerNote: 11,
}

export function escReceipt(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildReceiptItemDescHtml(
  it: { description?: string; short_description?: string; descriptionArabic?: string; description_arabic?: string },
  esc = escReceipt,
) {
  const en = String(it?.description ?? it?.short_description ?? 'Item').trim()
  const ar = String(it?.descriptionArabic ?? it?.description_arabic ?? '').trim()
  if (!ar || ar === en) return esc(en || 'Item')
  return `${esc(en || 'Item')}<div class="desc-ar">${esc(ar)}</div>`
}

export const RECEIPT_LABELS = {
  description: { en: 'Description', ar: 'البيان' },
  qty: { en: 'Qty', ar: 'الكمية' },
  price: { en: 'Price', ar: 'السعر' },
  lineTotal: { en: 'Total', ar: 'المبلغ' },
  grandTotal: { en: 'TOTAL', ar: 'الإجمالي' },
  settlement: { en: 'SETTLEMENT', ar: 'طريقة الدفع' },
  items: { en: 'ITEMS', ar: 'عدد الأصناف' },
  qtyTotal: { en: 'QTY', ar: 'الكمية' },
  billAmount: { en: 'BILL AMOUNT', ar: 'مبلغ الفاتورة' },
  paidAmount: { en: 'PAID AMOUNT', ar: 'المبلغ المدفوع' },
  balAmount: { en: 'BAL. AMOUNT', ar: 'المبلغ المتبقي' },
  osBalance: { en: 'O/S BALANCE', ar: 'الرصيد المستحق' },
  taxDetails: { en: 'Tax Details', ar: 'تفاصيل الضريبة' },
  taxableAmount: { en: 'Taxable Amount', ar: 'المبلغ الخاضع للضريبة' },
  taxAmount: { en: 'Tax Amount', ar: 'مبلغ الضريبة' },
  taxableBeforeDisc: { en: 'TAXABLE BEFORE DISC', ar: 'الخاضع للضريبة قبل الخصم' },
  discount: { en: 'DISCOUNT', ar: 'الخصم' },
  taxableAfterDisc: { en: 'TAXABLE AFTER DISC', ar: 'الخاضع للضريبة بعد الخصم' },
  roundOff: { en: 'ROUND OFF', ar: 'فرق التقريب' },
}

function receiptTh(label: { en: string; ar: string }, alignClass = '') {
  return `<th class="${alignClass}"><div class="th-en">${label.en}</div><div class="th-ar">${label.ar}</div></th>`
}

export function buildReceiptBiLabel(label: { en: string; ar: string }, suffix = '') {
  return `<span class="bi-lbl"><span class="en">${label.en}${suffix}</span><span class="ar">${label.ar}</span></span>`
}

export function buildReceiptItemsTableHeadHtml({ withPrice = true } = {}) {
  const L = RECEIPT_LABELS
  if (withPrice) {
    return `<tr>
      ${receiptTh(L.description, 'desc')}
      ${receiptTh(L.qty, 'c')}
      ${receiptTh(L.price, 'r')}
      ${receiptTh(L.lineTotal, 'r')}
    </tr>`
  }
  return `<tr>
    ${receiptTh(L.description, 'desc')}
    ${receiptTh(L.qty, 'c')}
    ${receiptTh(L.lineTotal, 'r')}
  </tr>`
}

export function buildReceiptTotalLineHtml(amount: number, fmtMoney: (n: number) => string) {
  const L = RECEIPT_LABELS.grandTotal
  return `<div class="total-line">
    <span>${buildReceiptBiLabel(L, ' :')}</span>
    <span>${fmtMoney(amount)}</span>
  </div>`
}

export function buildReceiptSettlementLineHtml(settlementText: string, esc = escReceipt) {
  const L = RECEIPT_LABELS.settlement
  return `<div class="pair-row">
    <span>${buildReceiptBiLabel(L, ` : ${esc(settlementText)}`)}</span>
  </div>`
}

export function buildReceiptBillSummaryHtml(p: {
  itemCount: number
  qtyTotal: number
  billAmount: number
  paidAmount: number
  balAmount: number
  fmtMoney: (n: number) => string
  fmtQty: (n: number) => string
}) {
  const L = RECEIPT_LABELS
  return `<div class="pair-row">
    <span>${buildReceiptBiLabel(L.items, ` : ${p.itemCount}`)}</span>
    <span class="pair">${buildReceiptBiLabel(L.billAmount, ` : ${p.fmtMoney(p.billAmount)}`)}</span>
  </div>
  <div class="pair-row">
    <span>${buildReceiptBiLabel(L.qtyTotal, ` : ${p.fmtQty(p.qtyTotal)}`)}</span>
    <span class="pair">${buildReceiptBiLabel(L.paidAmount, ` : ${p.fmtMoney(p.paidAmount)}`)}</span>
  </div>
  <div class="pair-row">
    <span></span>
    <span class="pair">${buildReceiptBiLabel(L.balAmount, ` : ${p.fmtMoney(p.balAmount)}`)}</span>
  </div>`
}

export function buildReceiptTaxDetailsHtml(
  taxableAmt: number,
  taxAmt: number,
  billAmount: number,
  fmtMoney: (n: number) => string,
) {
  const L = RECEIPT_LABELS
  return `<div class="tax-head">
    <div>${L.taxDetails.en}</div>
    <div class="tax-head-ar">${L.taxDetails.ar}</div>
  </div>
  <table class="tax">
    <thead>
      <tr>
        ${receiptTh(L.taxableAmount)}
        ${receiptTh(L.taxAmount, 'r')}
        ${receiptTh(L.billAmount, 'r')}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${fmtMoney(taxableAmt)}</td>
        <td>${fmtMoney(taxAmt)}</td>
        <td>${fmtMoney(billAmount)}</td>
      </tr>
    </tbody>
  </table>`
}

export function fmtReceiptDateTime(d: unknown) {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (Number.isNaN(dt.getTime())) return '—'
  const date = dt
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    .replace(/ /g, '/')
  const time = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${date} - ${time}`
}

export function buildReceiptDiscountAdjustmentHtml(p: {
  taxableAmt: number
  discountAmt: number
  roundOff?: number | null
  fmtMoney: (n: number) => string
  /** When false (no company TRN), use Subtotal labels instead of Taxable */
  showTaxLabels?: boolean
}) {
  const disc = Number(p.discountAmt) || 0
  const taxable = Number(p.taxableAmt) || 0
  const ro = p.roundOff != null ? Number(p.roundOff) : 0
  const hasDiscount = Math.abs(disc) > 0.001
  const hasRoundOff = ro != null && !Number.isNaN(ro) && Math.abs(ro) > 0.001
  const showTax = p.showTaxLabels !== false
  let html = ''
  if (hasDiscount) {
    const beforeDisc = taxable + disc
    const L = RECEIPT_LABELS
    const beforeLabel = showTax
      ? buildReceiptBiLabel(L.taxableBeforeDisc)
      : 'Subtotal (before discount)'
    const afterLabel = showTax
      ? buildReceiptBiLabel(L.taxableAfterDisc)
      : 'Subtotal (after discount)'
    html += `
  <div class="pair-row">
    <span>${beforeLabel}</span>
    <span class="val">${p.fmtMoney(beforeDisc)}</span>
  </div>
  <div class="pair-row">
    <span>${buildReceiptBiLabel(L.discount)}</span>
    <span class="val">${p.fmtMoney(disc)}</span>
  </div>
  <div class="pair-row">
    <span>${afterLabel}</span>
    <span class="val">${p.fmtMoney(taxable)}</span>
  </div>`
  }
  if (hasRoundOff) {
    html += `
  <div class="pair-row">
    <span>${buildReceiptBiLabel(RECEIPT_LABELS.roundOff)}</span>
    <span class="val">${p.fmtMoney(ro)}</span>
  </div>`
  }
  return html
}

export function buildReceiptBarcodeBlockHtml(p: {
  label: string
  barcodeText: string
  barcodeSvg: string
  displayText?: string
  esc?: (s: unknown) => string
}) {
  const esc = p.esc ?? escReceipt
  if (!p.barcodeText || !p.barcodeSvg) return ''
  const humanText = p.displayText ?? p.barcodeText
  return `
  <div class="barcode-block center">
    <div class="barcode-label">${esc(p.label)}</div>
    <div class="barcode-svg">${p.barcodeSvg}</div>
    <div class="barcode-text">${esc(humanText)}</div>
  </div>`
}

export const RECEIPT_BARCODE_EXTRA_CSS = `
  .barcode-block { margin: 8px 0 4px; }
  .barcode-label { font-size: 13px; font-weight: 700; margin-bottom: 6px; letter-spacing: 0.3px; }
  .barcode-svg { display: flex; justify-content: center; margin: 4px 0; overflow: visible; }
  .barcode-svg svg { max-width: 72mm; height: auto; }
  .barcode-text { font-size: 16px; font-weight: 700; letter-spacing: 2px; margin-top: 4px; }
  @media print {
    .barcode-svg svg {
      width: 68mm !important;
      height: auto !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
`

export function buildReceiptBaseCss(opts: { includePage?: boolean } = {}) {
  const { includePage = true } = opts
  const f = RECEIPT_FONT
  const pageRules = includePage
    ? `
    body {
      font-size: ${f.body}px;
      line-height: 1.3;
      width: ${RECEIPT_PAGE_WIDTH};
      max-width: ${RECEIPT_PAGE_WIDTH};
      margin: 0 auto;
      padding: 3mm 2mm;
    }
    @media print {
      body { width: ${RECEIPT_PAGE_WIDTH}; padding: 0; font-size: ${f.body}px; }
      @page { size: ${RECEIPT_PAGE_WIDTH} auto; margin: 2mm; }
    }
  `
    : ''

  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, table, div, span, td, th {
      font-family: ${BILL_FONT};
      font-weight: 700;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    ${pageRules}
    .store-name {
      font-size: ${f.storeName}px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: center;
      line-height: 1.2;
      margin-bottom: 5px;
    }
    .center { text-align: center; }
    .meta-line { text-align: center; font-size: ${f.meta}px; font-weight: 700; margin: 2px 0; }
    .dash { border: none; border-top: 2px dashed #000; margin: 7px 0; }
    .title-row {
      display: flex; justify-content: space-between; align-items: center;
      font-weight: 700; font-size: ${f.title}px; margin: 5px 0;
      flex-wrap: nowrap; white-space: nowrap;
    }
    .title-ar { font-size: ${f.titleAr}px; font-weight: 700; direction: rtl; flex-shrink: 0; font-family: "Segoe UI", Tahoma, Arial, sans-serif; }
    .th-en { line-height: 1.1; }
    .th-ar, .bi-lbl .ar, .tax-head-ar {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      font-size: 10px; font-weight: 700; direction: rtl; line-height: 1.15;
    }
    .th-ar { margin-top: 1px; }
    table.items th.c .th-ar { text-align: center; }
    table.items th.r .th-ar { text-align: left; }
    table.tax th .th-ar { font-size: 9px; text-align: left; }
    table.tax th.r .th-ar { text-align: left; }
    .bi-lbl { display: inline-flex; flex-direction: column; vertical-align: top; line-height: 1.1; }
    .bi-lbl .en { white-space: nowrap; }
    .tax-head-ar { text-align: center; margin-top: 2px; font-size: ${f.itemSub}px; }
    .row {
      display: flex; justify-content: space-between; align-items: center;
      gap: 4px; flex-wrap: nowrap; white-space: nowrap;
      font-size: ${f.row}px; font-weight: 700; margin: 3px 0;
      width: 100%;
    }
    .row.addr { align-items: flex-start; white-space: normal; }
    .row .lbl { font-weight: 700; flex-shrink: 0; }
    .row-left { flex: 0 1 auto; min-width: 0; white-space: nowrap; }
    .row-right { flex: 0 0 auto; text-align: right; white-space: nowrap; margin-left: auto; }
    .row .val { text-align: right; flex: 0 0 auto; font-weight: 700; white-space: nowrap; }
    .pair-row {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: ${f.row}px; font-weight: 700; margin: 3px 0;
      flex-wrap: nowrap; white-space: nowrap;
    }
    .pair-row.small { font-size: ${f.rowSmall}px; font-weight: 700; padding-left: 8px; }
    .pair { display: flex; gap: 4px; white-space: nowrap; }
    .pair .lbl { font-weight: 700; }
    .pair .val { font-weight: 700; }
    table.items { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: ${f.items}px; font-weight: 700; }
    table.items th {
      text-align: left; font-weight: 700; font-size: ${f.itemsHead}px;
      border-bottom: 2px dashed #000; padding: 4px 0;
    }
    table.items th.c { text-align: center; width: 30px; }
    table.items th.r { text-align: right; }
    table.items td { padding: 3px 0; vertical-align: top; font-weight: 700; }
    table.items .desc { font-weight: 700; max-width: 42mm; word-wrap: break-word; }
    table.items .desc-ar {
      font-family: "Segoe UI", Tahoma, Arial, sans-serif;
      font-size: ${f.itemSub}px; font-weight: 700; direction: rtl; text-align: right;
      margin-top: 2px; line-height: 1.25; word-wrap: break-word;
    }
    table.items .c { text-align: center; width: 30px; font-weight: 700; }
    table.items .r { text-align: right; white-space: nowrap; font-weight: 700; }
    table.items .b { font-weight: 700; }
    table.items .item-sub td { padding-bottom: 5px; border-bottom: 1px dotted #000; font-size: ${f.itemSub}px; font-weight: 700; }
    table.items .item-sub-last td { border-bottom: none; padding-bottom: 2px; }
    table.items .sub { color: #000; font-weight: 700; }
    .total-line {
      display: flex; justify-content: space-between;
      font-weight: 700; font-size: ${f.total}px; margin: 5px 0;
    }
    .tax-head { text-align: center; font-weight: 700; font-size: ${f.taxHead}px; margin: 7px 0 5px; }
    table.tax { width: 100%; border-collapse: collapse; font-size: ${f.taxTable}px; font-weight: 700; margin-bottom: 7px; }
    table.tax th, table.tax td { text-align: right; padding: 3px 4px; font-weight: 700; }
    table.tax th:first-child, table.tax td:first-child { text-align: left; }
    table.tax thead tr { border-bottom: 1px dotted #000; }
    table.tax tbody tr { border-bottom: none; }
    .footer { text-align: center; font-size: ${f.footer}px; font-weight: 700; margin-top: 10px; letter-spacing: 0.3px; }
    .printer-note { font-size: ${f.printerNote}px; font-weight: 700; color: #000; margin-top: 5px; text-align: center; }
  `
}

const AUTO_PRINT_SCRIPT = `
  <script>
    window.onload = function() {
      setTimeout(function() { window.focus(); window.print(); }, 400);
    };
  </script>
`

export function buildReceiptDocumentHtml(p: {
  title?: string
  bodyHtml?: string
  extraCss?: string
  autoPrint?: boolean
}) {
  const { title = 'Receipt', bodyHtml = '', extraCss = '', autoPrint = true } = p
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escReceipt(title)}</title>
  <style>
    ${buildReceiptBaseCss()}
    ${extraCss}
  </style>
</head>
<body>
  ${bodyHtml}
  ${autoPrint ? AUTO_PRINT_SCRIPT : ''}
</body>
</html>`
}

export async function openReceiptPrintWindow(
  html: string,
  opts: { width?: number; height?: number; useSunmi?: boolean } = {},
) {
  const { width = 420, height = 720, useSunmi = false } = opts

  // Try Sunmi printer first if available
  if (useSunmi) {
    try {
      const { printReceiptOnSunmi } = await import('./sunmiPrinter')
      await printReceiptOnSunmi(html)
      return null
    } catch (err) {
      console.warn('Sunmi print failed, falling back to browser print:', err)
      // Fall through to browser print
    }
  }

  // Browser print fallback
  const win = window.open('', '_blank', `width=${width},height=${height}`)
  if (!win) throw new Error('Pop-up blocked — allow pop-ups to print receipts')
  win.document.write(html)
  win.document.close()
  win.focus()
  return win
}

export function formatDocBarcode(docNo: unknown) {
  const n = Number(docNo)
  if (!Number.isFinite(n) || n <= 0) return ''
  return String(Math.floor(n)).padStart(6, '0')
}

export function fmtMoney(n: number) {
  return (Math.round((Number(n) || 0) * 100) / 100).toFixed(2)
}

export function fmtQty(n: number) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? String(v) : v.toFixed(2)
}
