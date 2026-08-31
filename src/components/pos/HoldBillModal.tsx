import { useEffect, useState } from 'react'
import {
  X,
  Pause,
  Play,
  Trash2,
  Clock,
  User,
  Scissors,
  StickyNote,
} from 'lucide-react'
import Button from '../common/Button'
import type { HeldBill } from '../../types/pos'
import { formatCurrency } from '../../utils/format'

export interface HoldBillModalProps {
  open: boolean
  onClose: () => void
  /** Can park only when the active cart has lines */
  canHold: boolean
  heldBills: HeldBill[]
  onHold: (note: string) => void
  onRecall: (bill: HeldBill) => void
  onDelete: (billId: string) => void
}

function formatHeldTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export default function HoldBillModal({
  open,
  onClose,
  canHold,
  heldBills,
  onHold,
  onRecall,
  onDelete,
}: HoldBillModalProps) {
  const [note, setNote] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Reset draft note whenever modal opens
  useEffect(() => {
    if (!open) return
    setNote('')
    setConfirmDeleteId(null)
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

  function handleHold() {
    if (!canHold) return
    onHold(note.trim())
    setNote('')
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hold-bills-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(820px,92dvh)] max-w-[720px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* ── Header ── */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-4 py-3.5 sm:px-5 sm:py-4">
  <div className="min-w-0">
    <h2
      id="hold-bills-title"
      className="text-xl font-bold text-salon-text"
    >
      Hold / Parked Bills
    </h2>
    <p className="mt-0.5 text-sm font-medium text-salon-muted">
      Park the current cart or resume a held bill
    </p>
  </div>
  <button
    type="button"
    onClick={onClose}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
    aria-label="Close"
  >
    <X size={22} />
  </button>
</header>

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Section A: Hold current */}
          <section className="rounded-xl border-2 border-salon-primary/20 bg-salon-primary-light/40 p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Pause size={22} className="text-salon-primary" />
              <h3 className="text-lg font-bold text-salon-text">
                Hold Current Bill
              </h3>
            </div>
            <p className="mb-3 text-sm text-salon-muted">
              Parks this cart and clears the POS so you can start a new bill.
            </p>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Note (optional — seat, client nickname…)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Seat 3 / Mrs. Rao waiting"
              maxLength={80}
              className="mb-3 h-14 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-base font-medium text-salon-text outline-none placeholder:text-salon-muted focus:border-salon-primary"
            />
            <Button
              variant="primary"
              size="secondary"
              fullWidth
              disabled={!canHold}
              icon={<Pause size={22} />}
              onClick={handleHold}
            >
              {canHold ? 'Park This Bill' : 'Cart is empty'}
            </Button>
          </section>

          {/* Section B: Retrieve held */}
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-salon-muted">
                Retrieve Held Bills
              </p>
              <span className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-lg bg-salon-primary px-2 text-sm font-bold text-white tabular-nums">
                {heldBills.length}
              </span>
            </div>

            {heldBills.length === 0 ? (
              <div className="rounded-xl border border-dashed border-salon-border bg-salon-bg px-4 py-10 text-center">
                <p className="text-base font-semibold text-salon-muted">
                  No held bills
                </p>
                <p className="mt-1 text-sm text-salon-muted">
                  Parked carts will appear here for recall
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {heldBills.map((bill) => {
                  const deleting = confirmDeleteId === bill.id
                  return (
                    <li
                      key={bill.id}
                      className="rounded-xl border-2 border-salon-border bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-salon-text">
                            Bill #{bill.billNo}
                          </p>
                          {bill.note ? (
                            <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium text-salon-primary">
                              <StickyNote size={14} />
                              {bill.note}
                            </p>
                          ) : null}
                        </div>
                        <p className="text-xl font-bold tabular-nums text-salon-primary">
                          ₹{formatCurrency(bill.total)}
                        </p>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
                        <span className="flex items-center gap-1.5 text-salon-muted">
                          <Clock size={16} />
                          {formatHeldTime(bill.heldAt)}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-salon-text">
                          <User size={16} className="text-salon-muted" />
                          {bill.customerName || 'Walk-in'}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium text-salon-text">
                          <Scissors size={16} className="text-salon-muted" />
                          {bill.stylistName || '—'}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <Button
                          variant="primary"
                          size="compact"
                          className="min-h-12 flex-1"
                          icon={<Play size={18} />}
                          onClick={() => onRecall(bill)}
                        >
                          Recall / Resume
                        </Button>
                        {deleting ? (
                          <>
                            <Button
                              variant="danger"
                              size="compact"
                              className="min-h-12 flex-1"
                              onClick={() => {
                                onDelete(bill.id)
                                setConfirmDeleteId(null)
                              }}
                            >
                              Confirm void
                            </Button>
                            <Button
                              variant="secondary"
                              size="compact"
                              className="min-h-12 flex-1"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            size="compact"
                            className="min-h-12 flex-1"
                            icon={<Trash2 size={18} />}
                            onClick={() => setConfirmDeleteId(bill.id)}
                          >
                            Delete / Void
                          </Button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}