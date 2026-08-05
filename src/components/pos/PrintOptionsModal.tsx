import { useEffect, useState } from 'react'
import {
  X,
  Receipt,
  ClipboardList,
  Gift,
  RotateCcw,
  Mail,
  MessageSquare,
  Printer,
  Wifi,
  RefreshCw,
} from 'lucide-react'
import Button from '../common/Button'

export type ReceiptType = 'customer' | 'service' | 'gift'

export interface PrintOptionsModalProps {
  open: boolean
  onClose: () => void
  /** true when bill has no lines — disables Print Now */
  canPrint?: boolean
  printerName?: string
  printerConnected?: boolean
  onPrint: (receiptType: ReceiptType) => void
  onReprintLast: () => void
  onSendEmail: () => void
  onSendSms: () => void
  onTestPrinter?: () => void
  onChangePrinter?: () => void
}

const RECEIPT_OPTIONS: {
  id: ReceiptType
  label: string
  hint: string
  icon: typeof Receipt
}[] = [
  {
    id: 'customer',
    label: 'Customer Receipt',
    hint: 'Full bill for the guest',
    icon: Receipt,
  },
  {
    id: 'service',
    label: 'Service Ticket',
    hint: 'Station list for stylists',
    icon: ClipboardList,
  },
  {
    id: 'gift',
    label: 'Gift Receipt',
    hint: 'No prices shown',
    icon: Gift,
  },
]

export default function PrintOptionsModal({
  open,
  onClose,
  canPrint = true,
  printerName = 'POS-80 Thermal Printer',
  printerConnected = true,
  onPrint,
  onReprintLast,
  onSendEmail,
  onSendSms,
  onTestPrinter,
  onChangePrinter,
}: PrintOptionsModalProps) {
  const [receiptType, setReceiptType] = useState<ReceiptType>('customer')

  // Reset selection each time modal opens
  useEffect(() => {
    if (!open) return
    setReceiptType('customer')
  }, [open])

  // Escape closes (matches good POS UX)
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-options-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(720px,92dvh)] max-w-[640px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* ── Header ── */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2
              id="print-options-title"
              className="text-xl font-bold text-salon-text"
            >
              Print Options & Receipts
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Choose receipt type, then print or send digital
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Receipt type cards */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Receipt type
            </p>
            <div
              role="radiogroup"
              aria-label="Receipt type"
              className="grid grid-cols-1 gap-2 sm:grid-cols-3"
            >
              {RECEIPT_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const selected = receiptType === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setReceiptType(opt.id)}
                    className={[
                      'flex min-h-[100px] flex-col items-start gap-2 rounded-xl border-2 p-4 text-left',
                      'transition-colors touch-manipulation active:scale-[0.98]',
                      selected
                        ? 'border-salon-primary bg-salon-primary-light/80 shadow-sm'
                        : 'border-salon-border bg-white hover:border-salon-primary/40 hover:bg-salon-primary-light/40',
                    ].join(' ')}
                  >
                    <Icon
                      size={26}
                      className={
                        selected ? 'text-salon-primary' : 'text-salon-muted'
                      }
                    />
                    <span className="text-base font-bold text-salon-text">
                      {opt.label}
                    </span>
                    <span className="text-sm text-salon-muted">{opt.hint}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Quick digital / reprint actions */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Quick actions
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                variant="secondary"
                size="secondary"
                icon={<RotateCcw size={20} />}
                onClick={onReprintLast}
                className="w-full min-h-16 text-base"
              >
                Reprint Last Bill
              </Button>
              <Button
                variant="secondary"
                size="secondary"
                icon={<Mail size={20} />}
                onClick={onSendEmail}
                className="w-full min-h-16 text-base"
              >
                Email Receipt
              </Button>
              <Button
                variant="secondary"
                size="secondary"
                icon={<MessageSquare size={20} />}
                onClick={onSendSms}
                className="w-full min-h-16 text-base"
              >
                SMS Receipt
              </Button>
            </div>
          </section>

          {/* Printer status */}
          <section className="rounded-xl border border-salon-border bg-salon-bg px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={[
                    'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                    printerConnected
                      ? 'bg-salon-success/15 text-salon-success'
                      : 'bg-salon-danger/15 text-salon-danger',
                  ].join(' ')}
                >
                  {printerConnected ? <Wifi size={20} /> : <Printer size={20} />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-salon-text">
                    {printerConnected
                      ? `Connected: ${printerName}`
                      : 'Printer offline'}
                  </p>
                  <p className="text-sm text-salon-muted">
                    {printerConnected
                      ? 'Ready for thermal print'
                      : 'Check USB/network connection'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onTestPrinter}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-salon-border bg-white px-3 text-sm font-semibold text-salon-text hover:bg-white"
                >
                  <RefreshCw size={16} />
                  Test
                </button>
                <button
                  type="button"
                  onClick={onChangePrinter}
                  className="inline-flex h-11 items-center gap-2 rounded-lg border border-salon-border bg-white px-3 text-sm font-semibold text-salon-text hover:bg-white"
                >
                  Change
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* ── Footer ── */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-salon-border p-4 sm:flex-row sm:p-5">
          <Button
            variant="secondary"
            size="primary"
            onClick={onClose}
            className="w-full sm:w-auto sm:min-w-[140px]"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="primary"
            icon={<Printer size={24} />}
            disabled={!canPrint || !printerConnected}
            onClick={() => onPrint(receiptType)}
            className="w-full flex-1 justify-center"
          >
            Print Now
          </Button>
        </footer>
      </div>
    </div>
  )
}