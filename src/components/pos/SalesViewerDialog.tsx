/**
 * Sales Viewer — Reports list + bill-with-details (Counter-pos parity).
 * Double-click a list row to open bill details.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  X,
  Receipt,
  Calendar,
  Search,
  RefreshCw,
  Loader2,
  Printer,
  ChevronDown,
  User,
} from 'lucide-react'
import { apiService } from '../../api/apiService'
import { fmtMoney, getPosSession } from '../../utils/posSession'
import { printBillReceipt, mapSalonViewerBill } from '../../lib/printBillReceipt'
import { salesViewerSummaryRows } from '../../lib/salesViewerSummary'
import {
  isSplitBill,
  paymentModeLabel,
  splitPayModeLabel,
} from '../../utils/paymentModes'
import { useSnackbar } from '../../context/SnackbarContext'

const ACCENT = '#780829'
const ACCENT_SOFT = 'rgba(120, 8, 41, 0.07)'
const FILTER_BG = '#F7F5F6'
const ROW_ALT = '#FAFAFA'
const BORDER = '#E0D6DA'
const GRID_COLS = '100px 80px 85px 95px 1fr 90px 80px'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(d: unknown) {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function fmtTime(d: unknown) {
  if (!d) return '—'
  const dt = new Date(String(d))
  if (Number.isNaN(dt.getTime())) return String(d)
  return dt.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
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

function fmtQty(q: unknown) {
  const n = Number(q)
  if (!Number.isFinite(n)) return '0'
  return Number.isInteger(n) ? String(n) : n.toFixed(2)
}

function salesIdOf(row: Record<string, unknown>) {
  return String(row.salesId ?? row.SalesID ?? row.sales_id ?? '').trim()
}

function billNoOf(row: Record<string, unknown>) {
  return String(
    row.billNoDisplay ?? row.BillNoDisplay ?? row.billNo ?? row.BillNo ?? '—',
  )
}

function amountOf(row: Record<string, unknown>) {
  const n = Number(row.amount ?? row.Amount ?? 0)
  return Number.isFinite(n) ? n : 0
}

function rowPaymentMode(row: Record<string, unknown>) {
  return paymentModeLabel(row.PaymentMode ?? row.paymentMode ?? row.Payment_Mode)
}

interface SalesViewerDialogProps {
  open: boolean
  onClose: () => void
}

function SearchableCustomerFilter({
  customerId,
  onSelect,
}: {
  customerId: string
  onSelect: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, unknown>[]>([])
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const debRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const list = await apiService.fetchCustomers({ search: q, limit: 200 })
      setResults(list)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void doSearch('')
  }, [doSearch])

  useEffect(() => {
    if (!customerId) {
      setSelected(null)
      return
    }
    if (String(selected?.CustomerID) === String(customerId)) return
    void apiService
      .fetchCustomers({ limit: 200 })
      .then((list) => {
        const c = list.find((x) => String(x.CustomerID) === String(customerId))
        if (c) setSelected(c)
      })
      .catch(() => {})
  }, [customerId, selected?.CustomerID])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function scheduleSearch(q: string) {
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => void doSearch(q), 280)
  }

  function pick(c: Record<string, unknown> | null) {
    setSelected(c)
    onSelect(c ? String(c.CustomerID ?? '') : '')
    setQuery('')
    setOpen(false)
  }

  const displayLabel = selected
    ? `${selected.CustomerCode || ''} — ${selected.CustomerName || ''}`.replace(/^ — /, '')
    : 'All customers'

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-black/45">
        <User size={12} /> Customer
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-[13px] font-bold"
        style={{
          borderColor: open ? ACCENT : '#D8D0D3',
          background: open ? ACCENT_SOFT : '#fff',
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown size={14} className="shrink-0 text-black/40" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-xl border bg-white shadow-lg"
          style={{ borderColor: BORDER }}
        >
          <div className="flex items-center gap-2 border-b px-2.5 py-2" style={{ borderColor: BORDER }}>
            <Search size={14} className="text-black/35" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                scheduleSearch(e.target.value)
              }}
              placeholder="Search code or name…"
              className="flex-1 bg-transparent text-[13px] font-semibold outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => pick(null)}
            className="w-full border-b px-3 py-2.5 text-left text-[13px] font-bold"
            style={{
              borderColor: BORDER,
              color: !customerId ? ACCENT : '#333',
              background: !customerId ? ACCENT_SOFT : '#fff',
            }}
          >
            All customers
          </button>
          <div className="max-h-[200px] overflow-y-auto">
            {loading && (
              <div className="flex justify-center p-3 text-black/40">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}
            {!loading && results.length === 0 && (
              <div className="p-3 text-center text-[12px] font-semibold text-black/40">
                No customers found
              </div>
            )}
            {!loading &&
              results.map((c) => {
                const id = String(c.CustomerID ?? '')
                const active = id === String(customerId)
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full border-b px-3 py-2 text-left"
                    style={{
                      borderColor: BORDER,
                      background: active ? ACCENT_SOFT : '#fff',
                      color: active ? ACCENT : '#1a1a1a',
                    }}
                  >
                    <div className="text-[13px] font-bold">{String(c.CustomerName ?? '')}</div>
                    <div className="text-[11px] font-semibold text-black/45">
                      {String(c.CustomerCode ?? '')}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

function BillDetailModal({
  salesId,
  onClose,
}: {
  salesId: string
  onClose: () => void
}) {
  const { showSnackbar } = useSnackbar()
  const [bill, setBill] = useState<ReturnType<typeof mapSalonViewerBill> | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void apiService
      .fetchSalesViewerBill(salesId)
      .then((raw) => {
        if (!cancelled) setBill(mapSalonViewerBill(raw))
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load bill')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [salesId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handlePrint() {
    if (printing || loading) return
    setPrinting(true)
    try {
      const session = getPosSession()
      await printBillReceipt(salesId, {
        companyName: 'MOIF TECHNOLOGY',
        counterNo: session.counterNo,
      })
      showSnackbar('Printing invoice…', 'success')
    } catch (e) {
      showSnackbar(e instanceof Error ? e.message : 'Print failed', 'error')
    } finally {
      setPrinting(false)
    }
  }

  const gridCols = 'minmax(70px,1fr) minmax(120px,2fr) 60px 70px 60px 70px 80px'
  const items = (bill?.items ?? []).map((it) => ({
    ...it,
    discount: Number(it.discount) || 0,
    subTotal: Number(it.lineTotal || 0) - Number(it.vatAmt || 0),
  }))

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[6px]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className="flex max-h-[90vh] w-[720px] max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-4 py-3.5 text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5a0620 100%)` }}
        >
          <div>
            <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-white/60">
              Bill with details
            </p>
            <p className="m-0 mt-0.5 text-[17px] font-extrabold">
              {bill?.billNo != null ? `Bill #${bill.billNo}` : `Bill #${salesId}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg border border-white/25 bg-white/15 text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex justify-center py-10 text-black/40">
              <Loader2 size={22} className="animate-spin" />
            </div>
          )}
          {!loading && error && (
            <div className="p-4 text-[14px] font-bold text-red-600">{error}</div>
          )}
          {!loading && bill && (
            <>
              <div className="mb-3.5 grid grid-cols-3 gap-2.5">
                {(
                  [
                    ['Date', fmtDateTime(bill.billDate || bill.billTime)],
                    [
                      'Payment',
                      paymentModeLabel(bill.paymentMode, bill.paymentSplits),
                    ],
                    ['Customer', bill.customer?.customerName ?? 'Walk-in'],
                    ['Staff', bill.staffName || '—'],
                    ['Counter', String(bill.counterNo ?? '—')],
                    ['Close No', '—'],
                    ...(bill.remarks?.trim()
                      ? ([['Comments', bill.remarks.trim()]] as const)
                      : []),
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg border px-2.5 py-2"
                    style={{
                      borderColor: BORDER,
                      background: FILTER_BG,
                      gridColumn: k === 'Comments' ? '1 / -1' : undefined,
                    }}
                  >
                    <div className="text-[10px] font-bold uppercase text-black/40">{k}</div>
                    <div
                      className={`mt-0.5 text-[13px] font-bold text-black/90 ${
                        k === 'Comments' ? 'whitespace-pre-wrap' : ''
                      }`}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mb-3.5 overflow-hidden rounded-xl border"
                style={{ borderColor: BORDER }}
              >
                <div
                  className="grid gap-1 border-b px-2.5 py-2"
                  style={{
                    gridTemplateColumns: gridCols,
                    background: FILTER_BG,
                    borderColor: BORDER,
                  }}
                >
                  {['Code', 'Description', 'Qty', 'Price', 'VAT', 'Disc', 'Total'].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-extrabold uppercase tracking-wide text-black/55"
                    >
                      {h}
                    </span>
                  ))}
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {(bill.items ?? []).map((it, i) => (
                    <div
                      key={i}
                      className="grid gap-1 border-b px-2.5 py-2 text-[13px] font-semibold"
                      style={{
                        gridTemplateColumns: gridCols,
                        borderColor: BORDER,
                        background: i % 2 === 0 ? '#fff' : FILTER_BG,
                      }}
                    >
                      <span className="font-bold">{it.productCode || '—'}</span>
                      <span className="truncate">{it.description}</span>
                      <span className="text-right tabular-nums">{fmtQty(it.qty)}</span>
                      <span className="text-right tabular-nums">{fmtMoney(Number(it.unitPrice) || 0)}</span>
                      <span className="text-right tabular-nums">{fmtMoney(Number(it.vatAmt) || 0)}</span>
                      <span className="text-right tabular-nums">
                        {fmtMoney(Number(it.discount) || 0)}
                      </span>
                      <span className="text-right font-extrabold tabular-nums">
                        {fmtMoney(Number(it.lineTotal) || 0)}
                      </span>
                    </div>
                  ))}
                  {(bill.items ?? []).length === 0 && (
                    <div className="p-5 text-center text-[13px] font-semibold text-black/40">
                      No line items
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <div className="min-w-[220px]">
                  {salesViewerSummaryRows({
                    items,
                    discountAmt: bill.discountAmt,
                    taxableAmt: bill.taxableAmt,
                    taxAmt: bill.taxAmt,
                    roundOff: bill.roundOff,
                  }).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between py-1 text-[13px] font-semibold"
                    >
                      <span className="text-black/50">{k}</span>
                      <span className="font-bold tabular-nums">{fmtMoney(v)}</span>
                    </div>
                  ))}
                  <div
                    className="mt-1.5 flex justify-between border-t-2 pt-2 text-[15px] font-extrabold"
                    style={{ borderColor: BORDER }}
                  >
                    <span>Total</span>
                    <span style={{ color: ACCENT }} className="tabular-nums">
                      {fmtMoney(Number(bill.amount) || 0)}
                    </span>
                  </div>

                  {isSplitBill(bill.paymentMode, bill.paymentSplits) && (
                    <div className="mt-3 border-t pt-2.5" style={{ borderColor: BORDER }}>
                      <div
                        className="mb-2 text-[10px] font-extrabold uppercase tracking-wide"
                        style={{ color: ACCENT }}
                      >
                        Split Payment (M-Pay)
                      </div>
                      {(bill.paymentSplits ?? []).filter((s) => Number(s.amount) > 0).length >
                      0 ? (
                        <div
                          className="overflow-hidden rounded-lg border"
                          style={{ borderColor: BORDER }}
                        >
                          <div
                            className="grid gap-2 border-b px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-black/45"
                            style={{
                              gridTemplateColumns: '1fr 90px 70px',
                              borderColor: BORDER,
                              background: FILTER_BG,
                            }}
                          >
                            <span>Mode</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">Tip</span>
                          </div>
                          {(bill.paymentSplits ?? [])
                            .filter((s) => Number(s.amount) > 0 || Number(s.tip) > 0)
                            .map((s, idx) => (
                              <div
                                key={idx}
                                className="grid gap-2 border-b px-2.5 py-2 text-[13px] font-bold"
                                style={{
                                  gridTemplateColumns: '1fr 90px 70px',
                                  borderColor: BORDER,
                                }}
                              >
                                <span>{splitPayModeLabel(s.payMode)}</span>
                                <span className="text-right tabular-nums">
                                  {fmtMoney(Number(s.amount) || 0)}
                                </span>
                                <span className="text-right tabular-nums text-black/55">
                                  {fmtMoney(Number(s.tip) || 0)}
                                </span>
                              </div>
                            ))}
                          <div
                            className="flex justify-between px-2.5 py-2 text-[13px] font-extrabold"
                            style={{ background: ACCENT_SOFT, color: ACCENT }}
                          >
                            <span>Split total</span>
                            <span className="tabular-nums">
                              {fmtMoney(
                                (bill.paymentSplits ?? []).reduce(
                                  (a, s) => a + (Number(s.amount) || 0),
                                  0,
                                ),
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-lg border px-3 py-2.5 text-[12px] font-semibold text-black/40"
                          style={{ borderColor: BORDER, background: FILTER_BG }}
                        >
                          No split rows recorded for this bill.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className="flex justify-end gap-2 border-t px-4 py-2.5"
          style={{ borderColor: BORDER, background: FILTER_BG }}
        >
          <button
            type="button"
            disabled={loading || printing || !!error}
            onClick={() => void handlePrint()}
            className="flex h-9 items-center gap-1.5 rounded-lg px-4 text-[13px] font-bold text-white disabled:opacity-45"
            style={{ background: ACCENT }}
          >
            <Printer size={14} /> {printing ? 'Printing…' : 'Print Invoice'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-lg border px-4 text-[13px] font-bold text-red-700"
            style={{ borderColor: '#f5c2c7', background: '#fff5f5' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SalesViewerDialog({ open, onClose }: SalesViewerDialogProps) {
  const [dateFrom, setDateFrom] = useState(todayISO())
  const [dateTo, setDateTo] = useState(todayISO())
  const [customerId, setCustomerId] = useState('')
  const [bills, setBills] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const loadBills = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await apiService.fetchSalesViewer({
        dateFrom,
        dateTo,
        customerId: customerId || undefined,
        counterNo: getPosSession().counterNo || undefined,
      })
      setBills(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sales')
      setBills([])
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, customerId])

  useEffect(() => {
    if (!open) return
    void loadBills()
  }, [open, loadBills])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (detailId) return
      if (document.activeElement?.tagName === 'INPUT') return
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, detailId])

  const totalAmount = useMemo(
    () => bills.reduce((s, b) => s + amountOf(b), 0),
    [bills],
  )

  if (!open) return null

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-3 backdrop-blur-[6px]"
        onClick={(e) => {
          if (e.target === overlayRef.current) onClose()
        }}
      >
        <div
          className="flex max-h-[90vh] w-[860px] max-w-[96vw] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="flex shrink-0 items-center justify-between px-4 py-3.5 text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5a0620 100%)` }}
          >
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-xl border border-white/25 bg-white/15">
                <Receipt size={18} />
              </div>
              <div>
                <p className="m-0 text-[11px] font-bold uppercase tracking-wide text-white/55">
                  Reports
                </p>
                <p className="m-0 text-[16px] font-extrabold">Sales Viewer</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg border border-white/20 bg-white/15 text-white"
            >
              <X size={16} />
            </button>
          </div>

          <div className="shrink-0 border-b px-4 py-3.5" style={{ borderColor: BORDER }}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.3fr_1fr_1fr_auto] sm:items-end">
              <SearchableCustomerFilter customerId={customerId} onSelect={setCustomerId} />
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-black/45">
                  <Calendar size={12} /> From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-full rounded-lg border px-2 text-[13px] font-bold"
                  style={{ borderColor: '#D8D0D3' }}
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase text-black/45">
                  <Calendar size={12} /> To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-full rounded-lg border px-2 text-[13px] font-bold"
                  style={{ borderColor: '#D8D0D3' }}
                />
              </div>
              <button
                type="button"
                onClick={() => void loadBills()}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3.5 text-[13px] font-extrabold"
                style={{ borderColor: `${ACCENT}55`, background: ACCENT_SOFT, color: ACCENT }}
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Load
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-3 pt-3">
            <div
              className="grid rounded-t-xl border border-b-0 px-2.5 py-2.5"
              style={{
                gridTemplateColumns: GRID_COLS,
                background: FILTER_BG,
                borderColor: BORDER,
              }}
            >
              {['Bill Date', 'Bill No', 'Bill Time', 'Payment', 'Customer', 'Amount', 'Close No'].map(
                (h) => (
                  <span
                    key={h}
                    className="text-[12px] font-extrabold uppercase tracking-wide text-black/60"
                  >
                    {h}
                  </span>
                ),
              )}
            </div>

            <div
              className="min-h-[280px] flex-1 overflow-y-auto rounded-b-xl border"
              style={{ borderColor: BORDER }}
            >
              {loading && (
                <div className="flex items-center justify-center gap-2 p-8 text-[14px] font-bold text-black/40">
                  <Loader2 size={18} className="animate-spin" /> Loading…
                </div>
              )}
              {!loading && error && (
                <div className="p-4 text-[14px] font-bold text-red-600">{error}</div>
              )}
              {!loading && !error && bills.length === 0 && (
                <div className="p-8 text-center text-[14px] font-bold text-black/40">
                  No bills found for selected filters
                </div>
              )}
              {!loading &&
                !error &&
                bills.map((b, i) => {
                  const id = salesIdOf(b)
                  const rowBg = i % 2 === 0 ? '#fff' : ROW_ALT
                  return (
                    <button
                      key={id || i}
                      type="button"
                      title="Double-click to open bill details"
                      onDoubleClick={() => {
                        if (id) setDetailId(id)
                      }}
                      className="grid w-full border-0 border-b px-2.5 py-2.5 text-left text-[14px] font-bold transition-colors"
                      style={{
                        gridTemplateColumns: GRID_COLS,
                        borderColor: BORDER,
                        background: rowBg,
                        color: '#1a1a1a',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = ACCENT_SOFT
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = rowBg
                      }}
                    >
                      <span>{fmtDate(b.billDate ?? b.BillDate)}</span>
                      <span className="font-extrabold">{billNoOf(b)}</span>
                      <span>{fmtTime(b.billTime ?? b.BillTime ?? b.billDate ?? b.BillDate)}</span>
                      <span>
                        {rowPaymentMode(b)}
                      </span>
                      <span className="truncate">
                        {String(b.customerName ?? b.CustomerName ?? 'Walk-in')}
                      </span>
                      <span className="text-right font-extrabold tabular-nums">
                        {fmtMoney(amountOf(b))}
                      </span>
                      <span className="text-[12px] font-semibold text-black/45">
                        {String(b.counterCloseNo ?? b.CounterCloseNo ?? '—')}
                      </span>
                    </button>
                  )
                })}
            </div>
          </div>

          <div
            className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-2.5"
            style={{ borderColor: BORDER, background: FILTER_BG }}
          >
            <span className="text-[13px] font-bold text-black/50">
              {bills.length} bill{bills.length !== 1 ? 's' : ''} · Total {fmtMoney(totalAmount)}
            </span>
            <span className="hidden text-[12px] font-semibold text-black/40 sm:inline">
              Double-click a row to open bill details
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center gap-1.5 rounded-lg border px-4 text-[13px] font-bold text-red-700"
              style={{ borderColor: '#f5c2c7', background: '#fff5f5' }}
            >
              <X size={14} /> Close
            </button>
          </div>
        </div>
      </div>

      {detailId != null && (
        <BillDetailModal salesId={detailId} onClose={() => setDetailId(null)} />
      )}
    </>
  )
}
