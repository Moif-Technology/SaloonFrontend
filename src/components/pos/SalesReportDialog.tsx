/**
 * Salesman / Item / Group wise reports.
 * Filters apply only on Display click. Defaults to today's date range and auto-loads once on open.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X, Search, Loader2, Users, Package, Layers } from 'lucide-react'
import { apiService } from '../../api/apiService'
import { fmtMoney } from '../../utils/posSession'
import { getDeviceToken } from '../../utils/deviceEnrollment'
import { fetchGroups } from '../../api/groups'

const ACCENT = '#780829'
const FILTER_BG = '#F7F5F6'
const BORDER = '#E0D6DA'
const ROW_ALT = '#FAFAFA'

export type SalesReportKind = 'salesman' | 'item' | 'group'

interface SalesReportDialogProps {
  open: boolean
  kind: SalesReportKind
  onClose: () => void
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function num(v: unknown) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

type EntityOpt = { id: string; label: string }

export default function SalesReportDialog({ open, kind, onClose }: SalesReportDialogProps) {
  const backdropDownRef = useRef(false)
  const [dateFrom, setDateFrom] = useState(todayISO)
  const [dateTo, setDateTo] = useState(todayISO)
  const [entityId, setEntityId] = useState('all')
  const [entityOptions, setEntityOptions] = useState<EntityOpt[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingFilters, setLoadingFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = useMemo(() => {
    if (kind === 'salesman') {
      return {
        title: 'Salesman Wise Report',
        icon: Users,
        entityLabel: 'Salesman',
        apiKind: 'salesman-wise' as const,
      }
    }
    if (kind === 'item') {
      return {
        title: 'Item Wise Report',
        icon: Package,
        entityLabel: 'Item',
        apiKind: 'item-wise' as const,
      }
    }
    return {
      title: 'Group Wise Report',
      icon: Layers,
      entityLabel: 'Group',
      apiKind: 'group-wise' as const,
    }
  }, [kind])

  const Icon = meta.icon

  const loadEntityOptions = useCallback(async () => {
    setLoadingFilters(true)
    try {
      if (kind === 'salesman') {
        const token = getDeviceToken()
        let list: Record<string, unknown>[] = []
        if (token) {
          list = await apiService.fetchPosStaffList(token)
        }
        if (list.length === 0) {
          try {
            list = await apiService.fetchStaff()
          } catch {
            list = []
          }
        }
        setEntityOptions(
          list
            .map((s) => {
              const id = String(s.staffId ?? s.StaffID ?? s.staff_id ?? s.id ?? '').trim()
              const label = String(
                s.staffName ?? s.StaffName ?? s.staff_name ?? s.name ?? id,
              ).trim()
              return id ? { id, label: label || id } : null
            })
            .filter((x): x is EntityOpt => Boolean(x))
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
      } else if (kind === 'item') {
        const list = await apiService.fetchProducts({ limit: 2000 })
        setEntityOptions(
          list
            .map((p) => {
              const id = String(p.ProductID ?? p.productId ?? p.id ?? '').trim()
              const name = String(
                p.ShortDescription ?? p.ProductName ?? p.productName ?? p.name ?? '',
              ).trim()
              const code = String(p.ProductCode ?? p.productCode ?? p.code ?? '').trim()
              const label = [code, name].filter(Boolean).join(' — ') || id
              return id && id !== '0' ? { id, label } : null
            })
            .filter((x): x is EntityOpt => Boolean(x))
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
      } else {
        const list = await fetchGroups()
        setEntityOptions(
          list
            .map((g) => {
              const id = String(g.id ?? '').trim()
              const label = String(g.name ?? id).trim()
              return id ? { id, label: label || id } : null
            })
            .filter((x): x is EntityOpt => Boolean(x))
            .sort((a, b) => a.label.localeCompare(b.label)),
        )
      }
    } catch {
      setEntityOptions([])
    } finally {
      setLoadingFilters(false)
    }
  }, [kind])

  const display = useCallback(
    async (override?: { dateFrom?: string; dateTo?: string; entityId?: string }) => {
      const from = override?.dateFrom ?? dateFrom
      const to = override?.dateTo ?? dateTo
      const ent = override?.entityId ?? entityId
      setLoading(true)
      setError(null)
      try {
        const data = await apiService.fetchSalesReport(meta.apiKind, {
          dateFrom: from,
          dateTo: to,
          staffId: kind === 'salesman' ? ent : undefined,
          productId: kind === 'item' ? ent : undefined,
          groupId: kind === 'group' ? ent : undefined,
        })
        setRows(data)
      } catch (e) {
        setRows([])
        setError(e instanceof Error ? e.message : 'Failed to load report')
      } finally {
        setLoading(false)
      }
    },
    [meta.apiKind, dateFrom, dateTo, entityId, kind],
  )

  // Reset + load today's data once when opened
  useEffect(() => {
    if (!open) return
    const today = todayISO()
    setDateFrom(today)
    setDateTo(today)
    setEntityId('all')
    setRows([])
    setError(null)
    void loadEntityOptions()
    void display({ dateFrom: today, dateTo: today, entityId: 'all' })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on open/kind
  }, [open, kind])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.bills += num(r.billCount)
        acc.qty += num(r.qty)
        acc.subtotal += num(r.subtotal)
        acc.discount += num(r.discount)
        acc.tax += num(r.tax)
        acc.roundOff += num(r.roundOff)
        acc.net += num(r.net)
        acc.cash += num(r.cash)
        acc.card += num(r.card)
        acc.credit += num(r.credit)
        return acc
      },
      {
        bills: 0,
        qty: 0,
        subtotal: 0,
        discount: 0,
        tax: 0,
        roundOff: 0,
        net: 0,
        cash: 0,
        card: 0,
        credit: 0,
      },
    )
  }, [rows])

  if (!open) return null

  const inputClass =
    'h-10 rounded-xl border border-salon-border bg-white px-3 text-sm outline-none focus:border-salon-primary'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        backdropDownRef.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget || !backdropDownRef.current) return
        backdropDownRef.current = false
        if (window.getSelection()?.toString()) return
        onClose()
      }}
    >
      <div
        className="flex h-[min(720px,94dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
        onMouseDown={() => {
          backdropDownRef.current = false
        }}
      >
        <header
          className="flex shrink-0 items-center gap-3 px-4 py-3 text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #5a0620 100%)` }}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Icon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">{meta.title}</h2>
            <p className="text-xs text-white/70">Posted salon bills only</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/15"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <div
          className="flex shrink-0 flex-wrap items-end gap-2 border-b px-4 py-3"
          style={{ background: FILTER_BG, borderColor: BORDER }}
        >
          <label className="flex flex-col gap-1 text-xs font-semibold text-salon-muted">
            From Date
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-salon-muted">
            To Date
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs font-semibold text-salon-muted">
            {meta.entityLabel}
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              disabled={loadingFilters}
              className={inputClass}
            >
              <option value="all">All {meta.entityLabel}s</option>
              {entityOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void display()}
            disabled={loading}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-salon-primary px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            Display
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {error && (
            <div className="px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
          )}
          {!error && !loading && rows.length === 0 && (
            <div className="px-4 py-12 text-center text-sm font-semibold text-salon-muted">
              No data for selected filters
            </div>
          )}
          {rows.length > 0 && kind === 'salesman' && (
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: FILTER_BG }}>
                  {[
                    '#',
                    'Salesman',
                    'Bills',
                    'Subtotal',
                    'Discount',
                    'Taxable',
                    'Tax',
                    'Round Off',
                    'Net',
                    'Cash',
                    'Card',
                    'Credit',
                  ].map((h) => (
                    <th
                      key={h}
                      className="border-b px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-salon-muted"
                      style={{ borderColor: BORDER }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.staffId ?? 'x'}-${i}`} style={{ background: i % 2 ? ROW_ALT : '#fff' }}>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {i + 1}
                    </td>
                    <td className="border-b px-3 py-2 font-semibold" style={{ borderColor: BORDER }}>
                      {String(r.staffName ?? '—')}
                    </td>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {num(r.billCount)}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.subtotal))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.discount))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.taxable))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.tax))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.roundOff))}
                    </td>
                    <td
                      className="border-b px-3 py-2 text-right font-bold tabular-nums"
                      style={{ borderColor: BORDER, color: ACCENT }}
                    >
                      {fmtMoney(num(r.net))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.cash))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.card))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.credit))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {rows.length > 0 && kind === 'item' && (
            <table className="w-full min-w-[800px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: FILTER_BG }}>
                  {['#', 'Code', 'Item', 'Group', 'Qty', 'Subtotal', 'Discount', 'Tax', 'Net'].map(
                    (h) => (
                      <th
                        key={h}
                        className="border-b px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-salon-muted"
                        style={{ borderColor: BORDER }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.productId ?? 'x'}-${i}`} style={{ background: i % 2 ? ROW_ALT : '#fff' }}>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {i + 1}
                    </td>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {String(r.productCode || '—')}
                    </td>
                    <td className="border-b px-3 py-2 font-semibold" style={{ borderColor: BORDER }}>
                      {String(r.productName ?? '—')}
                    </td>
                    <td className="border-b px-3 py-2" style={{ borderColor: BORDER }}>
                      {String(r.groupName || '—')}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {num(r.qty)}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.subtotal))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.discount))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.tax))}
                    </td>
                    <td
                      className="border-b px-3 py-2 text-right font-bold tabular-nums"
                      style={{ borderColor: BORDER, color: ACCENT }}
                    >
                      {fmtMoney(num(r.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {rows.length > 0 && kind === 'group' && (
            <table className="w-full min-w-[700px] border-collapse text-sm">
              <thead className="sticky top-0 z-10">
                <tr style={{ background: FILTER_BG }}>
                  {['#', 'Group', 'Bills', 'Qty', 'Subtotal', 'Discount', 'Tax', 'Net'].map((h) => (
                    <th
                      key={h}
                      className="border-b px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-salon-muted"
                      style={{ borderColor: BORDER }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.groupId ?? 'x'}-${i}`} style={{ background: i % 2 ? ROW_ALT : '#fff' }}>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {i + 1}
                    </td>
                    <td className="border-b px-3 py-2 font-semibold" style={{ borderColor: BORDER }}>
                      {String(r.groupName ?? '—')}
                    </td>
                    <td className="border-b px-3 py-2 tabular-nums" style={{ borderColor: BORDER }}>
                      {num(r.billCount)}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {num(r.qty)}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.subtotal))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.discount))}
                    </td>
                    <td className="border-b px-3 py-2 text-right tabular-nums" style={{ borderColor: BORDER }}>
                      {fmtMoney(num(r.tax))}
                    </td>
                    <td
                      className="border-b px-3 py-2 text-right font-bold tabular-nums"
                      style={{ borderColor: BORDER, color: ACCENT }}
                    >
                      {fmtMoney(num(r.net))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm font-semibold"
          style={{ borderColor: BORDER, background: FILTER_BG }}
        >
          <span className="text-salon-muted">
            {rows.length} row{rows.length === 1 ? '' : 's'}
            {kind === 'salesman' ? ` · ${totals.bills} bills` : ''}
            {kind !== 'salesman' ? ` · Qty ${totals.qty}` : ''}
          </span>
          <div className="flex flex-wrap gap-4">
            <span>
              Discount{' '}
              <strong className="tabular-nums">{fmtMoney(totals.discount)}</strong>
            </span>
            <span>
              Tax <strong className="tabular-nums">{fmtMoney(totals.tax)}</strong>
            </span>
            <span style={{ color: ACCENT }}>
              Net Total <strong className="tabular-nums">{fmtMoney(totals.net)}</strong>
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
