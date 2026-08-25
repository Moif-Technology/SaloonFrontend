
import { useState } from 'react'
import {
  Barcode,
  Check,
  FileText,
  FileType,
  Image,
  LayoutTemplate,
  Receipt,
  Save,
  X,
} from 'lucide-react'

import { useSnackbar } from '../../context/SnackbarContext'

interface ReceiptTemplatesModalProps {
  open: boolean
  onClose: () => void
}

type TemplateStyle = 'Standard' | 'Compact' | 'Detailed'

type ReceiptSettings = {
  storeName: string
  logoEnabled: boolean
  taxId: string
  footerMessage: string
  barcodeEnabled: boolean
}

const TEMPLATE_OPTIONS: {
  id: TemplateStyle
  title: string
  description: string
}[] = [
  {
    id: 'Standard',
    title: 'Standard',
    description: 'Balanced layout for everyday receipts.',
  },
  {
    id: 'Compact',
    title: 'Compact',
    description: 'Minimal layout for shorter receipts.',
  },
  {
    id: 'Detailed',
    title: 'Detailed',
    description: 'Expanded layout with additional details.',
  },
]

export default function ReceiptTemplatesModal({
  open,
  onClose,
}: ReceiptTemplatesModalProps) {
  const { showSnackbar } = useSnackbar()

  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateStyle>('Standard')

  const [settings, setSettings] = useState<ReceiptSettings>({
    storeName: 'Salon & Beauty Studio',
    logoEnabled: true,
    taxId: 'GSTIN: 32ABCDE1234F1Z5',
    footerMessage: 'Thank you for visiting us!',
    barcodeEnabled: true,
  })

  const [previewOpen, setPreviewOpen] = useState(false)

  if (!open) return null

  function updateSetting<K extends keyof ReceiptSettings>(
    key: K,
    value: ReceiptSettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleSaveTemplate() {
    showSnackbar(
      `${selectedTemplate} receipt template saved successfully`,
      'success',
    )

    onClose()
  }

  function handlePreview() {
    setPreviewOpen(true)
  }

  function handleClosePreview() {
    setPreviewOpen(false)
  }

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(event) => event.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <FileType size={22} />
              </span>

              <div>
                <h2 className="text-xl font-bold text-salon-text">
                  Receipt Templates
                </h2>

                <p className="text-sm text-salon-muted">
                  Customize the layout and information shown on customer
                  receipts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              {/* Left Side */}
              <section className="space-y-4">
                {/* Template Selection */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                      <LayoutTemplate className="h-4 w-4" />
                    </span>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Template Style
                      </h3>

                      <p className="text-xs text-slate-500">
                        Choose a receipt layout.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {TEMPLATE_OPTIONS.map((template) => {
                      const selected =
                        selectedTemplate === template.id

                      return (
                        <button
                          key={template.id}
                          type="button"
                          onClick={() =>
                            setSelectedTemplate(template.id)
                          }
                          className={[
                            'flex w-full items-center justify-between rounded-xl border p-3 text-left transition',
                            selected
                              ? 'border-[#6b1d2f]/40 bg-[#6b1d2f]/5 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-[#6b1d2f]/20 hover:bg-slate-50',
                          ].join(' ')}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={[
                                'flex h-9 w-9 items-center justify-center rounded-lg',
                                selected
                                  ? 'bg-[#6b1d2f] text-white'
                                  : 'bg-slate-100 text-slate-500',
                              ].join(' ')}
                            >
                              <FileText className="h-4 w-4" />
                            </span>

                            <div>
                              <p
                                className={[
                                  'text-sm font-semibold',
                                  selected
                                    ? 'text-[#6b1d2f]'
                                    : 'text-slate-800',
                                ].join(' ')}
                              >
                                {template.title}
                              </p>

                              <p className="mt-0.5 text-xs text-slate-500">
                                {template.description}
                              </p>
                            </div>
                          </div>

                          <span
                            className={[
                              'flex h-5 w-5 items-center justify-center rounded-full border',
                              selected
                                ? 'border-[#6b1d2f] bg-[#6b1d2f] text-white'
                                : 'border-slate-300 bg-white text-transparent',
                            ].join(' ')}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-slate-900">
                      Receipt Details
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Configure the information displayed on receipts.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Store Name */}
                    <div>
                      <label
                        htmlFor="receipt-store-name"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Store Name
                      </label>

                      <input
                        id="receipt-store-name"
                        type="text"
                        value={settings.storeName}
                        onChange={(event) =>
                          updateSetting(
                            'storeName',
                            event.target.value,
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>

                    {/* Logo Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6b1d2f] shadow-sm">
                          <Image className="h-4 w-4" />
                        </span>

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Store Logo
                          </p>

                          <p className="text-[11px] text-slate-500">
                            Show logo at the top of the receipt.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.logoEnabled}
                        onClick={() =>
                          updateSetting(
                            'logoEnabled',
                            !settings.logoEnabled,
                          )
                        }
                        className={[
                          'relative h-6 w-11 rounded-full transition',
                          settings.logoEnabled
                            ? 'bg-[#6b1d2f]'
                            : 'bg-slate-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
                            settings.logoEnabled
                              ? 'left-[22px]'
                              : 'left-0.5',
                          ].join(' ')}
                        />
                      </button>
                    </div>

                    {/* Tax ID */}
                    <div>
                      <label
                        htmlFor="receipt-tax-id"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Tax ID
                      </label>

                      <input
                        id="receipt-tax-id"
                        type="text"
                        value={settings.taxId}
                        onChange={(event) =>
                          updateSetting(
                            'taxId',
                            event.target.value,
                          )
                        }
                        placeholder="Enter GSTIN / Tax ID"
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>

                    {/* Footer Message */}
                    <div>
                      <label
                        htmlFor="receipt-footer"
                        className="mb-1.5 block text-xs font-semibold text-slate-700"
                      >
                        Footer Message
                      </label>

                      <textarea
                        id="receipt-footer"
                        value={settings.footerMessage}
                        onChange={(event) =>
                          updateSetting(
                            'footerMessage',
                            event.target.value,
                          )
                        }
                        rows={3}
                        placeholder="Enter a thank-you message..."
                        className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>

                    {/* Barcode Toggle */}
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#6b1d2f] shadow-sm">
                          <Barcode className="h-4 w-4" />
                        </span>

                        <div>
                          <p className="text-xs font-semibold text-slate-800">
                            Barcode
                          </p>

                          <p className="text-[11px] text-slate-500">
                            Show invoice barcode on the receipt.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        role="switch"
                        aria-checked={settings.barcodeEnabled}
                        onClick={() =>
                          updateSetting(
                            'barcodeEnabled',
                            !settings.barcodeEnabled,
                          )
                        }
                        className={[
                          'relative h-6 w-11 rounded-full transition',
                          settings.barcodeEnabled
                            ? 'bg-[#6b1d2f]'
                            : 'bg-slate-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition',
                            settings.barcodeEnabled
                              ? 'left-[22px]'
                              : 'left-0.5',
                          ].join(' ')}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right Side - Live Preview */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Live Preview
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Preview how the receipt will appear.
                    </p>
                  </div>

                  <span className="rounded-lg bg-[#6b1d2f]/10 px-2.5 py-1 text-[11px] font-bold text-[#6b1d2f]">
                    {selectedTemplate}
                  </span>
                </div>

                {/* Receipt Preview */}
                <div className="flex min-h-[520px] items-start justify-center overflow-auto rounded-xl border border-slate-200 bg-white p-5 shadow-inner">
                  <div className="w-full max-w-[340px] border border-dashed border-slate-300 bg-white px-5 py-6 shadow-sm">
                    {/* Store Header */}
                    <div className="text-center">
                      {settings.logoEnabled && (
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6b1d2f] text-white">
                          <Receipt className="h-6 w-6" />
                        </div>
                      )}

                      <h4 className="text-base font-extrabold text-slate-900">
                        {settings.storeName || 'Store Name'}
                      </h4>

                      <p className="mt-1 text-[10px] text-slate-500">
                        Beauty & Salon Services
                      </p>

                      {settings.taxId && (
                        <p className="mt-1 text-[10px] font-medium text-slate-500">
                          {settings.taxId}
                        </p>
                      )}
                    </div>

                    <div className="my-4 border-t border-dashed border-slate-300" />

                    {/* Invoice Details */}
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Invoice</span>
                      <span className="font-semibold text-slate-700">
                        INV-001245
                      </span>
                    </div>

                    <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                      <span>Date</span>
                      <span className="font-semibold text-slate-700">
                        25 Aug 2026
                      </span>
                    </div>

                    <div className="my-4 border-t border-slate-200" />

                    {/* Items */}
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Hair Styling × 1
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹950
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Hair Spa × 1
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹1,200
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          Hair Serum × 1
                        </span>
                        <span className="font-semibold text-slate-800">
                          ₹450
                        </span>
                      </div>
                    </div>

                    <div className="my-4 border-t border-dashed border-slate-300" />

                    {/* Totals */}
                    <div className="space-y-1.5 text-[10px]">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>₹2,600</span>
                      </div>

                      {selectedTemplate !== 'Compact' && (
                        <div className="flex justify-between text-slate-500">
                          <span>Tax</span>
                          <span>₹468</span>
                        </div>
                      )}

                      {selectedTemplate === 'Detailed' && (
                        <>
                          <div className="flex justify-between text-slate-500">
                            <span>Discount</span>
                            <span>-₹100</span>
                          </div>

                          <div className="flex justify-between text-slate-500">
                            <span>Payment</span>
                            <span>Card</span>
                          </div>
                        </>
                      )}

                      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-xs font-extrabold text-[#6b1d2f]">
                        <span>Total</span>
                        <span>₹2,968</span>
                      </div>
                    </div>

                    {/* Barcode */}
                    {settings.barcodeEnabled && (
                      <div className="mt-5 text-center">
                        <div className="mx-auto flex h-10 w-[190px] items-center justify-center gap-[2px] overflow-hidden">
                          {Array.from({ length: 42 }).map(
                            (_, index) => (
                              <span
                                key={index}
                                className={[
                                  'h-full bg-slate-900',
                                  index % 4 === 0
                                    ? 'w-[3px]'
                                    : index % 3 === 0
                                      ? 'w-[1px]'
                                      : 'w-[2px]',
                                ].join(' ')}
                              />
                            ),
                          )}
                        </div>

                        <p className="mt-1 text-[9px] tracking-[0.2em] text-slate-500">
                          INV001245
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-5 border-t border-dashed border-slate-300 pt-4 text-center">
                      <p className="text-[10px] font-medium text-slate-600">
                        {settings.footerMessage ||
                          'Thank you for visiting us!'}
                      </p>

                      <p className="mt-1 text-[9px] text-slate-400">
                        Please visit us again.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-2 rounded-lg border border-[#6b1d2f]/20 bg-white px-4 py-2 text-sm font-semibold text-[#6b1d2f] transition hover:bg-[#6b1d2f]/5"
            >
              <Receipt className="h-4 w-4" />
              Preview
            </button>

            <button
              type="button"
              onClick={handleSaveTemplate}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          </div>
        </div>
      </div>

      {/* Preview Overlay */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={handleClosePreview}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6b1d2f] text-white">
                  <Receipt className="h-4 w-4" />
                </span>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Receipt Preview
                  </h3>

                  <p className="text-xs text-slate-500">
                    {selectedTemplate} template
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClosePreview}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
                aria-label="Close preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-auto bg-slate-50 p-5">
              <div className="mx-auto max-w-[320px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="text-center">
                  {settings.logoEnabled && (
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[#6b1d2f] text-white">
                      <Receipt className="h-5 w-5" />
                    </div>
                  )}

                  <h4 className="text-sm font-extrabold text-slate-900">
                    {settings.storeName || 'Store Name'}
                  </h4>

                  {settings.taxId && (
                    <p className="mt-1 text-[10px] text-slate-500">
                      {settings.taxId}
                    </p>
                  )}
                </div>

                <div className="my-4 border-t border-dashed border-slate-300" />

                <div className="space-y-2 text-[10px]">
                  <div className="flex justify-between">
                    <span>Hair Styling</span>
                    <span>₹950</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Hair Spa</span>
                    <span>₹1,200</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Hair Serum</span>
                    <span>₹450</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed border-slate-300" />

                <div className="flex justify-between text-xs font-bold text-[#6b1d2f]">
                  <span>Total</span>
                  <span>₹2,968</span>
                </div>

                {settings.barcodeEnabled && (
                  <div className="mt-5 text-center">
                    <div className="mx-auto flex h-9 w-[180px] items-center justify-center gap-[2px] overflow-hidden">
                      {Array.from({ length: 38 }).map(
                        (_, index) => (
                          <span
                            key={index}
                            className={[
                              'h-full bg-slate-900',
                              index % 4 === 0
                                ? 'w-[3px]'
                                : index % 3 === 0
                                  ? 'w-[1px]'
                                  : 'w-[2px]',
                            ].join(' ')}
                          />
                        ),
                      )}
                    </div>
                  </div>
                )}

                <p className="mt-5 border-t border-dashed border-slate-300 pt-4 text-center text-[10px] text-slate-500">
                  {settings.footerMessage ||
                    'Thank you for visiting us!'}
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-white px-5 py-3">
              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#581725]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
