import { useMemo, useState } from 'react'
import { NotebookPen, X } from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface DailyClosingModalProps {
  open: boolean
  onClose: () => void
}

type PaymentBreakdown = {
  cash: number
  card: number
  digital: number
}

export default function DailyClosingModal({
  open,
  onClose,
}: DailyClosingModalProps) {
  const { showSnackbar } = useSnackbar()

  const [openingCash, setOpeningCash] = useState('10000')
  const [cashIn, setCashIn] = useState('25000')
  const [cashOut, setCashOut] = useState('5000')
  const [actualCountedCash, setActualCountedCash] = useState('29000')

  const [paymentBreakdown, setPaymentBreakdown] =
    useState<PaymentBreakdown>({
      cash: 30000,
      card: 18500,
      digital: 12500,
    })

  const [discrepancyNotes, setDiscrepancyNotes] = useState('')
  const [confirmLockOpen, setConfirmLockOpen] = useState(false)

  const expectedClosingCash = useMemo(() => {
    const opening = Number(openingCash) || 0
    const incoming = Number(cashIn) || 0
    const outgoing = Number(cashOut) || 0

    return opening + incoming - outgoing
  }, [openingCash, cashIn, cashOut])

  const discrepancy = useMemo(() => {
    const actual = Number(actualCountedCash) || 0

    return actual - expectedClosingCash
  }, [actualCountedCash, expectedClosingCash])

  const totalPayments = useMemo(() => {
    return (
      paymentBreakdown.cash +
      paymentBreakdown.card +
      paymentBreakdown.digital
    )
  }, [paymentBreakdown])

  function formatCurrency(value: number) {
    return value.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    })
  }

  function handleSaveRequest() {
    setConfirmLockOpen(true)
  }

  function handleConfirmLock() {
    setConfirmLockOpen(false)

    showSnackbar(
      'Daily closing saved and locked successfully!',
      'success',
    )

    onClose()
  }

  function handleCancelLock() {
    setConfirmLockOpen(false)
  }

  function updatePayment(
    key: keyof PaymentBreakdown,
    value: string,
  ) {
    const numericValue = Number(value)

    setPaymentBreakdown((previous) => ({
      ...previous,
      [key]: Number.isFinite(numericValue)
        ? numericValue
        : 0,
    }))
  }

  if (!open) return null

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <NotebookPen size={22} />
              </span>
              <div>
                <h2 id="daily-closing-title" className="text-xl font-bold text-salon-text">
                  Daily Closing
                </h2>
                <p className="text-sm text-salon-muted">
                  Review payments, cash balances, and finalize the day's closing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close daily closing"
            >
              <X size={22} />
            </button>
          </header>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            <div className="space-y-6">
              {/* Cash Summary */}
              <section>
                <div className="mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cash Summary
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                  {/* Opening Cash */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <label
                      htmlFor="opening-cash"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Opening Cash
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        id="opening-cash"
                        type="number"
                        min="0"
                        value={openingCash}
                        onChange={(event) =>
                          setOpeningCash(event.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>
                  </div>

                  {/* Cash In */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <label
                      htmlFor="cash-in"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Cash In
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        id="cash-in"
                        type="number"
                        min="0"
                        value={cashIn}
                        onChange={(event) =>
                          setCashIn(event.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>
                  </div>

                  {/* Cash Out */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <label
                      htmlFor="cash-out"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Cash Out
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        id="cash-out"
                        type="number"
                        min="0"
                        value={cashOut}
                        onChange={(event) =>
                          setCashOut(event.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>
                  </div>

                  {/* Expected Closing */}
                  <div className="rounded-xl border border-[#6b1d2f]/30 bg-gradient-to-br from-white to-[#6b1d2f]/5 p-3.5 shadow-xs">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[#6b1d2f]">
                      Expected Closing
                    </p>
                    <p className="mt-1 text-base font-extrabold text-[#6b1d2f] tabular-nums">
                      {formatCurrency(expectedClosingCash)}
                    </p>
                  </div>

                  {/* Actual Counted */}
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                    <label
                      htmlFor="actual-counted-cash"
                      className="mb-1.5 block text-xs font-semibold text-slate-600"
                    >
                      Actual Counted Cash
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₹
                      </span>
                      <input
                        id="actual-counted-cash"
                        type="number"
                        min="0"
                        value={actualCountedCash}
                        onChange={(event) =>
                          setActualCountedCash(event.target.value)
                        }
                        className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Discrepancy & Notes */}
              <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Cash Discrepancy
                    </h3>
                    <p className="text-xs text-slate-500">
                      Difference between expected and actual counted cash.
                    </p>
                  </div>

                  <span
                    className={`text-sm font-bold ${
                      discrepancy === 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {discrepancy > 0 ? '+' : ''}
                    {formatCurrency(discrepancy)}
                  </span>
                </div>

                <div className="mt-3">
                  <textarea
                    id="discrepancy-notes"
                    rows={2}
                    value={discrepancyNotes}
                    onChange={(event) =>
                      setDiscrepancyNotes(event.target.value)
                    }
                    placeholder="Add notes if there is a difference in the cash count..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  />
                </div>
              </section>

              {/* Payment Breakdown */}
              <section>
                <div className="mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Payment Breakdown
                  </h3>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {/* Cash */}
                    <div className="p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Cash Payments
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentBreakdown.cash}
                          onChange={(event) =>
                            updatePayment('cash', event.target.value)
                          }
                          className="w-full border-b border-slate-300 bg-transparent py-0.5 text-base font-bold text-slate-900 outline-none focus:border-[#6b1d2f]"
                        />
                      </div>
                    </div>

                    {/* Card */}
                    <div className="p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Card Payments
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentBreakdown.card}
                          onChange={(event) =>
                            updatePayment('card', event.target.value)
                          }
                          className="w-full border-b border-slate-300 bg-transparent py-0.5 text-base font-bold text-slate-900 outline-none focus:border-[#6b1d2f]"
                        />
                      </div>
                    </div>

                    {/* Digital */}
                    <div className="p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Digital Payments
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={paymentBreakdown.digital}
                          onChange={(event) =>
                            updatePayment('digital', event.target.value)
                          }
                          className="w-full border-b border-slate-300 bg-transparent py-0.5 text-base font-bold text-slate-900 outline-none focus:border-[#6b1d2f]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between border-t border-slate-200 bg-[#f9f9f9] px-4 py-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Total Payment Collections
                    </span>
                    <span className="text-xs font-bold text-[#6b1d2f]">
                      {formatCurrency(totalPayments)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Lock Notice */}
              <div className="rounded-xl border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 px-4 py-3">
                <p className="text-xs text-slate-600">
                  Once the daily closing is confirmed, the day's closing record will be locked and should not be modified without authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSaveRequest}
              className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
            >
              Save & Lock Closing
            </button>
          </div>
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      {confirmLockOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#6b1d2f]/20 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-salon-text">
                Lock Daily Closing?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Are you sure you want to save and lock today's closing? Once locked, the record should not be modified without authorization.
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelLock}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmLock}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}