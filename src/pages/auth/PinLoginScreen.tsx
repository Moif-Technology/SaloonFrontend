import { useCallback, useEffect, useRef, useState } from 'react'
import { Delete, RefreshCw } from 'lucide-react'
import { apiService } from '../../api/apiService'
import {
  clearEnrollment,
  getEnrollment,
} from '../../utils/deviceEnrollment'
import { applyPinLoginSession } from '../../utils/pinLoginSession'
import { loadReceiptSettings } from '../../utils/receiptSettings'

const PIN_MIN = 4
const PIN_MAX = 6

type Props = {
  onLoggedIn: () => void
  onNeedsEnrollment: () => void
}

export default function PinLoginScreen({ onLoggedIn, onNeedsEnrollment }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [stationName, setStationName] = useState('')
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    const enrollment = getEnrollment()
    setStationName(enrollment?.stationName || '')
  }, [])

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
    }
  }, [])

  const submit = useCallback(
    async (pinValue: string) => {
      if (submittingRef.current) return
      const enrollment = getEnrollment()
      if (!enrollment) {
        onNeedsEnrollment()
        return
      }
      if (!/^\d{4,6}$/.test(pinValue)) {
        setError('Enter a 4–6 digit PIN')
        return
      }

      submittingRef.current = true
      setSubmitting(true)
      setError(null)

      try {
        const session = await apiService.pinLogin({
          pin: pinValue,
          companyId: enrollment.companyId,
          deviceToken: enrollment.deviceToken,
        })
        applyPinLoginSession(session)
        void loadReceiptSettings().catch(() => {
          /* bill print uses empty headings until POS Setup is saved */
        })
        onLoggedIn()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid PIN'
        const lower = msg.toLowerCase()
        if (
          lower.includes('not enrolled') ||
          lower.includes('different company') ||
          lower.includes('no station')
        ) {
          clearEnrollment()
          onNeedsEnrollment()
          return
        }
        setPin('')
        setError(msg.replace(/^PIN login failed:\s*/i, '') || 'Invalid PIN')
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [onLoggedIn, onNeedsEnrollment],
  )

  const scheduleAutoSubmit = useCallback(
    (next: string) => {
      if (autoTimer.current) clearTimeout(autoTimer.current)
      if (next.length >= PIN_MAX) {
        void submit(next)
        return
      }
      if (next.length >= PIN_MIN) {
        autoTimer.current = setTimeout(() => void submit(next), 400)
      }
    },
    [submit],
  )

  function tapDigit(d: string) {
    if (submitting || pin.length >= PIN_MAX) return
    const next = pin + d
    setPin(next)
    setError(null)
    scheduleAutoSubmit(next)
  }

  function backspace() {
    if (submitting) return
    if (autoTimer.current) clearTimeout(autoTimer.current)
    setPin((p) => p.slice(0, -1))
    setError(null)
  }

  function clearPin() {
    if (submitting) return
    if (autoTimer.current) clearTimeout(autoTimer.current)
    setPin('')
    setError(null)
  }

  const pinRef = useRef(pin)
  pinRef.current = pin

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (submittingRef.current) return
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        setPin((prev) => {
          if (prev.length >= PIN_MAX) return prev
          const next = prev + e.key
          setError(null)
          if (autoTimer.current) clearTimeout(autoTimer.current)
          if (next.length >= PIN_MAX) {
            void submit(next)
          } else if (next.length >= PIN_MIN) {
            autoTimer.current = setTimeout(() => void submit(next), 400)
          }
          return next
        })
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        if (autoTimer.current) clearTimeout(autoTimer.current)
        setPin((p) => p.slice(0, -1))
        setError(null)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        if (autoTimer.current) clearTimeout(autoTimer.current)
        setPin('')
        setError(null)
      } else if (e.key === 'Enter' && pinRef.current.length >= PIN_MIN) {
        e.preventDefault()
        if (autoTimer.current) clearTimeout(autoTimer.current)
        void submit(pinRef.current)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [submit])

  function handleReEnroll() {
    clearEnrollment()
    onNeedsEnrollment()
  }

  const keys: Array<{ label: string; action: () => void; danger?: boolean; icon?: boolean }> = [
    { label: '1', action: () => tapDigit('1') },
    { label: '2', action: () => tapDigit('2') },
    { label: '3', action: () => tapDigit('3') },
    { label: '4', action: () => tapDigit('4') },
    { label: '5', action: () => tapDigit('5') },
    { label: '6', action: () => tapDigit('6') },
    { label: '7', action: () => tapDigit('7') },
    { label: '8', action: () => tapDigit('8') },
    { label: '9', action: () => tapDigit('9') },
    { label: 'C', action: clearPin, danger: true },
    { label: '0', action: () => tapDigit('0') },
    { label: 'back', action: backspace, icon: true },
  ]

  return (
    <div className="h-full flex flex-col bg-[#F3F1F0]">
      <header className="shrink-0 w-full bg-salon-primary text-white px-5 py-3.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-white text-salon-primary flex items-center justify-center text-xs font-bold">
          S
        </div>
        <span className="font-bold text-[17px]">Salon POS</span>
        <div className="flex-1" />
        {stationName ? (
          <span className="text-white/70 text-xs hidden sm:inline">{stationName}</span>
        ) : null}
        <button
          type="button"
          onClick={handleReEnroll}
          className="inline-flex items-center gap-1.5 text-white/70 text-xs px-2 py-1.5 hover:text-white"
        >
          <RefreshCw size={16} />
          Re-enroll
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div className="w-full max-w-[320px] flex flex-col items-center">
          <h2 className="text-[15px] font-bold text-salon-text mb-3.5">Enter your PIN</h2>

          <div className="flex justify-center gap-2.5 mb-3.5" aria-label="PIN length">
            {Array.from({ length: PIN_MAX }, (_, i) => {
              const filled = i < pin.length
              return (
                <span
                  key={i}
                  className={[
                    'w-3.5 h-3.5 rounded-full border-[1.5px]',
                    filled
                      ? 'bg-salon-primary border-salon-primary'
                      : 'bg-transparent border-[#BDB6B3]',
                  ].join(' ')}
                />
              )
            })}
          </div>

          {error ? (
            <p className="text-[#B3261E] text-[13px] text-center mb-3.5 whitespace-pre-wrap">
              {error}
            </p>
          ) : (
            <p className="text-salon-muted text-[13px] text-center mb-3.5">
              4–6 digits · no need to pick a name
            </p>
          )}

          <div className="w-full grid grid-cols-3 gap-2.5">
            {keys.map((k) => (
              <button
                key={k.label}
                type="button"
                disabled={submitting}
                onMouseDown={(e) => e.preventDefault()}
                onClick={k.action}
                className={[
                  'h-16 rounded-lg bg-white border border-[#DDD8D6] shadow-sm',
                  'text-xl font-bold text-salon-text',
                  'active:scale-[0.97] transition-transform disabled:opacity-50',
                  'flex items-center justify-center',
                  k.danger ? 'text-[#B3261E]' : '',
                ].join(' ')}
                aria-label={k.icon ? 'Backspace' : k.label}
              >
                {k.icon ? <Delete size={22} /> : k.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={submitting || pin.length < PIN_MIN}
            onClick={() => {
              if (autoTimer.current) clearTimeout(autoTimer.current)
              void submit(pin)
            }}
            className="mt-3 w-full h-12 rounded-lg bg-salon-primary text-white font-bold disabled:opacity-50"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
