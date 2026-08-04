import { useEffect, useMemo, useState } from 'react'
import {
  X,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Timer,
} from 'lucide-react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/format'
import {
  buildUpiPaymentUrl,
  qrImageUrl,
  DEMO_MERCHANT,
} from '../../utils/upiQr'
import type { PaymentFlowStatus } from '../../types/payment'

const QR_TTL_SECONDS = 5 * 60 // 5 minutes

export interface QrPayModalProps {
  open: boolean
  onClose: () => void
  amount: number
  billRef?: string
  onComplete: () => void
}

function formatMmSs(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function QrPayModal({
  open,
  onClose,
  amount,
  billRef,
  onComplete,
}: QrPayModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(QR_TTL_SECONDS)
  const [status, setStatus] = useState<PaymentFlowStatus>('waiting')
  const [verifying, setVerifying] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)

  // New QR session each open / refresh
  useEffect(() => {
    if (!open) return
    setSecondsLeft(QR_TTL_SECONDS)
    setStatus('waiting')
    setVerifying(false)
    setSessionKey((k) => k + 1)
  }, [open])

  // Countdown
  useEffect(() => {
    if (!open || status === 'success') return
    if (secondsLeft <= 0) {
      setStatus('expired')
      return
    }
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, secondsLeft, status, sessionKey])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const upiUrl = useMemo(() => {
    const tr = billRef
      ? `${billRef}-${sessionKey}`
      : `POS-${Date.now()}-${sessionKey}`
    return buildUpiPaymentUrl(amount, DEMO_MERCHANT, tr)
  }, [amount, billRef, sessionKey])

  const qrSrc = useMemo(() => qrImageUrl(upiUrl, 240), [upiUrl])

  if (!open) return null

  function handleRefreshQr() {
    setSessionKey((k) => k + 1)
    setSecondsLeft(QR_TTL_SECONDS)
    setStatus('waiting')
    setVerifying(false)
  }

  function handleVerify() {
    if (status === 'expired') return
    setVerifying(true)
    setStatus('processing')
    // UI mock — replace with GET payment-status API
    window.setTimeout(() => {
      setVerifying(false)
      setStatus('success')
    }, 900)
  }

  function handleComplete() {
    if (status !== 'success') return
    onComplete()
  }

  const expired = status === 'expired'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-pay-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(760px,92dvh)] max-w-[440px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/90 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_32px_rgba(31,17,20,0.18)]">
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2 id="qr-pay-title" className="text-xl font-bold text-salon-text">
              Scan QR to Pay
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              UPI · {DEMO_MERCHANT.payeeName}
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
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
          {/* Total */}
          <div className="rounded-2xl bg-salon-primary-light/70 px-4 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Amount to collect
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-salon-primary">
              ₹{formatCurrency(amount)}
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-salon-border bg-salon-bg px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-salon-text">
              <Timer size={20} className="text-salon-primary" />
              QR expires in
            </span>
            <span
              className={[
                'text-lg font-bold tabular-nums',
                expired ? 'text-salon-danger' : 'text-salon-text',
              ].join(' ')}
            >
              {formatMmSs(secondsLeft)}
            </span>
          </div>

          {/* QR image */}
          <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-salon-border bg-white p-4">
            {expired ? (
              <div className="flex h-[240px] w-[240px] flex-col items-center justify-center gap-2 rounded-xl bg-salon-bg text-center">
                <p className="text-base font-semibold text-salon-text">
                  QR expired
                </p>
                <p className="px-4 text-sm text-salon-muted">
                  Refresh to generate a new code
                </p>
              </div>
            ) : (
              <img
                src={qrSrc}
                alt="UPI QR code for payment"
                width={240}
                height={240}
                className="h-[240px] w-[240px] rounded-lg"
              />
            )}
            <p className="text-center text-xs text-salon-muted">
              Scan with any UPI app · {DEMO_MERCHANT.vpa}
            </p>
            <Button
              variant="outline"
              size="compact"
              icon={<RefreshCw size={18} />}
              onClick={handleRefreshQr}
              className="min-h-[48px] px-4"
            >
              Refresh QR
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3 rounded-xl border border-salon-border px-4 py-3">
            {status === 'processing' || verifying ? (
              <Loader2 size={22} className="animate-spin text-salon-primary" />
            ) : status === 'success' ? (
              <CheckCircle2 size={22} className="text-salon-success" />
            ) : (
              <QrCode size={22} className="text-salon-primary" />
            )}
            <p className="text-sm font-semibold text-salon-text">
              {status === 'success'
                ? 'Payment verified'
                : status === 'processing'
                  ? 'Checking payment status…'
                  : expired
                    ? 'Session expired'
                    : 'Waiting for customer to pay…'}
            </p>
          </div>

          <Button
            variant="secondary"
            size="secondary"
            disabled={expired || verifying || status === 'success'}
            onClick={handleVerify}
            className="min-h-[56px] w-full"
          >
            Verify Payment Status
          </Button>
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
            icon={<CheckCircle2 size={22} />}
            disabled={status !== 'success'}
            onClick={handleComplete}
            className="min-h-[56px] w-full sm:flex-[1.4]"
          >
            Complete QR Payment
          </Button>
        </footer>
      </div>
    </div>
  )
}