/**
 * Job List — open (unsettled) jobs from Save Bill.
 * Visual match to Saloon-POS OrderList (#780829).
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ListOrdered, RefreshCw, Search, X } from 'lucide-react'
import { apiService } from '../../api/apiService'
import { printJobDraft } from '../../lib/printBillReceipt'
import type { BillItem } from '../../types/pos'
import { fmtMoney } from '../../utils/posSession'

const ACCENT = '#780829'
const ACCENT_SOFT = 'rgba(120, 8, 41, 0.07)'
const FILTER_BG = '#F7F5F6'
const ROW_ALT = '#FAFAFA'

export interface LoadedJobInvoice {
  jobId: number
  jobNo: string | null
  customerName: string
  items: BillItem[]
  startedAt: Date | null
}

interface JobListDialogProps {
  open: boolean
  onClose: () => void
  onInvoice: (job: LoadedJobInvoice) => void
}

function ymd(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Matches screenshot: 04/08/2026, 12:11 pm */
function formatJobDateTime(iso: unknown) {
  if (!iso) return '—'
  const dt = new Date(String(iso))
  if (Number.isNaN(dt.getTime())) return String(iso)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const yyyy = dt.getFullYear()
  let h = dt.getHours()
  const min = String(dt.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12
  if (h === 0) h = 12
  return `${dd}/${mm}/${yyyy}, ${h}:${min} ${ampm}`
}

function jobIdOf(job: Record<string, unknown>) {
  return String(
    job.JobID ?? job.jobId ?? job.kotMasterID ?? job.KotMasterID ?? '',
  ).trim()
}

function jobNoOf(job: Record<string, unknown>) {
  const direct = String(job.JobNo ?? job.jobNo ?? '').trim()
  if (direct) return direct
  const combined = `${job.KotPrefix ?? ''}${job.KotNumber ?? job.kotNumber ?? ''}`.trim()
  return combined || '—'
}

function amountOf(job: Record<string, unknown>) {
  const raw = job.Amount ?? job.amount ?? job.totalAmount ?? 0
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : 0
}

function displayOrEmpty(value: unknown) {
  const s = String(value ?? '').trim()
  return s || ''
}

/** Map GET /job/:id response → bill panel items */
export function mapJobDetailsToInvoice(
  details: Record<string, unknown>,
  listRow?: Record<string, unknown>,
): LoadedJobInvoice {
  const master = (details.job ?? {}) as Record<string, unknown>
  const lines = (details.data ?? []) as Record<string, unknown>[]
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error('This job has no items')
  }

  const jobId = Number(
    master.JobID ?? master.jobId ?? lines[0]?.JobID ?? lines[0]?.KotMasterID ?? 0,
  )
  if (!jobId) throw new Error('Invalid job id')

  const jobNo =
    String(master.JobNo ?? master.jobNo ?? lines[0]?.JobNo ?? lines[0]?.KotNumber ?? '').trim() ||
    null

  const customerName = String(
    listRow?.CustomerName ??
      listRow?.customerName ??
      master.CustomerName ??
      'Walk-in',
  )

  const startRaw =
    listRow?.StartTime ?? listRow?.KotTime ?? master.StartTime ?? master.startTime
  const startedAt = startRaw ? new Date(String(startRaw)) : null

  const items: BillItem[] = lines.map((line, idx) => {
    const productId = Number(line.ProductID ?? line.productID ?? line.productId ?? 0)
    const qty = Number(line.Qty ?? line.qty ?? 0) || 0
    const price = Number(line.UnitPrice ?? line.unitPrice ?? 0) || 0
    const lineId = Number(line.LineID ?? line.lineID ?? line.KotChildID ?? 0) || undefined
    const stylistId = Number(line.StylistID ?? line.stylistID ?? 0) || undefined
    const groupId = Number(line.GroupID ?? line.groupId ?? 0) || 0
    const taxRate = Number(line.Tax1RateC ?? line.tax1RateC ?? 5) || 5
    const lineType = String(line.LineType ?? line.lineType ?? 'PRODUCT')
    const name = String(line.ShortDescription ?? line.shortDescription ?? 'Item')

    return {
      id: `job-${jobId}-line-${lineId ?? idx}`,
      productId,
      name,
      qty,
      price,
      groupId,
      taxRate,
      lineId,
      stylistId,
      lineType,
    }
  })

  return {
    jobId,
    jobNo,
    customerName,
    items,
    startedAt:
      startedAt && !Number.isNaN(startedAt.getTime()) ? startedAt : null,
  }
}

function DateField({
  value,
  onChange,
  max,
  min,
}: {
  value: string
  onChange: (v: string) => void
  max?: string
  min?: string
}) {
  return (
    <label
      className="relative inline-flex items-center h-10 min-w-[138px] rounded-lg border border-[#D8D0D3] px-2.5 gap-1.5 cursor-pointer"
      style={{ background: FILTER_BG }}
    >
      <CalendarDays size={15} className="text-black/35 shrink-0" />
      <input
        type="date"
        className="bg-transparent text-[14px] font-medium text-black/80 outline-none w-[108px] cursor-pointer"
        value={value}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export default function JobListDialog({ open, onClose, onInvoice }: JobListDialogProps) {
  const [jobs, setJobs] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null)
  const [printingJobId, setPrintingJobId] = useState<string | null>(null)
  const [printError, setPrintError] = useState<string | null>(null)

  const loadJobs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const q = search.trim()
      const list = await apiService.fetchOrderList({
        search: q || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setJobs(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load jobs')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [search, dateFrom, dateTo])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => void loadJobs(), search || dateFrom || dateTo ? 400 : 0)
    return () => window.clearTimeout(t)
  }, [open, search, dateFrom, dateTo, loadJobs])

  const totalAmount = useMemo(
    () => jobs.reduce((sum, j) => sum + amountOf(j), 0),
    [jobs],
  )

  async function handleInvoice(job: Record<string, unknown>) {
    const id = jobIdOf(job)
    if (!id) {
      setError('Invalid job id')
      return
    }
    setLoadingInvoiceId(id)
    setError(null)
    try {
      const details = await apiService.fetchKotDetails(id)
      const loaded = mapJobDetailsToInvoice(details, job)
      onInvoice(loaded)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load job')
    } finally {
      setLoadingInvoiceId(null)
    }
  }

  async function handlePrintDraft(job: Record<string, unknown>) {
    const id = jobIdOf(job)
    if (!id) {
      setPrintError('Invalid job id')
      return
    }
    setPrintingJobId(id)
    setPrintError(null)
    try {
      await printJobDraft(id, job)
    } catch (e) {
      setPrintError(e instanceof Error ? e.message : 'Draft print failed')
    } finally {
      setPrintingJobId(null)
    }
  }

  function clearFilters() {
    setSearch('')
    setDateFrom('')
    setDateTo('')
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.42)' }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        className="bg-white flex flex-col overflow-hidden"
        style={{
          width: 'min(94vw, 1180px)',
          height: 'min(82vh, 700px)',
          borderRadius: 14,
          boxShadow: '0 18px 48px rgba(0,0,0,0.28)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 shrink-0"
          style={{ background: ACCENT, height: 52 }}
        >
          <ListOrdered className="text-white shrink-0" size={22} strokeWidth={2.25} />
          <h2
            className="flex-1 text-white font-bold tracking-wide"
            style={{ fontSize: 18 }}
          >
            Job List
          </h2>
          <button
            type="button"
            className="grid place-items-center size-9 rounded-lg text-white/95 hover:bg-white/10 disabled:opacity-40 transition-colors"
            disabled={loading}
            onClick={() => void loadJobs()}
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            className="grid place-items-center size-9 rounded-lg text-white/95 hover:bg-white/10 transition-colors"
            onClick={onClose}
            title="Close"
          >
            <X size={20} strokeWidth={2.25} />
          </button>
        </div>

        {/* Filters */}
        <div
          className="flex flex-wrap items-center gap-2.5 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid #E8E2E4' }}
        >
          <div className="relative flex-1 min-w-[220px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-black/35 pointer-events-none"
            />
            <input
              className="w-full h-10 pl-9 pr-3 rounded-lg text-[14px] font-medium outline-none transition-shadow"
              style={{
                background: FILTER_BG,
                border: '1px solid #D8D0D3',
              }}
              placeholder="Search job / customer / mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = ACCENT
                e.currentTarget.style.boxShadow = `0 0 0 1.5px ${ACCENT}33`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#D8D0D3'
                e.currentTarget.style.boxShadow = 'none'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void loadJobs()
              }}
            />
          </div>

          <DateField
            value={dateFrom}
            max={dateTo || ymd(new Date())}
            onChange={setDateFrom}
          />
          <DateField
            value={dateTo}
            min={dateFrom || undefined}
            max={ymd(new Date())}
            onChange={setDateTo}
          />

          <button
            type="button"
            className="h-10 px-3.5 rounded-lg text-[14px] font-bold text-black/65 hover:bg-black/[0.04] transition-colors"
            style={{ border: '1px solid #D8D0D3' }}
            onClick={clearFilters}
          >
            Clear
          </button>
          <button
            type="button"
            className="h-10 px-5 rounded-lg text-white text-[14px] font-bold disabled:opacity-50 shadow-sm hover:brightness-110 transition"
            style={{ background: ACCENT }}
            disabled={loading}
            onClick={() => void loadJobs()}
          >
            Search
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-auto px-4 pt-1 pb-0">
          {loading && (
            <div
              className="h-full flex items-center justify-center text-sm font-semibold"
              style={{ color: ACCENT }}
            >
              Loading jobs…
            </div>
          )}

          {!loading && error && (
            <div className="h-full flex flex-col items-center justify-center gap-3 px-6">
              <p className="text-sm text-red-600 text-center font-medium max-w-md">
                {error}
              </p>
              <button
                type="button"
                className="h-9 px-5 rounded-lg text-white text-sm font-bold"
                style={{ background: ACCENT }}
                onClick={() => void loadJobs()}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="h-full flex items-center justify-center text-[15px] text-black/45 font-medium">
              No jobs found for the selected filters
            </div>
          )}

          {!loading && !error && jobs.length > 0 && (
            <table className="w-full border-collapse" style={{ fontSize: 17 }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ background: ACCENT_SOFT }}>
                  {(
                    [
                      ['Job No', 'left', 'w-[96px]'],
                      ['Job Date', 'left', 'w-[150px]'],
                      ['Customer', 'left', ''],
                      ['Mobile', 'left', 'w-[110px]'],
                      ['Stylist', 'left', ''],
                      ['Amount', 'right', 'w-[90px]'],
                      ['Print', 'center', 'w-[80px]'],
                      ['Invoice', 'center', 'w-[96px]'],
                    ] as const
                  ).map(([label, align, width]) => (
                    <th
                      key={label}
                      className={`py-3 px-2.5 font-extrabold text-black/90 whitespace-nowrap ${width} ${
                        align === 'right'
                          ? 'text-right'
                          : align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }`}
                      style={{ borderBottom: '1px solid #E0D6DA', fontSize: 16 }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, index) => {
                  const id = jobIdOf(job)
                  const mobile = String(
                    job.MobileNo ?? job.mobileNo ?? job.telephone ?? '',
                  ).trim()
                  const stylist = displayOrEmpty(
                    job.PrimaryStylistName ??
                      job.primaryStylistName ??
                      job.staffName ??
                      '',
                  )
                  const customer = String(
                    job.CustomerName ?? job.customerName ?? 'Walk-in',
                  )
                  const dateText = formatJobDateTime(
                    job.StartTime ?? job.KotTime ?? job.JobDate ?? job.createdAt,
                  )
                  const busy = loadingInvoiceId === id
                  const printing = printingJobId === id
                  const rowBusy = !!loadingInvoiceId || !!printingJobId
                  const rowBg = index % 2 === 0 ? '#FFFFFF' : ROW_ALT

                  return (
                    <tr
                      key={id || index}
                      className="group transition-colors"
                      style={{ background: rowBg }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(120, 8, 41, 0.04)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = rowBg
                      }}
                    >
                      <td
                        className="py-3 px-2.5 font-extrabold text-black"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {jobNoOf(job)}
                      </td>
                      <td
                        className="py-3 px-2.5 whitespace-nowrap font-bold text-black/85"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {dateText}
                      </td>
                      <td
                        className="py-3 px-2.5 font-bold text-black/90"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {customer}
                      </td>
                      <td
                        className="py-3 px-2.5 font-bold text-black/85"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {mobile || '—'}
                      </td>
                      <td
                        className="py-3 px-2.5 font-bold text-black/90"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {stylist || '—'}
                      </td>
                      <td
                        className="py-3 px-2.5 text-right font-extrabold text-black tabular-nums"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        {fmtMoney(amountOf(job))}
                      </td>
                      <td
                        className="py-2 px-1.5 text-center"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        <button
                          type="button"
                          disabled={rowBusy}
                          title="Print draft copy for customer"
                          className="inline-flex items-center justify-center min-w-[72px] h-[40px] px-2.5 text-[14px] font-extrabold disabled:opacity-45 hover:bg-[#780829]/[0.06] transition"
                          style={{
                            color: ACCENT,
                            border: `1.5px solid ${ACCENT}`,
                            borderRadius: 8,
                            background: '#fff',
                          }}
                          onClick={() => void handlePrintDraft(job)}
                        >
                          {printing ? (
                            <span
                              className="inline-block size-[14px] rounded-full border-2 border-[#780829]/40 border-t-[#780829] animate-spin"
                              aria-label="Printing"
                            />
                          ) : (
                            'Print'
                          )}
                        </button>
                      </td>
                      <td
                        className="py-2 px-2 text-center"
                        style={{ borderBottom: '1px solid #F0EBED' }}
                      >
                        <button
                          type="button"
                          disabled={rowBusy}
                          className="inline-flex items-center justify-center min-w-[88px] h-[40px] px-3 text-white text-[14px] font-extrabold disabled:opacity-45 hover:brightness-110 transition"
                          style={{
                            background: ACCENT,
                            borderRadius: 8,
                          }}
                          onClick={() => void handleInvoice(job)}
                        >
                          {busy ? (
                            <span
                              className="inline-block size-[14px] rounded-full border-2 border-white/40 border-t-white animate-spin"
                              aria-label="Loading"
                            />
                          ) : (
                            'Invoice'
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center px-4 py-2.5 shrink-0 gap-3"
          style={{
            background: FILTER_BG,
            borderTop: '1px solid #E0D6DA',
          }}
        >
          <span className="text-[14px] font-semibold text-black/50">
            {jobs.length} job{jobs.length === 1 ? '' : 's'}
          </span>
          {printError && (
            <span className="text-[13px] font-semibold text-red-600 truncate flex-1">
              {printError}
            </span>
          )}
          <span className="ml-auto text-[14px] font-bold" style={{ color: ACCENT }}>
            Total Amount{' '}
            <span className="tabular-nums">{fmtMoney(totalAmount)}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
