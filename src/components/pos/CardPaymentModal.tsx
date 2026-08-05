import { useEffect, useState } from 'react'
import {
  X,
  CreditCard,
  Wifi,
  Keyboard,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/format'
import type { PaymentFlowStatus } from '../../types/payment'

const CARD_NETWORKS = ['Visa', 'Mastercard', 'RuPay'] as const

export interface CardPaymentModalProps {
  open: boolean
  onClose: () => void
  /** Grand total in ₹ */
  amount: number
  /** Called when cashier confirms payment complete */
  onComplete: () => void
}

export default function CardPaymentModal({
  open,
  onClose,
  amount,
  onComplete,
}: CardPaymentModalProps) {
  const [status, setStatus] = useState<PaymentFlowStatus>('waiting')
  const [manualMode, setManualMode] = useState(false)
  const [authCode, setAuthCode] = useState('')

  // Reset when opened
  useEffect(() => {
    if (!open) return
    setStatus('waiting')
    setManualMode(false)
    setAuthCode('')
  }, [open])

  // Escape closes
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const statusLabel: Record<PaymentFlowStatus, string> = {
    idle: 'Ready',
    waiting: 'Waiting for card swipe/tap…',
    processing: 'Processing with bank…',
    success: 'Payment approved',
    failed: 'Payment declined — try again',
    expired: 'Session expired',
  }

  function handleSimulateSwipe() {
    setStatus('processing')
    // UI mock — replace with real terminal SDK/event
    window.setTimeout(() => setStatus('success'), 1200)
  }

  function handleManualSubmit() {
    if (authCode.trim().length < 4) return
    setStatus('success')
  }

  function handleComplete() {
    if (status !== 'success') return
    onComplete()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-payment-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(720px,92dvh)] max-w-[480px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_32px_rgba(31,17,20,0.18)]">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2
              id="card-payment-title"
              className="text-xl font-bold text-salon-text"
            >
              Card Payment Terminal
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Present card on POS terminal
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

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Total */}
          <div className="rounded-2xl bg-salon-primary-light/70 px-4 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Amount to collect
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-salon-primary">
              ₹{formatCurrency(amount)}
            </p>
          </div>

          {/* Terminal status */}
          <div className="flex items-start gap-3 rounded-xl border-2 border-salon-border bg-salon-bg px-4 py-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-salon-primary">
              {status === 'processing' ? (
                <Loader2 size={26} className="animate-spin" />
              ) : status === 'success' ? (
                <CheckCircle2 size={26} className="text-salon-success" />
              ) : (
                <Wifi size={26} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
                Terminal status
              </p>
              <p className="mt-0.5 text-base font-semibold text-salon-text">
                {statusLabel[status]}
              </p>
              {status === 'waiting' && (
                <button
                  type="button"
                  onClick={handleSimulateSwipe}
                  className="mt-2 text-sm font-semibold text-salon-primary underline-offset-2 hover:underline"
                >
                  Simulate card tap (dev)
                </button>
              )}
            </div>
          </div>

          {/* Networks */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Accepted networks
            </p>
            <div className="flex flex-wrap gap-2">
              {CARD_NETWORKS.map((net) => (
                <span
                  key={net}
                  className="inline-flex min-h-[40px] items-center rounded-lg border border-salon-border bg-white px-3.5 text-sm font-bold text-salon-text"
                >
                  {net}
                </span>
              ))}
            </div>
          </div>

          {/* Manual fallback */}
          <div className="rounded-xl border-2 border-dashed border-salon-border p-4">
            <button
              type="button"
              onClick={() => setManualMode((v) => !v)}
              className="flex min-h-[48px] w-full items-center gap-2 text-left text-base font-semibold text-salon-text"
            >
              <Keyboard size={22} className="text-salon-primary" />
              Manual entry (auth code fallback)
            </button>
            {manualMode && (
              <div className="mt-3 space-y-3">
                <p className="text-sm text-salon-muted">
                  Use when terminal is offline. Enter bank auth / approval code.
                </p>
                <input
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AUTH4821"
                  className="h-14 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-lg font-semibold tracking-wide text-salon-text outline-none focus:border-salon-primary"
                />
                <Button
                  variant="outline"
                  size="secondary"
                  onClick={handleManualSubmit}
                  disabled={authCode.trim().length < 4}
                  className="min-h-[56px] w-full"
                >
                  Approve with auth code
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-salon-border p-4 sm:flex-row sm:gap-3 sm:p-5">
          <Button
            variant="secondary"
            size="secondary"
            onClick={onClose}
            className="min-h-[56px] w-full sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="secondary"
            icon={<CreditCard size={22} />}
            disabled={status !== 'success'}
            onClick={handleComplete}
            className="min-h-[56px] w-full sm:flex-[1.4]"
          >
            Complete Card Payment
          </Button>
        </footer>
      </div>
    </div>
  )
}