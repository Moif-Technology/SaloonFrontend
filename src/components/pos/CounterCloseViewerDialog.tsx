/**
 * Counter Close Viewer — Reports list of saved Z-closes.
 * Date filter → list main fields → double-click opens detail → Print Copy** (Sunmi).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Archive,
  Calendar,
  Loader2,
  Printer,
  RefreshCw,
  X,
} from 'lucide-react'
import { apiService } from '../../api/apiService'
import {
  counterCloseInt,
  counterCloseNum,
  mapCounterCloseForUi,
} from '../../lib/counterCloseMapper'
import { printCounterReport } from '../../lib/printCounterReport'
import { useSnackbar } from '../../context/SnackbarContext'
import { fmtMoney, getPosSession } from '../../utils/posSession'
import { isPosAdmin } from '../../utils/posAdmin'
import Button from '../common/Button'

const ACCENT = '#780829'
const ACCENT_SOFT = 'rgba(120, 8, 41, 0.07)'
const FILTER_BG = '#F7F5F6'
const ROW_ALT = '#FAFAFA'
const BORDER = '#E0D6DA'

const GRID_COLS = '140px 1fr 56px 52px 80px 80px 80px 72px'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

function fmtDateTime(d: unknown) {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function closeIdOf(row: Record<string, unknown>) {
  return Number(row.closeId ?? row.close_id ?? row.id ?? 0) || 0
}

function DetailRow({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: 'green' | 'red' | 'brand'
}) {
  const valueColor =
    accent === 'green'
      ? '#15803d'
      : accent === 'red'
        ? '#dc2626'
        : accent === 'brand'
          ? ACCENT
          : '#1f1114'
  const labelColor =
    accent === 'green'
      ? '#15803d'
      : accent === 'red'
        ? '#dc2626'
        : accent
          ? ACCENT
          : '#6b5a5e'
  const rowBg =
    accent === 'green'
      ? 'rgba(34,197,94,0.06)'
      : accent === 'red'
        ? 'rgba(239,68,68,0.06)'
        : undefined

  return (
    <div
      className="flex items-center justify-between gap-3 border-b px-2.5 py-2 text-sm"
      style={{ borderColor: BORDER, background: rowBg }}
    >
      <span className="font-semibold" style={{ color: labelColor }}>
        {label}
      </span>
      <span className="font-bold tabular-nums" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  )
}

function CloseDetailPanel({
  closeId,
  onClose,
}: {
  closeId: number
  onClose: () => void
}) {
  const { showSnackbar } = useSnackbar()
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printing, setPrinting] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void apiService
      .fetchCounterCloseDetail(closeId)
      .then((data) => {
        if (!cancelled) setDetail(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [closeId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handlePrintCopy() {
    if (!detail || printing) return
    setPrinting(true)
    try {
      const session = getPosSession()
      const mapped = mapCounterCloseForUi(detail, {
        staffName: String(detail.staffName ?? session.staffName ?? ''),
        counterNo: (detail.counterNo as string | number | undefined) ?? session.counterNo,
      })
      const closeDate = detail.closeDate ? new Date(String(detail.closeDate)) : new Date()
      await printCounterReport(mapped, {
        counterNo: String(mapped.CounterNo ?? session.counterNo),
        reportType: String(mapped.reportType || 'Z'),
        closeNo: String(mapped.closeNo || ''),
        reportAt: Number.isNaN(closeDate.getTime()) ? new Date() : closeDate,
        isCopy: true,
      })
      showSnackbar('Copy** printing…', 'success')
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Print failed', 'error')
    } finally {
      setPrinting(false)
    }
  }

  const mapped = detail
    ? mapCounterCloseForUi(detail, {
        staffName: String(detail.staffName ?? ''),
        counterNo: detail.counterNo as string | number | undefined,
      })
    : null

  const cashInOut = Array.isArray(mapped?.cashInOutList)
    ? (mapped.cashInOutList as Record<string, unknown>[])
    : []
  const staffSales = Array.isArray(mapped?.staffSales)
    ? (mapped.staffSales as Record<string, unknown>[])
    : []

  const rows = mapped
    ? [
        { label: 'Close No', value: String(mapped.closeNo || `#${closeId}`) },
        { label: 'Close Date', value: fmtDateTime(detail?.closeDate) },
        { label: 'Report Type', value: String(mapped.reportType || 'Z') },
        { label: 'Counter', value: String(mapped.CounterNo || '—') },
        { label: 'Staff', value: String(mapped.cashierName || '—') },
        { label: 'Total Cash', value: fmtMoney(counterCloseNum(mapped.totalCash)) },
        { label: 'Total Credit', value: fmtMoney(counterCloseNum(mapped.totalCredit)) },
        { label: 'Total Card', value: fmtMoney(counterCloseNum(mapped.totalCard)) },
        {
          label: 'Credit Receipt (Cash)',
          value: fmtMoney(counterCloseNum(mapped.creditReceiptCash)),
          accent: 'green' as const,
        },
        {
          label: 'Credit Receipt (Card)',
          value: fmtMoney(counterCloseNum(mapped.creditReceiptCard)),
          accent: 'green' as const,
        },
        {
          label: 'Total Discount',
          value: fmtMoney(counterCloseNum(mapped.totalDiscount)),
        },
        {
          label: 'Refund',
          value: fmtMoney(counterCloseNum(mapped.totalRefund)),
          accent: 'red' as const,
        },
        { label: 'Tax', value: fmtMoney(counterCloseNum(mapped.totalTax)) },
        {
          label: 'Total Sales',
          value: fmtMoney(counterCloseNum(mapped.grossAmount)),
          accent: 'brand' as const,
        },
        {
          label: 'Cash In',
          value: fmtMoney(counterCloseNum(mapped.cashIn)),
          accent: 'green' as const,
        },
        {
          label: 'Cash Out',
          value: fmtMoney(counterCloseNum(mapped.cashOut)),
          accent: 'red' as const,
        },
        {
          label: 'Cash To Collect',
          value: fmtMoney(counterCloseNum(mapped.cashToBeCollected)),
          accent: 'brand' as const,
        },
        {
          label: 'Collected Cash',
          value: fmtMoney(counterCloseNum(mapped.collectedCash)),
        },
        {
          label: 'Cash Difference',
          value: fmtMoney(counterCloseNum(mapped.cashDifference)),
          accent:
            counterCloseNum(mapped.cashDifference) >= 0
              ? ('green' as const)
              : ('red' as const),
        },
        { label: 'Bill Count', value: String(counterCloseInt(mapped.BillCount)) },
        {
          label: 'Bill Range',
          value:
            mapped.startBillNo != null
              ? `${mapped.startBillNo} – ${mapped.endBillNo}`
              : '—',
        },
        {
          label: 'Total Tip',
          value: fmtMoney(counterCloseNum(mapped.totalTip ?? mapped.TipAmount)),
        },
      ]
    : []

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
        style={{ borderColor: BORDER }}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #521C1D 100%)` }}
        >
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Counter close details
            </p>
            <p className="truncate text-base font-extrabold">
              {mapped?.closeNo ? String(mapped.closeNo) : `Close #${closeId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading && (
            <div className="flex justify-center py-12 text-salon-muted">
              <Loader2 className="animate-spin" size={22} />
            </div>
          )}
          {!loading && error && (
            <p className="p-3 text-sm font-semibold text-red-600">{error}</p>
          )}
          {!loading && mapped && (
            <>
              {rows.map((r) => (
                <DetailRow key={r.label} label={r.label} value={r.value} accent={r.accent} />
              ))}

              {staffSales.length > 0 && (
                <div
                  className="mt-3 overflow-hidden rounded-xl border"
                  style={{ borderColor: BORDER }}
                >
                  <div
                    className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-salon-muted"
                    style={{ background: FILTER_BG }}
                  >
                    Staff wise ({staffSales.length})
                  </div>
                  {staffSales.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 border-t px-2.5 py-2 text-xs"
                      style={{ borderColor: BORDER }}
                    >
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {String(r.staffName ?? 'Unknown')}
                      </span>
                      <span className="tabular-nums text-salon-muted">
                        {counterCloseInt(r.billCount)} bills
                      </span>
                      <span className="font-bold tabular-nums">
                        {fmtMoney(counterCloseNum(r.saleAmount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {cashInOut.length > 0 && (
                <div
                  className="mt-3 overflow-hidden rounded-xl border"
                  style={{ borderColor: BORDER }}
                >
                  <div
                    className="px-2.5 py-2 text-[10px] font-bold uppercase tracking-wide text-salon-muted"
                    style={{ background: FILTER_BG }}
                  >
                    Cash In / Out ({cashInOut.length})
                  </div>
                  {cashInOut.map((row, i) => {
                    const isIn = String(row.transactionType).toUpperCase().includes('IN')
                    return (
                      <div
                        key={String(row.id ?? i)}
                        className="flex items-center justify-between gap-2 border-t px-2.5 py-2 text-xs"
                        style={{ borderColor: BORDER }}
                      >
                        <div className="min-w-0 flex-1">
                          <span
                            className="text-[10px] font-extrabold uppercase"
                            style={{ color: isIn ? '#15803d' : '#dc2626' }}
                          >
                            {isIn ? 'IN' : 'OUT'}
                          </span>
                          <span className="ml-2 text-salon-muted">
                            {String(row.remarks || '—')}
                          </span>
                        </div>
                        <span
                          className="font-bold tabular-nums"
                          style={{ color: isIn ? '#15803d' : '#dc2626' }}
                        >
                          {fmtMoney(counterCloseNum(row.amount))}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <footer
          className="flex shrink-0 gap-2 border-t px-3 py-3"
          style={{ borderColor: BORDER, background: FILTER_BG }}
        >
          <Button
            type="button"
            variant="secondary"
            size="compact"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            disabled={!mapped || printing}
            icon={
              printing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Printer size={16} />
              )
            }
            onClick={() => void handlePrintCopy()}
            className="flex-[1.4]"
          >
            {printing ? 'Printing…' : 'Print Copy**'}
          </Button>
        </footer>
      </div>
    </div>
  )
}

interface CounterCloseViewerDialogProps {
  open: boolean
  onClose: () => void
}

export default function CounterCloseViewerDialog({
  open,
  onClose,
}: CounterCloseViewerDialogProps) {
  const [dateFrom, setDateFrom] = useState(daysAgoISO(30))
  const [dateTo, setDateTo] = useState(todayISO())
  const [closes, setCloses] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<number | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const loadCloses = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const session = getPosSession()
      const list = await apiService.fetchCounterHistory({
        counterNo: session.counterNo,
        dateFrom,
        dateTo,
        limit: 150,
        allStaff: isPosAdmin(),
      })
      setCloses(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history')
      setCloses([])
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    if (!open) return
    setDetailId(null)
    void loadCloses()
  }, [open, loadCloses])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (detailId) return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, detailId])

  if (!open) return null

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
        onClick={(e) => {
          if (e.target === overlayRef.current && !detailId) onClose()
        }}
      >
        <div
          className="flex h-[min(720px,94dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl"
          style={{ borderColor: BORDER }}
        >
          <header
            className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #521C1D 100%)`,
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                <Archive size={18} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65">
                  Reports
                </p>
                <p className="text-base font-extrabold">Counter Close Viewer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </header>

          <div
            className="shrink-0 border-b px-4 py-3"
            style={{ borderColor: BORDER, background: FILTER_BG }}
          >
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <label className="block text-[10px] font-bold uppercase tracking-wide text-salon-muted">
                <span className="mb-1 flex items-center gap-1">
                  <Calendar size={11} /> From
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-salon-primary"
                  style={{ borderColor: BORDER }}
                />
              </label>
              <label className="block text-[10px] font-bold uppercase tracking-wide text-salon-muted">
                <span className="mb-1 flex items-center gap-1">
                  <Calendar size={11} /> To
                </span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border bg-white px-2 text-sm outline-none focus:border-salon-primary"
                  style={{ borderColor: BORDER }}
                />
              </label>
              <button
                type="button"
                onClick={() => void loadCloses()}
                disabled={loading}
                className="flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-bold disabled:opacity-50"
                style={{
                  borderColor: 'rgba(120, 8, 41, 0.35)',
                  background: ACCENT_SOFT,
                  color: ACCENT,
                }}
              >
                {loading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <RefreshCw size={14} />
                )}
                Load
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-3">
            <div
              className="grid rounded-t-xl border border-b-0 px-2.5 py-2"
              style={{
                gridTemplateColumns: GRID_COLS,
                borderColor: BORDER,
                background: FILTER_BG,
              }}
            >
              {[
                'Close Date',
                'Close No',
                'Type',
                'Bills',
                'Gross',
                'To Collect',
                'Collected',
                'Diff',
              ].map((h) => (
                <span
                  key={h}
                  className="text-[9px] font-bold uppercase tracking-wide text-salon-muted"
                >
                  {h}
                </span>
              ))}
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto rounded-b-xl border"
              style={{ borderColor: BORDER }}
            >
              {loading && (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-salon-muted">
                  <Loader2 size={18} className="animate-spin" /> Loading…
                </div>
              )}
              {!loading && error && (
                <p className="p-4 text-sm font-semibold text-red-600">{error}</p>
              )}
              {!loading && !error && closes.length === 0 && (
                <p className="py-12 text-center text-sm text-salon-muted">
                  No counter closes found for selected dates
                </p>
              )}
              {!loading &&
                !error &&
                closes.map((c, i) => {
                  const id = closeIdOf(c)
                  const diff = counterCloseNum(c.cashDifference)
                  return (
                    <button
                      key={id || i}
                      type="button"
                      onDoubleClick={() => {
                        if (id) setDetailId(id)
                      }}
                      className="grid w-full border-b px-2.5 py-2.5 text-left text-xs transition-colors hover:bg-[rgba(120,8,41,0.07)]"
                      style={{
                        gridTemplateColumns: GRID_COLS,
                        borderColor: BORDER,
                        background: i % 2 === 0 ? '#fff' : ROW_ALT,
                      }}
                      title="Double-click for details"
                    >
                      <span>{fmtDateTime(c.closeDate)}</span>
                      <span className="font-bold">
                        {String(c.closeNo ?? `#${id}`)}
                      </span>
                      <span>{String(c.reportType ?? 'Z')}</span>
                      <span className="text-right tabular-nums">
                        {counterCloseInt(c.billCount)}
                      </span>
                      <span className="text-right font-bold tabular-nums">
                        {fmtMoney(counterCloseNum(c.grossAmount))}
                      </span>
                      <span className="text-right tabular-nums">
                        {fmtMoney(counterCloseNum(c.cashToBeCollected))}
                      </span>
                      <span className="text-right tabular-nums">
                        {fmtMoney(counterCloseNum(c.collectedCash))}
                      </span>
                      <span
                        className="text-right font-bold tabular-nums"
                        style={{ color: diff >= 0 ? '#15803d' : '#dc2626' }}
                      >
                        {fmtMoney(diff)}
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>

          <footer
            className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2.5"
            style={{ borderColor: BORDER, background: FILTER_BG }}
          >
            <span className="text-xs font-semibold text-salon-muted">
              {closes.length} close{closes.length !== 1 ? 's' : ''} found
            </span>
            <span className="hidden text-[10px] text-salon-muted sm:inline">
              Double-click a row for details &amp; Print Copy**
            </span>
            <Button type="button" variant="secondary" size="compact" onClick={onClose}>
              Close
            </Button>
          </footer>
        </div>
      </div>

      {detailId != null && (
        <CloseDetailPanel closeId={detailId} onClose={() => setDetailId(null)} />
      )}
    </>
  )
}
