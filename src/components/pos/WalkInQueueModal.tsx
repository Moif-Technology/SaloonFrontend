import { useState } from 'react'
import { X, ListOrdered, Trash2 } from 'lucide-react'
import Button from '../common/Button'
import { useSnackbar } from '../../context/SnackbarContext'

type WalkInToken = {
  id: string
  token: string
  clientName: string
  service: string
  stylist: string
  status: 'Waiting' | 'Serving'
  waitTime: number
}

const MOCK_QUEUE: WalkInToken[] = [
  {
    id: '1',
    token: 'W-01',
    clientName: 'Priya Nair',
    service: 'Haircut',
    stylist: 'Jessica',
    status: 'Waiting',
    waitTime: 12,
  },
  {
    id: '2',
    token: 'W-02',
    clientName: 'Arjun Menon',
    service: 'Beard Trim',
    stylist: 'David',
    status: 'Serving',
    waitTime: 18,
  },
]

interface WalkInQueueModalProps {
  open: boolean
  onClose: () => void
}

export default function WalkInQueueModal({
  open,
  onClose,
}: WalkInQueueModalProps) {
  const { showSnackbar } = useSnackbar()
  const [queue, setQueue] = useState<WalkInToken[]>(MOCK_QUEUE)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formService, setFormService] = useState('')
  const [formStylist, setFormStylist] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const totalInQueue = queue.length
  const avgWaitMins =
    queue.length === 0
      ? 0
      : Math.round(
          queue.reduce((sum, item) => sum + item.waitTime, 0) / queue.length,
        )

  const triggerToast = (message: string) => {
    setToastMessage(message)
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  function handleStartService(id: string) {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'Serving' } : item))
    )
  }
      
  function handleComplete(id: string) {
    const target = queue.find((item) => item.id === id)
    setQueue((prev) => prev.filter((item) => item.id !== id))
    if (target) {
      showSnackbar(`Walk-in token ${target.token} completed`, 'success')
      triggerToast(`Walk-in token ${target.token} completed successfully`)
    }
  }

  function handleDeleteWalkIn(id: string, token: string, clientName: string) {
    setQueue((prev) => prev.filter((item) => item.id !== id))
    showSnackbar(`Walk-in token ${token} for ${clientName} deleted`, 'info')
    triggerToast(`Walk-in token ${token} deleted successfully`)
  }

  if (!open) return null

  function handleAddWalkIn() {
    if (!formName.trim() || !formService.trim() || !formStylist.trim()) return
  
    const nextNum = queue.length + 1
    const token = `W-${String(nextNum).padStart(2, '0')}`
    const newEntry: WalkInToken = {
      id: String(Date.now()),
      token,
      clientName: formName.trim(),
      service: formService.trim(),
      stylist: formStylist.trim(),
      status: 'Waiting',
      waitTime: 0,
    }
    setQueue((prev) => [...prev, newEntry])
    showSnackbar(`Walk-in token ${token} created successfully`, 'success')
    triggerToast(`Walk-in token ${token} created successfully`)
    setFormName('')
    setFormService('')
    setFormStylist('')
    setShowAddForm(false)
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="walk-in-queue-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl max-h-[min(800px,92dvh)]">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <ListOrdered size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="walk-in-queue-title"
                className="text-xl font-bold text-salon-text"
              >
                Walk-in Queue Management
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                Monitor active walk-in tokens and waiting status
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm((v) => !v)}
              className="h-9 rounded-xl bg-salon-primary px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              + New Walk-in
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-salon-bg px-4 py-4 sm:px-5">
          <div className="mb-4 flex flex-wrap gap-3">
            {showAddForm && (
              <div className="mb-4 w-full rounded-xl border border-salon-border bg-white p-4">
                <p className="mb-3 text-sm font-bold text-salon-text">New Walk-in</p>
                <div className="flex flex-wrap gap-3">
                  <input
                    className="h-9 flex-1 min-w-[140px] rounded-lg border border-salon-border px-3 text-sm text-salon-text placeholder:text-salon-muted focus:outline-none focus:ring-2 focus:ring-salon-primary/30"
                    placeholder="Client Name *"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                  <input
                    className="h-9 flex-1 min-w-[140px] rounded-lg border border-salon-border px-3 text-sm text-salon-text placeholder:text-salon-muted focus:outline-none focus:ring-2 focus:ring-salon-primary/30"
                    placeholder="Service *"
                    value={formService}
                    onChange={(e) => setFormService(e.target.value)}
                  />
                  <input
                    className="h-9 flex-1 min-w-[140px] rounded-lg border border-salon-border px-3 text-sm text-salon-text placeholder:text-salon-muted focus:outline-none focus:ring-2 focus:ring-salon-primary/30"
                    placeholder="Assigned Stylist *"
                    value={formStylist}
                    onChange={(e) => setFormStylist(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddWalkIn}
                    className="h-9 rounded-lg bg-salon-primary px-4 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Create Walk-in
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="h-9 rounded-lg border border-salon-border px-4 text-sm font-semibold text-salon-muted hover:bg-black/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-salon-border bg-white px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                Total in Queue
              </p>
              <p className="text-lg font-bold text-salon-text">{totalInQueue}</p>
            </div>
            <div className="rounded-xl border border-salon-border bg-white px-4 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                Avg. Wait Time
              </p>
              <p className="text-lg font-bold text-salon-text">{avgWaitMins} mins</p>
            </div>
          </div>

          {queue.length === 0 ? (
            <p className="py-12 text-center text-lg font-medium text-salon-muted">
              No walk-ins in queue.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-salon-border bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                    <th className="px-2 py-2">Token</th>
                    <th className="px-2 py-2">Client Name</th>
                    <th className="px-2 py-2">Service</th>
                    <th className="px-2 py-2">Assigned Stylist</th>
                    <th className="px-2 py-2">Wait Time</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((item) => (
                    <tr key={item.id} className="border-b border-salon-border">
                      <td className="px-2 py-2 font-semibold text-salon-text">
                        {item.token}
                      </td>
                      <td className="px-2 py-2 font-medium text-salon-text">
                        {item.clientName}
                      </td>
                      <td className="px-2 py-2 text-salon-text">{item.service}</td>
                      <td className="px-2 py-2 text-salon-text">{item.stylist}</td>
                      <td className="px-2 py-2 text-salon-text">
                        {item.waitTime} mins
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={
                            item.status === 'Serving'
                              ? 'inline-flex rounded-full bg-salon-primary/10 px-2.5 py-0.5 text-xs font-semibold text-salon-primary'
                              : 'inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700'
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === 'Waiting' ? (
                            <button
                              type="button"
                              onClick={() => handleStartService(item.id)}
                              className="h-8 rounded-lg bg-salon-primary px-3 text-xs font-semibold text-white hover:opacity-90"
                            >
                              Start Service
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleComplete(item.id)}
                              className="h-8 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white hover:opacity-90"
                            >
                              Complete
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteWalkIn(item.id, item.token, item.clientName)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-salon-border text-salon-muted hover:bg-rose-50 hover:text-salon-primary hover:border-salon-primary/30 transition-colors"
                            title="Delete token"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            fullWidth
            onClick={onClose}
          >
            Close
          </Button>
        </footer>
      </div>

      {showToast && (
        <div className="fixed bottom-6 right-6 z-[110] flex items-center gap-3 rounded-xl border border-[#83263c] bg-[#6b1d2f] px-4 py-3 shadow-xl animate-[slideUp_0.25s_ease-out]">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <p className="text-[12px] font-medium text-white">{toastMessage}</p>
        </div>
      )}
    </div>
  )
}