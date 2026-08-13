/**
 * Cash In / Cash Out — petty cash & counter float (Counter-pos CashInOutModal flow).
 * Entries stay PENDING until Z-close; totals appear on Counter Close.
 */
import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  Banknote,
  Keyboard,
  Loader2,
  Save,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import Button from '../common/Button'
import NumericKeypad from '../common/NumericKeypad'
import AlphaKeyboard from '../common/AlphaKeyboard'
import { apiService } from '../../api/apiService'
import { applyNumericKey, type NumericKey } from '../../utils/numericInput'
import { fmtMoney, getPosSession } from '../../utils/posSession'

const IN_CATEGORIES = ['Cash', 'Petty Cash'] as const
const OUT_CATEGORIES = ['Cash', 'Expense From Cash Counter'] as const

type FlowStep = 'choose' | 'entry'
type CashKind = 'in' | 'out'

type CashEntry = {
  id: number
  accountName: string
  category: string
  amount: number
}

interface CashInOutModalProps {
  open: boolean
  onClose: () => void
  onSaved?: (message: string) => void
  onError?: (message: string) => void
}

export default function CashInOutModal({
  open,
  onClose,
  onSaved,
  onError,
}: CashInOutModalProps) {
  const [step, setStep] = useState<FlowStep>('choose')
  const [kind, setKind] = useState<CashKind | null>(null)
  const [typeDesc, setTypeDesc] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [entries, setEntries] = useState<CashEntry[]>([])
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const descRef = useRef<HTMLInputElement>(null)
  const backdropDownRef = useRef(false)

  const categories = kind === 'in' ? IN_CATEGORIES : OUT_CATEGORIES
  const isIn = kind === 'in'
  const parsed = Number(amount) || 0
  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)

  useEffect(() => {
    if (!open) return
    setStep('choose')
    setKind(null)
    setTypeDesc('')
    setCategory('')
    setAmount('')
    setEntries([])
    setKeyboardOpen(false)
    setSaving(false)
    setError(null)
  }, [open])

  useEffect(() => {
    if (!open || step !== 'entry') return
    setCategory(categories[0])
    const t = window.setTimeout(() => descRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open, step, kind]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      e.preventDefault()
      if (step === 'entry') {
        setStep('choose')
        setKind(null)
        setTypeDesc('')
        setCategory('')
        setAmount('')
        setEntries([])
        setError(null)
      } else {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open) return null

  function choose(next: CashKind) {
    setKind(next)
    setStep('entry')
    setError(null)
  }

  function handleAmountKey(key: NumericKey) {
    setAmount((prev) =>
      applyNumericKey(prev, key, {
        allowDecimal: true,
        maxDecimalPlaces: 2,
        allowLeadingZeros: false,
      }),
    )
  }

  function handleEnter() {
    if (parsed <= 0 || !kind) return
    const cat = category || categories[0]
    setEntries((prev) => [
      ...prev,
      {
        id: Date.now() + prev.length,
        accountName: typeDesc.trim() || cat,
        category: cat,
        amount: Math.round((parsed + Number.EPSILON) * 100) / 100,
      },
    ])
    setAmount('')
    setTypeDesc('')
    descRef.current?.focus()
  }

  function removeEntry(id: number) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  async function handleSave() {
    if (!entries.length || saving || !kind) return
    setSaving(true)
    setError(null)
    try {
      const session = getPosSession()
      const transactionType = isIn ? 'CASH_IN' : 'CASH_OUT'
      for (const e of entries) {
        const remarks = [e.category, e.accountName].filter(Boolean).join(' — ')
        await apiService.addCashInOut({
          counterNo: session.counterNo,
          transactionType,
          amount: e.amount,
          remarks: remarks || null,
        })
      }
      const label = isIn ? 'Cash In' : 'Cash Out'
      onSaved?.(
        `${label} saved · ${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} · ${fmtMoney(totalAmount)}`,
      )
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save cash in/out'
      setError(message)
      onError?.(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      aria-label="Cash In Out"
      onMouseDown={(e) => {
        backdropDownRef.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !backdropDownRef.current) return
        backdropDownRef.current = false
        onClose()
      }}
    >
      {step === 'choose' ? (
        <div
          className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-[0_8px_32px_rgba(31,17,20,0.18)] backdrop-blur-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex items-center justify-between bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <ArrowLeftRight size={18} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  Petty cash
                </p>
                <h2 className="text-base font-extrabold leading-tight">Cash In / Cash Out</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </header>

          <div className="flex flex-col gap-4 p-6">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choose('in')}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 px-3 py-6 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-100 text-emerald-600">
                  <Wallet size={32} strokeWidth={1.6} />
                </span>
                <span className="text-center">
                  <span className="block text-base font-extrabold text-emerald-700">Cash IN</span>
                  <span className="mt-1 block text-xs font-medium text-salon-muted">
                    Receive cash into counter
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => choose('out')}
                className="flex flex-col items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-3 py-6 transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-red-200 bg-red-100 text-red-600">
                  <Banknote size={32} strokeWidth={1.6} />
                </span>
                <span className="text-center">
                  <span className="block text-base font-extrabold text-red-700">Cash OUT</span>
                  <span className="mt-1 block text-xs font-medium text-salon-muted">
                    Dispense cash from counter
                  </span>
                </span>
              </button>
            </div>

            <Button type="button" variant="secondary" size="secondary" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-hidden rounded-2xl border border-white/50 bg-white/95 shadow-[0_8px_32px_rgba(31,17,20,0.18)] backdrop-blur-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex shrink-0 items-center justify-between bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark px-4 py-3.5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                {isIn ? <Wallet size={18} /> : <Banknote size={18} />}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                  {isIn ? 'Cash In Entry' : 'Cash Out Entry'}
                </p>
                <h2 className="text-base font-extrabold leading-tight">
                  {isIn ? 'Cash IN' : 'Cash OUT'} · Petty cash
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setStep('choose')
                  setKind(null)
                  setTypeDesc('')
                  setCategory('')
                  setAmount('')
                  setEntries([])
                  setError(null)
                }}
                className="h-8 rounded-lg border border-white/25 bg-white/15 px-3 text-xs font-bold hover:bg-white/25"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/15"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          {error && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* Left: description + entries */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 border-b border-salon-border p-4 md:border-b-0 md:border-r">
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-xs font-bold text-salon-muted">Description</span>
                <div className="relative flex-1">
                  <input
                    ref={descRef}
                    value={typeDesc}
                    onChange={(e) => setTypeDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleEnter()
                      }
                    }}
                    placeholder="Enter description…"
                    className="h-10 w-full rounded-xl border-2 border-salon-border bg-white px-3 pr-12 text-sm font-semibold text-salon-text outline-none focus:border-salon-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyboardOpen((v) => !v)}
                    className={[
                      'absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg',
                      keyboardOpen
                        ? 'bg-salon-primary text-white'
                        : 'bg-salon-bg text-salon-muted hover:bg-salon-primary-light',
                    ].join(' ')}
                    aria-label="Toggle keyboard"
                  >
                    <Keyboard size={16} />
                  </button>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-salon-border">
                <div
                  className={[
                    'grid shrink-0 grid-cols-[1fr_7rem_2.25rem] gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wide',
                    isIn ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800',
                  ].join(' ')}
                >
                  <span>Account / note</span>
                  <span className="text-right">{isIn ? 'Cash In' : 'Cash Out'}</span>
                  <span />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {entries.length === 0 ? (
                    <p className="px-4 py-10 text-center text-sm font-medium text-salon-muted">
                      No entries yet — enter amount and press Enter
                    </p>
                  ) : (
                    entries.map((e, i) => (
                      <div
                        key={e.id}
                        className={[
                          'grid grid-cols-[1fr_7rem_2.25rem] items-center gap-2 border-l-[3px] px-3 py-2',
                          isIn ? 'border-l-emerald-500' : 'border-l-red-500',
                          i % 2 === 0 ? 'bg-white' : 'bg-salon-bg/60',
                        ].join(' ')}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-salon-text">
                            {e.accountName}
                          </p>
                          <p className="text-[11px] font-medium text-salon-muted">{e.category}</p>
                        </div>
                        <span
                          className={[
                            'text-right text-sm font-extrabold tabular-nums',
                            isIn ? 'text-emerald-700' : 'text-red-700',
                          ].join(' ')}
                        >
                          {fmtMoney(e.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeEntry(e.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-600 hover:bg-red-600 hover:text-white"
                          aria-label="Remove entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right: categories + amount + keypad */}
            <div className="flex w-full shrink-0 flex-col gap-3 p-4 md:w-[240px]">
              <div className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const active = category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={[
                        'h-10 rounded-xl border-2 text-xs font-bold uppercase tracking-wide transition',
                        active
                          ? isIn
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-red-300 bg-red-50 text-red-700'
                          : 'border-salon-border bg-salon-bg text-salon-muted hover:bg-salon-primary-light/40',
                      ].join(' ')}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>

              <div className="h-px bg-salon-border" />

              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-salon-muted">
                  Amount
                </p>
                <div
                  className={[
                    'flex h-12 items-center rounded-xl border-2 px-3 text-xl font-extrabold tabular-nums',
                    amount
                      ? isIn
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-red-300 bg-red-50 text-red-700'
                      : 'border-salon-border bg-salon-bg text-salon-muted',
                  ].join(' ')}
                >
                  {amount || '0.00'}
                </div>
              </div>

              <div className="min-h-[220px] flex-1">
                <NumericKeypad
                  allowDecimal
                  showDone
                  doneLabel="Enter"
                  onKey={handleAmountKey}
                  onDone={handleEnter}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {keyboardOpen && (
            <div className="shrink-0 border-t border-salon-border bg-white p-3">
              <AlphaKeyboard
                onChar={(c) => setTypeDesc((v) => v + c)}
                onBackspace={() => setTypeDesc((v) => v.slice(0, -1))}
                onDone={() => setKeyboardOpen(false)}
              />
            </div>
          )}

          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-salon-border bg-salon-bg/80 px-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="text-xs font-bold text-salon-muted">Total</span>
              <div
                className={[
                  'flex h-9 min-w-[7rem] items-center rounded-lg border-2 px-3 text-base font-extrabold tabular-nums',
                  entries.length
                    ? isIn
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-red-300 bg-red-50 text-red-700'
                    : 'border-salon-border bg-white text-salon-muted',
                ].join(' ')}
              >
                {fmtMoney(totalAmount)}
              </div>
              {entries.length > 0 && (
                <span className="text-[11px] font-semibold text-salon-muted">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="primary"
              size="secondary"
              icon={saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              disabled={!entries.length || saving}
              onClick={() => void handleSave()}
              className="min-w-[110px]"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" size="secondary" onClick={onClose}>
              Close
            </Button>
          </footer>
        </div>
      )}
    </div>
  )
}
