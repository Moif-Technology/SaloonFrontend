import { useState } from 'react'
import { X, ListOrdered  } from 'lucide-react'
import Button from '../common/Button'

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
  const [queue] = useState(MOCK_QUEUE)

  const totalInQueue = queue.length
  const avgWaitMins =
    queue.length === 0
      ? 0
      : Math.round(
        queue.reduce((sum, item) => sum + item.waitTime, 0) / queue.length,
      )

  if (!open) return null

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
      <div className="flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-5 py-4">

          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <ListOrdered  size={22} />
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
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto bg-salon-bg px-4 py-4 sm:px-5">
          <div className="mb-4 flex flex-wrap gap-3">
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
          ? 'rounded-full bg-salon-primary/10 px-2.5 py-1 text-xs font-semibold text-salon-primary'
          : 'rounded-full bg-salon-surface px-2.5 py-1 text-xs font-semibold text-salon-muted'
      }
    >
      {item.status}
    </span>
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
    </div>
  )
}
 