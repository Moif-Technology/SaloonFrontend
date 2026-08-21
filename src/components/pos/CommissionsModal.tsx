import { useState, useEffect } from 'react'
import { Percent, X, Eye, ChevronDown, CalendarDays } from 'lucide-react'
import Button from '../common/Button'
import { formatCurrency } from '../../utils/format'
import { useSnackbar } from '../../context/SnackbarContext'
type PayoutStatus = 'Paid' | 'Pending'

type CommissionRow = {
  id: string
  name: string
  serviceRevenue: number
  commissionRate: number // e.g. 0.2 = 20%
  status: PayoutStatus
}
type ServiceBreakdown = {
  service: string
  client: string
  revenue: number
}

const MOCK_COMMISSIONS: CommissionRow[] = [
  { id: '1', name: 'Jessica Roy', serviceRevenue: 42000, commissionRate: 0.2, status: 'Paid' },
  { id: '2', name: 'David Kumar', serviceRevenue: 28500, commissionRate: 0.25, status: 'Pending' },
  { id: '3', name: 'Mia Thomas', serviceRevenue: 15600, commissionRate: 0.2, status: 'Pending' },
]
const MOCK_MONTHLY_COMMISSIONS: Record<string, CommissionRow[]> = {
  '2026-08': MOCK_COMMISSIONS,

  '2026-07': [
    {
      id: '1',
      name: 'Jessica Roy',
      serviceRevenue: 38500,
      commissionRate: 0.2,
      status: 'Paid',
    },
    {
      id: '2',
      name: 'David Kumar',
      serviceRevenue: 31200,
      commissionRate: 0.25,
      status: 'Paid',
    },
    {
      id: '3',
      name: 'Mia Thomas',
      serviceRevenue: 14200,
      commissionRate: 0.2,
      status: 'Pending',
    },
  ],

  '2026-06': [
    {
      id: '1',
      name: 'Jessica Roy',
      serviceRevenue: 40100,
      commissionRate: 0.2,
      status: 'Paid',
    },
    {
      id: '2',
      name: 'David Kumar',
      serviceRevenue: 26900,
      commissionRate: 0.25,
      status: 'Pending',
    },
    {
      id: '3',
      name: 'Mia Thomas',
      serviceRevenue: 16800,
      commissionRate: 0.2,
      status: 'Paid',
    },
  ],
}
const MOCK_SERVICE_BREAKDOWNS: Record<string, ServiceBreakdown[]> = {
  '1': [
    { service: 'Haircut', client: 'Anjali Menon', revenue: 2500 },
    { service: 'Keratin Treatment', client: 'Meera Nair', revenue: 8000 },
    { service: 'Facial', client: 'Priya Shah', revenue: 4500 },
  ],
  '2': [
    { service: 'Hair Coloring', client: 'Neha Thomas', revenue: 6500 },
    { service: 'Haircut', client: 'Rahul Kumar', revenue: 1800 },
    { service: 'Beard Styling', client: 'Arjun Das', revenue: 1200 },
  ],
  '3': [
    { service: 'Facial', client: 'Divya Menon', revenue: 3500 },
    { service: 'Hair Spa', client: 'Sneha Raj', revenue: 2800 },
  ],
}

function statusBadgeClass(status: PayoutStatus) {
    if (status === 'Paid') return 'bg-emerald-100 text-emerald-700'
    return 'bg-amber-100 text-amber-700'
  }

export interface CommissionsModalProps {
  open: boolean
  onClose: () => void
}

export default function CommissionsModal({
  open,
  onClose,
}: CommissionsModalProps) {
  const { showSnackbar } = useSnackbar()
  const [rows, setRows] = useState(MOCK_COMMISSIONS)
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08')
  const [isPeriodOpen, setIsPeriodOpen] = useState(false)
  const [selectedBreakdown, setSelectedBreakdown] =
  useState<CommissionRow | null>(null)
  useEffect(() => {
    setRows(MOCK_MONTHLY_COMMISSIONS[selectedPeriod] ?? [])
    setSelectedBreakdown(null)
  }, [selectedPeriod])

const commissionEarned = (row: CommissionRow) =>
  row.serviceRevenue * row.commissionRate

const totalPayoutThisMonth = rows
  .filter((r) => r.status === 'Paid')
  .reduce((sum, r) => sum + commissionEarned(r), 0)

const pendingCommissions = rows
  .filter((r) => r.status === 'Pending')
  .reduce((sum, r) => sum + commissionEarned(r), 0)
  function handleProcessPayout(id: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, status: 'Paid' as const } : row,
      ),
    )
    showSnackbar('Commission payout processed successfully', 'success')
  }
  function handleProcessAll() {
    const pendingCount = rows.filter((row) => row.status === 'Pending').length
  
    if (pendingCount === 0) {
      showSnackbar('There are no pending commissions to process', 'success')
      return
    }
  
    const confirmed = window.confirm(
      `Process payouts for all ${pendingCount} pending staff commissions?`,
    )
  
    if (!confirmed) return
  
    setRows((prev) =>
      prev.map((row) =>
        row.status === 'Pending'
          ? { ...row, status: 'Paid' as const }
          : row,
      ),
    )
  
    showSnackbar(
      `${pendingCount} pending commission${pendingCount > 1 ? 's' : ''} processed successfully`,
      'success',
    )
  }
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-commissions-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Percent size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="staff-commissions-title"
                className="text-xl font-bold text-salon-text"
              >
                Staff Commissions
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
  <p className="text-sm font-medium text-salon-muted">
    Track staff earnings and process payouts
  </p>

  <div className="relative">
  <button
    type="button"
    onClick={() => setIsPeriodOpen((prev) => !prev)}
    className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-900 shadow-sm transition-colors hover:bg-rose-50"
    aria-haspopup="listbox"
    aria-expanded={isPeriodOpen}
  >
    <CalendarDays size={15} className="text-[#6b1d2f]" />

    <span>
      {selectedPeriod === '2026-08'
        ? 'August 2026'
        : selectedPeriod === '2026-07'
          ? 'July 2026'
          : selectedPeriod === '2026-06'
            ? 'June 2026'
            : selectedPeriod === '2026-05'
              ? 'May 2026'
              : 'April 2026'}
    </span>

    <ChevronDown
      size={14}
      className={`text-[#6b1d2f] transition-transform ${
        isPeriodOpen ? 'rotate-180' : ''
      }`}
    />
  </button>

  {isPeriodOpen && (
    <div
      className="absolute left-0 top-full z-30 mt-2 w-40 overflow-hidden rounded-xl border border-rose-200 bg-white p-1.5 shadow-xl"
      role="listbox"
    >
      {[
        ['2026-08', 'August 2026'],
        ['2026-07', 'July 2026'],
        ['2026-06', 'June 2026'],
        ['2026-05', 'May 2026'],
        ['2026-04', 'April 2026'],
      ].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setSelectedPeriod(value)
            setIsPeriodOpen(false)
          }}
          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
            selectedPeriod === value
              ? 'bg-[#6b1d2f] text-white'
              : 'text-rose-900 hover:bg-rose-50'
          }`}
          role="option"
          aria-selected={selectedPeriod === value}
        >
          {label}
        </button>
      ))}
    </div>
  )}
</div>
</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
  <button
    type="button"
    onClick={handleProcessAll}
    className="inline-flex h-9 items-center rounded-lg bg-[#6b1d2f] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#5a1828] disabled:cursor-not-allowed disabled:opacity-50"
    disabled={!rows.some((row) => row.status === 'Pending')}
  >
    Process All Pending
  </button>

  <button
    type="button"
    onClick={onClose}
    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
    aria-label="Close"
  >
    <X size={22} />
  </button>
</div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/80 px-4 pb-3 md:px-5">
  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
    <div className="rounded-xl border border-salon-border bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        Total Payout This Month
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-salon-primary">
        ₹{formatCurrency(totalPayoutThisMonth)}
      </p>
    </div>
    <div className="rounded-xl border border-salon-border bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        Pending Commissions
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
        ₹{formatCurrency(pendingCommissions)}
      </p>
    </div>
  </div>

 <div className="mt-3 overflow-x-auto rounded-xl border border-salon-border bg-white">
  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
    <thead>
      <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        <th className="px-3 py-2">Employee Name</th>
        <th className="px-3 py-2">Service Revenue Generated</th>
        <th className="px-3 py-2">Commission Rate</th>
        <th className="px-3 py-2">Commission Earned</th>
        <th className="px-3 py-2">Payout Status</th>
        <th className="px-3 py-2 text-right">Action</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-salon-border text-salon-text last:border-b-0">
          <td className="px-3 py-2.5 font-medium">{row.name}</td>
          <td className="px-3 py-2.5 tabular-nums">
            ₹{formatCurrency(row.serviceRevenue)}
          </td>
          <td className="px-3 py-2.5 tabular-nums">
            {Math.round(row.commissionRate * 100)}%
          </td>
          <td className="px-3 py-2.5">
  <div className="flex items-center gap-2 font-semibold tabular-nums text-salon-primary">
    <span>
      ₹{formatCurrency(commissionEarned(row))}
    </span>

    <button
      type="button"
      onClick={() => setSelectedBreakdown(row)}
      className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-salon-muted transition-colors hover:bg-salon-primary-light hover:text-[#6b1d2f]"
      aria-label={`View service breakdown for ${row.name}`}
      title="View service breakdown"
    >
      <Eye size={15} />
    </button>
  </div>
</td>
          <td className="px-3 py-2.5">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
            >
              {row.status}
            </span>
          </td>
          <td className="px-3 py-2.5 text-right">
            {row.status === 'Pending' ? (
              <button
                type="button"
                onClick={() => handleProcessPayout(row.id)}
                className="h-7 rounded-lg bg-salon-primary px-2.5 text-[11px] font-semibold text-white hover:bg-salon-primary/90"
              >
                Process Payout
              </button>
            ) : (
              <span className="text-xs font-medium text-salon-muted">—</span>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
</div>
<footer className="flex shrink-0 border-t border-salon-border px-4 py-3.5 sm:px-5">
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
{selectedBreakdown && (
  <div
    className="absolute inset-0 z-20 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="commission-breakdown-title"
  >
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-salon-border bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
        <div className="min-w-0">
          <h3
            id="commission-breakdown-title"
            className="text-lg font-bold text-salon-text"
          >
            Service Breakdown
          </h3>

          <p className="mt-0.5 text-sm font-medium text-salon-muted">
            {selectedBreakdown && (
  <div
   className="absolute inset-0 z-20 flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="commission-breakdown-title"
  >
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-salon-border bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
        <div className="min-w-0">
          <h3
            id="commission-breakdown-title"
            className="text-lg font-bold text-salon-text"
          >
            Service Breakdown
          </h3>

          <p className="mt-0.5 text-sm font-medium text-salon-muted">
            {selectedBreakdown && (
  <div
    className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="commission-breakdown-title"
  >
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-salon-border bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
        <div className="min-w-0">
          <h3
            id="commission-breakdown-title"
            className="text-lg font-bold text-salon-text"
          >
            Service Breakdown
          </h3>

          <p className="mt-0.5 text-sm font-medium text-salon-muted">
          {selectedBreakdown && (
  <div
    className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="commission-breakdown-title"
  >
    <div className="w-full max-w-[620px] overflow-hidden rounded-2xl border border-salon-border bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-salon-border px-5 py-4">
        <div className="min-w-0">
          <h3
            id="commission-breakdown-title"
            className="text-lg font-bold text-salon-text"
          >
            Service Breakdown
          </h3>

          <p className="mt-0.5 text-sm font-medium text-salon-muted">
            {selectedBreakdown.name} · August 2026
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBreakdown(null)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          aria-label="Close service breakdown"
        >
          <X size={19} />
        </button>
      </header>

      <div className="max-h-[420px] overflow-auto px-5 py-4">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-salon-border text-[11px] font-bold uppercase tracking-wide text-salon-muted">
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2 text-right">Revenue</th>
            </tr>
          </thead>

          <tbody>
            {(MOCK_SERVICE_BREAKDOWNS[selectedBreakdown.id] ?? []).map(
              (item, index) => (
                <tr
                  key={`${selectedBreakdown.id}-${index}`}
                  className="border-b border-salon-border last:border-b-0"
                >
                  <td className="px-2 py-2.5 font-medium text-salon-text">
                    {item.service}
                  </td>

                  <td className="px-2 py-2.5 text-salon-muted">
                    {item.client}
                  </td>

                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-salon-primary">
                    ₹{formatCurrency(item.revenue)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-salon-surface px-4 py-3">
          <span className="text-sm font-semibold text-salon-muted">
            Total Service Revenue
          </span>

          <span className="text-base font-bold tabular-nums text-[#6b1d2f]">
            ₹{formatCurrency(selectedBreakdown.serviceRevenue)}
          </span>
        </div>
      </div>

      <footer className="flex justify-end border-t border-salon-border px-5 py-3">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          onClick={() => setSelectedBreakdown(null)}
        >
          Close
        </Button>
      </footer>
    </div>
  </div>
)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBreakdown(null)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          aria-label="Close service breakdown"
        >
          <X size={19} />
        </button>
      </header>

      <div className="max-h-[420px] overflow-auto px-5 py-4">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-salon-border text-[11px] font-bold uppercase tracking-wide text-salon-muted">
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2 text-right">Revenue</th>
            </tr>
          </thead>

          <tbody>
            {(MOCK_SERVICE_BREAKDOWNS[selectedBreakdown.id] ?? []).map(
              (item, index) => (
                <tr
                  key={`${selectedBreakdown.id}-${index}`}
                  className="border-b border-salon-border last:border-b-0"
                >
                  <td className="px-2 py-2.5 font-medium text-salon-text">
                    {item.service}
                  </td>

                  <td className="px-2 py-2.5 text-salon-muted">
                    {item.client}
                  </td>

                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-salon-primary">
                    ₹{formatCurrency(item.revenue)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-salon-surface px-4 py-3">
          <span className="text-sm font-semibold text-salon-muted">
            Total Service Revenue
          </span>

          <span className="text-base font-bold tabular-nums text-[#6b1d2f]">
            ₹{formatCurrency(selectedBreakdown.serviceRevenue)}
          </span>
        </div>
      </div>

      <footer className="flex justify-end border-t border-salon-border px-5 py-3">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          onClick={() => setSelectedBreakdown(null)}
        >
          Close
        </Button>
      </footer>
    </div>
  </div>
)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBreakdown(null)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          aria-label="Close service breakdown"
        >
          <X size={19} />
        </button>
      </header>

      <div className="max-h-[420px] overflow-auto px-5 py-4">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-salon-border text-[11px] font-bold uppercase tracking-wide text-salon-muted">
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2 text-right">Revenue</th>
            </tr>
          </thead>

          <tbody>
            {(MOCK_SERVICE_BREAKDOWNS[selectedBreakdown.id] ?? []).map(
              (item, index) => (
                <tr
                  key={`${selectedBreakdown.id}-${index}`}
                  className="border-b border-salon-border last:border-b-0"
                >
                  <td className="px-2 py-2.5 font-medium text-salon-text">
                    {item.service}
                  </td>

                  <td className="px-2 py-2.5 text-salon-muted">
                    {item.client}
                  </td>

                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-salon-primary">
                    ₹{formatCurrency(item.revenue)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-salon-surface px-4 py-3">
          <span className="text-sm font-semibold text-salon-muted">
            Total Service Revenue
          </span>

          <span className="text-base font-bold tabular-nums text-[#6b1d2f]">
            ₹{formatCurrency(selectedBreakdown.serviceRevenue)}
          </span>
        </div>
      </div>

      <footer className="flex justify-end border-t border-salon-border px-5 py-3">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          onClick={() => setSelectedBreakdown(null)}
        >
          Close
        </Button>
      </footer>
    </div>
  </div>
)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBreakdown(null)}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          aria-label="Close service breakdown"
        >
          <X size={19} />
        </button>
      </header>

      <div className="max-h-[420px] overflow-auto px-5 py-4">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-salon-border text-[11px] font-bold uppercase tracking-wide text-salon-muted">
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2 text-right">Revenue</th>
            </tr>
          </thead>

          <tbody>
            {(MOCK_SERVICE_BREAKDOWNS[selectedBreakdown.id] ?? []).map(
              (item, index) => (
                <tr
                  key={`${selectedBreakdown.id}-${index}`}
                  className="border-b border-salon-border last:border-b-0"
                >
                  <td className="px-2 py-2.5 font-medium text-salon-text">
                    {item.service}
                  </td>

                  <td className="px-2 py-2.5 text-salon-muted">
                    {item.client}
                  </td>

                  <td className="px-2 py-2.5 text-right font-semibold tabular-nums text-salon-primary">
                    ₹{formatCurrency(item.revenue)}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-salon-surface px-4 py-3">
          <span className="text-sm font-semibold text-salon-muted">
            Total Service Revenue
          </span>

          <span className="text-base font-bold tabular-nums text-[#6b1d2f]">
            ₹{formatCurrency(selectedBreakdown.serviceRevenue)}
          </span>
        </div>
      </div>

      <footer className="flex justify-end border-t border-salon-border px-5 py-3">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          onClick={() => setSelectedBreakdown(null)}
        >
          Close
        </Button>
      </footer>
    </div>
  </div>
)}
      </div>
    </div>
  )
}