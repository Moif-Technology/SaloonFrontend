import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import NumericKeypad from './NumericKeypad'
import type { NumericKey } from '../../utils/numericInput'

interface NumericKeypadModalProps {
  open: boolean
  title: string
  label: string
  value: string
  error?: string | null
  placeholder?: string
  onKey: (key: NumericKey) => void
  onDone: () => void
  onClose: () => void
  allowDecimal?: boolean
  doneLabel?: string
  /** Optional extra left-panel content (helper text, currency prefix, etc.) */
  leftExtra?: ReactNode
}

export default function NumericKeypadModal({
  open,
  title,
  label,
  value,
  error,
  placeholder = '0',
  onKey,
  onDone,
  onClose,
  allowDecimal = true,
  doneLabel = 'Done',
  leftExtra,
}: NumericKeypadModalProps) {
    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [open, onClose])
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="numeric-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* ~1280-friendly fixed footprint — avoids layout shift */}
      <div className="flex h-[min(520px,90dvh)] w-full max-w-[900px] overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* LEFT */}
        <div className="flex w-[42%] flex-col border-r border-salon-border p-5">
          <header className="mb-4 flex items-start justify-between gap-2">
            <h2 id="numeric-entry-title" className="text-xl font-bold text-salon-text">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          <label className="block flex-1">
            <span className="text-base font-semibold text-salon-text">{label}</span>
            {/*
              CRITICAL: block native keyboard
              - readOnly
              - inputMode="none"
              - optional tabIndex still allows programmatic focus for a11y
            */}
            <input
              readOnly
              inputMode="none"
              autoComplete="off"
              value={value}
              placeholder={placeholder}
              // Soft focus ring only — no OS keyboard
              tabIndex={0}
              className="mt-2 w-full rounded-xl border-2 border-salon-primary bg-salon-primary-light/30
                         px-4 py-4 text-3xl font-bold tabular-nums text-salon-text outline-none
                         placeholder:text-salon-muted/50"
            />
            {error ? (
              <p className="mt-2 text-sm font-medium text-salon-danger" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-2 h-5 text-sm" aria-hidden>
                {/* reserve space so error doesn't shift layout */}
              </p>
            )}
          </label>

          {leftExtra}
        </div>

        {/* RIGHT — fixed keypad */}
        <div className="flex w-[58%] flex-col bg-salon-bg p-4">
          <NumericKeypad
            onKey={onKey}
            onDone={onDone}
            allowDecimal={allowDecimal}
            doneLabel={doneLabel}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  )
}