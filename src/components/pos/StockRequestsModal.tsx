import { PackagePlus, X } from 'lucide-react'
import { useState, useEffect } from 'react'

type RequestStatus = 'Pending' | 'Approved' | 'Fulfilled'

type StockRequestRow = {
  id: string
  requestedBy: string
  itemName: string
  quantity: number
  date: string
  status: RequestStatus
}

const MOCK_REQUESTS: StockRequestRow[] = [
  { id: 'SR-001', requestedBy: 'Jessica', itemName: 'Keratin Shampoo', quantity: 12, date: '2026-08-18', status: 'Pending' },
  { id: 'SR-002', requestedBy: 'David', itemName: 'Vitamin C Serum', quantity: 6, date: '2026-08-17', status: 'Approved' },
  { id: 'SR-003', requestedBy: 'Mia', itemName: 'Hair Oil 100ml', quantity: 10, date: '2026-08-15', status: 'Fulfilled' },
]

function statusBadgeClass(status: RequestStatus) {
  if (status === 'Pending') return 'bg-amber-100 text-amber-700'
  if (status === 'Approved') return 'bg-emerald-100 text-emerald-700'
  return 'bg-salon-primary-light text-salon-primary'
}

export interface StockRequestsModalProps {
  open: boolean
  onClose: () => void
}

export default function StockRequestsModal({
  open,
  onClose,
}: StockRequestsModalProps) {
  const [rows, setRows] = useState(MOCK_REQUESTS)
  const [requestFormOpen, setRequestFormOpen] = useState(false)
  const [requestItemName, setRequestItemName] = useState('')
  const [requestQuantity, setRequestQuantity] = useState('')
  const [requestSubmitted, setRequestSubmitted] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    if (!showToast) return

    const timer = setTimeout(() => {
      setShowToast(false)
      setToastMessage('')
    }, 3000)

    return () => clearTimeout(timer)
  }, [showToast])

  function handleNewRequest() {
    setRequestItemName('')
    setRequestQuantity('')
    setRequestSubmitted(false)
    setRequestFormOpen(true)
  }

  function handleSubmitRequest() {
    setRequestSubmitted(true)

    const itemName = requestItemName.trim()
    const quantity = Number(requestQuantity)

    if (!itemName || !requestQuantity || quantity <= 0) {
      return
    }

    const nextId = `SR-${String(rows.length + 1).padStart(3, '0')}`

    const newRequest: StockRequestRow = {
      id: nextId,
      requestedBy: 'Staff',
      itemName,
      quantity,
      date: new Date().toISOString().slice(0, 10),
      status: 'Pending',
    }

    setRows((prev) => [newRequest, ...prev])
    setToastMessage('Stock request submitted successfully')
    setShowToast(true)

    setRequestFormOpen(false)
    setRequestItemName('')
    setRequestQuantity('')
    setRequestSubmitted(false)
  }

  function handleApprove(id: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, status: 'Approved' } : row,
      ),
    )
  }
    
  function handleReject(id: string) {
    setRows((prev) => prev.filter((row) => row.id !== id))
  }
    
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-requests-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <PackagePlus size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="stock-requests-title"
                className="text-xl font-bold text-salon-text"
              >
                Stock Requests
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                View and manage staff product requests
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleNewRequest}
              className="h-10 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              + New Request
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
          <div className="overflow-x-auto rounded-xl border border-salon-border bg-white">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                  <th className="px-3 py-2">Request ID</th>
                  <th className="px-3 py-2">Requested By</th>
                  <th className="px-3 py-2">Item Name</th>
                  <th className="px-3 py-2">Quantity</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-salon-border text-salon-text">
                    <td className="px-3 py-2.5 font-medium tabular-nums">{row.id}</td>
                    <td className="px-3 py-2.5">{row.requestedBy}</td>
                    <td className="px-3 py-2.5 font-medium">{row.itemName}</td>
                    <td className="px-3 py-2.5 tabular-nums">{row.quantity}</td>
                    <td className="px-3 py-2.5 text-salon-muted">{row.date}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {row.status === 'Pending' ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(row.id)}
                            className="inline-flex h-8 items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(row.id)}
                            className="inline-flex h-8 items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-salon-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toast Notification placed at the bottom right */}
        {showToast && (
          <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 rounded-xl bg-[#6b1d2f] px-4 py-3 text-sm font-semibold text-white shadow-xl">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              ✓
            </span>
            <span>{toastMessage}</span>
          </div>
        )}

        {requestFormOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#6b1d2f]/10 bg-white shadow-xl">
              
              <div className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-salon-text">
                    New Stock Request
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-salon-muted">
                    Request an item from inventory
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRequestFormOpen(false)
                    setRequestSubmitted(false)
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
                  aria-label="Close request form"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                <label className="block text-sm font-semibold text-salon-text">
                  Item Name *

                  <input
                    type="text"
                    value={requestItemName}
                    onChange={(e) => setRequestItemName(e.target.value)}
                    placeholder="e.g. Keratin Shampoo"
                    className={[
                      'mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      requestSubmitted && !requestItemName.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-salon-border focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />

                  {requestSubmitted && !requestItemName.trim() && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      Item name is required.
                    </p>
                  )}
                </label>

                <label className="block text-sm font-semibold text-salon-text">
                  Quantity *

                  <input
                    type="number"
                    min={1}
                    value={requestQuantity}
                    onChange={(e) => setRequestQuantity(e.target.value)}
                    placeholder="e.g. 10"
                    className={[
                      'mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      requestSubmitted &&
                      (!requestQuantity || Number(requestQuantity) <= 0)
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-salon-border focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />

                  {requestSubmitted &&
                    (!requestQuantity || Number(requestQuantity) <= 0) && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        Enter a valid quantity.
                      </p>
                    )}
                </label>

                <div className="mt-6 flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestFormOpen(false)
                      setRequestSubmitted(false)
                    }}
                    className="h-10 w-full rounded-xl border border-salon-border bg-white px-4 text-sm font-semibold text-salon-text transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmitRequest}
                    className="h-10 w-full rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  >
                    Submit Request
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}