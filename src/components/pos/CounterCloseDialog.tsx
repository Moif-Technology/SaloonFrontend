/**
 * Counter Close — Saloon-POS counterClose.dart design (#521C1D).
 * X-Report = live snapshot; Z-Report = close & save.
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ClipboardList, RefreshCw, X } from 'lucide-react'
import { apiService } from '../../api/apiService'
import {
  counterCloseInt,
  counterCloseNum,
  mapCounterCloseForUi,
} from '../../lib/counterCloseMapper'
import { printCounterReport } from '../../lib/printCounterReport'
import { getPosSession, fmtMoney } from '../../utils/posSession'
import { fetchReceiptSettings } from '../../utils/receiptSettings'

const BRAND = '#521C1D'
const PANEL_BG = '#FAF6F1'
const DENOMS = ['1000', '500', '200', '100', '50', '20', '10', '5', '1', '.50', '.25', '.10'] as const

function denomValue(label: string) {
  return Number(label) || 0
}

function initCounts() {
  return Object.fromEntries(DENOMS.map((d) => [d, ''])) as Record<string, string>
}

interface CounterCloseDialogProps {
  open: boolean
  onClose: () => void
  /**
   * Admin close (Saloon-POS "Counter Close - Admin"): all cashiers on this counter.
   * Defaults true so staff-wise bill count / amount and full totals load.
   */
  isAdmin?: boolean
}

function SummaryRow({
  label,
  value,
  bold,
  highlight,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between gap-2"
      style={{
        padding: '3px 0',
        fontSize: 13,
        fontWeight: bold || highlight ? 800 : 600,
        color: highlight ? BRAND : '#212121',
      }}
    >
      <span className="truncate">{label}</span>
      <span className="tabular-nums shrink-0">{value}</span>
    </div>
  )
}

function MetricColumn({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex-1 min-w-0 overflow-auto"
      style={{
        padding: '6px 8px',
        background: PANEL_BG,
        borderRadius: 8,
        border: '1px solid #D1D5DB',
      }}
    >
      {children}
    </div>
  )
}

export default function CounterCloseDialog({
  open,
  onClose,
  isAdmin = true,
}: CounterCloseDialogProps) {
  const session = getPosSession()
  const [raw, setRaw] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [counts, setCounts] = useState(initCounts)
  const [collectedText, setCollectedText] = useState('')
  const [activeDenom, setActiveDenom] = useState<string | null>(null)
  const [zDone, setZDone] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Same call as Saloon-POS counterCloseProvider(admin) → fetchCounterSummary(allStaff: true)
      const data = await apiService.fetchCounterSummary({
        counterNo: session.counterNo,
        allStaff: isAdmin,
      })
      setRaw(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary')
      setRaw(null)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, session.counterNo])

  useEffect(() => {
    if (!open) return
    setBanner(null)
    setZDone(false)
    setCounts(initCounts())
    setCollectedText('')
    setActiveDenom(null)
    void load()
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const data = useMemo(() => {
    if (!raw) return null
    return mapCounterCloseForUi(raw, {
      staffName: session.staffName,
      counterNo: session.counterNo,
    })
  }, [raw, session.staffName, session.counterNo])

  const cashToCollect = data ? counterCloseNum(data.AmountToBeCollected) : 0

  const denomTotal = useMemo(
    () =>
      DENOMS.reduce(
        (sum, d) => sum + denomValue(d) * (parseFloat(counts[d]) || 0),
        0,
      ),
    [counts],
  )

  // Denom changes update collected; manual typed collected overrides until denom changes again
  useEffect(() => {
    if (denomTotal > 0) {
      setCollectedText(denomTotal.toFixed(2))
    }
  }, [denomTotal])

  const collectedAmount = parseFloat(collectedText) || 0
  const cashDifference =
    collectedAmount === 0 ? 0 : collectedAmount - cashToCollect

  function onKeypad(key: string) {
    if (activeDenom) {
      setCounts((prev) => {
        const cur = prev[activeDenom] ?? ''
        if (key === 'C') return { ...prev, [activeDenom]: '' }
        if (key === '.' && cur.includes('.')) return prev
        return { ...prev, [activeDenom]: cur + key }
      })
      return
    }
    setCollectedText((cur) => {
      if (key === 'C') return ''
      if (key === '.' && cur.includes('.')) return cur
      return cur + key
    })
  }

  async function runReport(type: 'X' | 'Z') {
    if (submitting || loading) return
    setSubmitting(true)
    setError(null)
    try {
      const result = await apiService.closeCounter({
        reportType: type,
        collectedCash: collectedAmount,
        counterNo: session.counterNo,
        allStaff: isAdmin,
      })
      const mapped = mapCounterCloseForUi(
        { ...(raw ?? {}), ...result },
        {
          staffName: session.staffName,
          counterNo: session.counterNo,
          collectedOverride: collectedAmount,
          differenceOverride: collectedAmount - cashToCollect,
        },
      )
      const closeNo = String(mapped.closeNo ?? '')
      setBanner(
        type === 'Z'
          ? `Z-Report saved — ${closeNo || 'OK'}${
              result.billsClosed != null ? ` · ${result.billsClosed} bill(s) closed` : ''
            }`
          : 'X-Report — live snapshot (not saved)',
      )

      try {
        await printCounterReport(mapped, {
          companyName: (await fetchReceiptSettings()).heading1 || undefined,
          counterNo: session.counterNo,
          reportType: type,
          closeNo,
        })
      } catch (printErr) {
        setError(
          printErr instanceof Error
            ? `Report saved but print failed: ${printErr.message}`
            : 'Report saved but print failed',
        )
      }

      if (type === 'Z') {
        setCounts(initCounts())
        setCollectedText('')
        setZDone(true)
        await load()
      } else {
        await load()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `${type}-Report failed`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  const staffRows = (data?.staffSales as Record<string, unknown>[] | undefined) ?? []
  const staffTotals = staffRows.reduce<{ bills: number; sales: number }>(
    (acc, r) => {
      acc.bills += counterCloseInt(r.billCount)
      acc.sales += counterCloseNum(r.saleAmount)
      return acc
    },
    { bills: 0, sales: 0 },
  )
  const title = isAdmin ? 'Counter Close - Admin' : 'Counter Close'

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col overflow-hidden"
        style={{
          width: 'min(92vw, 960px)',
          height: 'min(86vh, 680px)',
          borderRadius: 14,
          boxShadow: '0 20px 50px rgba(0,0,0,0.28)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 px-3 shrink-0"
          style={{ height: 48, background: BRAND }}
        >
          <ClipboardList size={20} className="text-white shrink-0" />
          <h2 className="flex-1 text-white text-[15px] font-bold truncate">{title}</h2>
          <span className="text-white/90 text-[12px] font-semibold truncate hidden sm:inline">
            {session.staffName || 'Cashier'} · Ctr {session.counterNo}
            {isAdmin ? ' · ALL' : ''}
          </span>
          <button
            type="button"
            title="Refresh"
            disabled={loading || submitting}
            onClick={() => void load()}
            className="grid place-items-center size-8 rounded-lg text-white/95 hover:bg-white/15 disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            title="Close"
            onClick={onClose}
            className="grid place-items-center size-8 rounded-lg text-white hover:bg-white/15"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <X size={18} />
          </button>
        </div>

        {banner && (
          <div
            className="px-3 py-1.5 text-[12px] font-semibold text-white shrink-0"
            style={{ background: '#1B5E20' }}
          >
            {banner}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 min-h-0 flex flex-col px-2.5 pt-2 pb-1 gap-1.5 overflow-hidden">
          {loading && !data && (
            <div className="flex-1 grid place-items-center text-sm font-semibold" style={{ color: BRAND }}>
              Loading counter summary…
            </div>
          )}
          {error && !data && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
              <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              <button
                type="button"
                className="h-9 px-4 rounded-lg text-white text-sm font-bold"
                style={{ background: BRAND }}
                onClick={() => void load()}
              >
                Retry
              </button>
            </div>
          )}

          {data && (
            <>
              {/* Metrics */}
              <div className="flex gap-1.5 flex-[5] min-h-0">
                <MetricColumn>
                  <SummaryRow label="Total Cash" value={fmtMoney(counterCloseNum(data.finalTotalCash))} />
                  <SummaryRow label="Credits Received" value={fmtMoney(counterCloseNum(data.ReceiptAmount))} />
                  <SummaryRow label="Refund Amt" value={fmtMoney(counterCloseNum(data.RefundAmount))} />
                  <SummaryRow label="Advance Received" value={fmtMoney(counterCloseNum(data.AdvanceReceived))} />
                  <SummaryRow label="Total Cash IN" value={fmtMoney(counterCloseNum(data.CashIN))} />
                  <SummaryRow label="Total Cash Out" value={fmtMoney(counterCloseNum(data.CashOUt))} />
                  <SummaryRow
                    label="Cash To Be Collected"
                    value={fmtMoney(cashToCollect)}
                    bold
                    highlight
                  />
                </MetricColumn>
                <MetricColumn>
                  <SummaryRow label="Credit Amt" value={fmtMoney(counterCloseNum(data.CreditAmount))} />
                  <SummaryRow label="Credit Card Amt" value={fmtMoney(counterCloseNum(data.CreditCardAmount))} />
                  <SummaryRow label="Online Sale Amt" value={fmtMoney(counterCloseNum(data.OnlineAmount))} />
                  <SummaryRow label="Voucher Amt" value={fmtMoney(counterCloseNum(data.VoucherAmount))} />
                  <SummaryRow label="Compliment Amt" value={fmtMoney(counterCloseNum(data.ComplimentAmount))} />
                  <SummaryRow label="Receipt C.Card Amt" value={fmtMoney(counterCloseNum(data.ReceiptAmountCCard))} />
                  <SummaryRow label="Total Discount" value={fmtMoney(counterCloseNum(data.DiscountAmount))} />
                </MetricColumn>
                <MetricColumn>
                  <p className="font-bold mb-1" style={{ color: BRAND, fontSize: 13 }}>
                    Bill Count: {counterCloseInt(data.BillCount)}
                  </p>
                  <SummaryRow label="Cash Bill" value={String(counterCloseInt(data.CashBillCount))} />
                  <SummaryRow label="Credit Bill" value={String(counterCloseInt(data.CreditBillCount))} />
                  <SummaryRow label="Credit Card Bill" value={String(counterCloseInt(data.CreditCardBillCount))} />
                  <SummaryRow label="Compliment Bill" value={String(counterCloseInt(data.ComplimentBillCount))} />
                  <SummaryRow label="Multi Payment Bill" value={String(counterCloseInt(data.MultiBillCount))} />
                  <SummaryRow label="No Of Customers" value={String(counterCloseInt(data.totalCustomers))} />
                </MetricColumn>
              </div>

              {/* Staff / user wise — always shown for Admin (Saloon-POS) */}
              <div
                className="shrink-0 overflow-auto"
                style={{
                  maxHeight: 110,
                  background: PANEL_BG,
                  borderRadius: 8,
                  border: '1px solid #D1D5DB',
                }}
              >
                <div
                  className="px-2 py-1 text-[12px] font-bold flex items-center justify-between"
                  style={{ color: BRAND, background: 'rgba(82,28,29,0.08)' }}
                >
                  <span>Staff / User wise sales</span>
                  <span className="font-semibold text-black/55">
                    {staffRows.length} staff · {staffTotals.bills} bills ·{' '}
                    {fmtMoney(staffTotals.sales)}
                  </span>
                </div>
                {staffRows.length === 0 ? (
                  <p className="px-2 py-2 text-[12px] text-black/45 font-medium">
                    {loading
                      ? 'Loading staff sales…'
                      : 'No pending staff sales for this counter'}
                  </p>
                ) : (
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr style={{ color: BRAND }}>
                        <th className="text-left px-2 py-0.5 font-bold">Staff</th>
                        <th className="text-right px-2 py-0.5 font-bold">Bills</th>
                        <th className="text-right px-2 py-0.5 font-bold">Sale amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffRows.map((r, i) => (
                        <tr key={String(r.staffId ?? i)}>
                          <td className="px-2 py-0.5 font-semibold">
                            {String(r.staffName ?? 'Unknown')}
                          </td>
                          <td className="px-2 py-0.5 text-right tabular-nums">
                            {counterCloseInt(r.billCount)}
                          </td>
                          <td className="px-2 py-0.5 text-right tabular-nums font-semibold">
                            {fmtMoney(counterCloseNum(r.saleAmount))}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '1px solid #D1D5DB' }}>
                        <td className="px-2 py-1 font-bold" style={{ color: BRAND }}>
                          TOTAL
                        </td>
                        <td
                          className="px-2 py-1 text-right font-bold tabular-nums"
                          style={{ color: BRAND }}
                        >
                          {staffTotals.bills}
                        </td>
                        <td
                          className="px-2 py-1 text-right font-bold tabular-nums"
                          style={{ color: BRAND }}
                        >
                          {fmtMoney(staffTotals.sales)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <p className="text-[13px] font-bold shrink-0" style={{ color: BRAND }}>
                Cash Denominations
              </p>
              <div className="flex flex-wrap gap-2 shrink-0">
                {DENOMS.map((d) => (
                  <label
                    key={d}
                    className="flex items-center gap-1 text-[12px] font-semibold"
                    style={{
                      border:
                        activeDenom === d
                          ? `1.5px solid ${BRAND}`
                          : '1px solid #D1D5DB',
                      borderRadius: 6,
                      padding: '2px 6px',
                      background: activeDenom === d ? 'rgba(82,28,29,0.06)' : '#fff',
                      cursor: 'pointer',
                    }}
                    onClick={() => setActiveDenom(d)}
                  >
                    <span className="w-9 tabular-nums">{d}</span>
                    <span>×</span>
                    <input
                      className="w-12 h-7 text-center text-[12px] font-bold outline-none border border-[#E5E7EB] rounded"
                      value={counts[d]}
                      onFocus={() => setActiveDenom(d)}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, '')
                        setCounts((prev) => ({ ...prev, [d]: v }))
                      }}
                    />
                  </label>
                ))}
              </div>

              {/* Collected + keypad */}
              <div className="flex gap-2 shrink-0" style={{ height: 150 }}>
                <div className="flex-[3] flex flex-col gap-1 min-w-0">
                  <SummaryRow label="Collected Amount" value="" bold />
                  <input
                    className="h-9 px-2.5 rounded-md border border-[#D1D5DB] text-[13px] font-bold outline-none focus:border-[#521C1D]"
                    placeholder="Collected amount"
                    value={collectedText}
                    onFocus={() => setActiveDenom(null)}
                    onChange={(e) => {
                      setCollectedText(e.target.value.replace(/[^\d.]/g, ''))
                    }}
                  />
                  <SummaryRow
                    label="Cash Difference"
                    value={fmtMoney(cashDifference)}
                    bold
                    highlight
                  />
                  <SummaryRow
                    label="Total Sales"
                    value={fmtMoney(counterCloseNum(data.TotalAmount))}
                    bold
                  />
                  <SummaryRow
                    label="Tax Amount"
                    value={fmtMoney(counterCloseNum(data.TaxAmount))}
                    bold
                  />
                </div>
                <div className="flex-[2] grid grid-cols-3 grid-rows-4 gap-1">
                  {(['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'C'] as const).map(
                    (k) => (
                      <button
                        key={k}
                        type="button"
                        disabled={submitting}
                        onClick={() => onKeypad(k)}
                        className="rounded-md text-[14px] font-bold hover:bg-[rgba(82,28,29,0.08)] disabled:opacity-40"
                        style={{
                          border: `1px solid ${BRAND}`,
                          color: BRAND,
                          background: '#fff',
                        }}
                      >
                        {k}
                      </button>
                    ),
                  )}
                </div>
              </div>

              {error && (
                <p className="text-[12px] font-semibold text-red-600 shrink-0">{error}</p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-2.5 pb-2.5 pt-1 shrink-0">
          <button
            type="button"
            disabled={submitting || loading || !data}
            onClick={() => void runReport('X')}
            className="h-10 min-w-[120px] px-4 rounded-lg text-[13px] font-semibold disabled:opacity-40"
            style={{
              color: BRAND,
              border: `1.4px solid ${BRAND}`,
              background: '#fff',
            }}
          >
            {submitting ? '…' : 'X-Report'}
          </button>
          <div className="flex-1" />
          {zDone ? (
            <button
              type="button"
              onClick={onClose}
              className="h-10 min-w-[120px] px-4 rounded-lg text-[13px] font-bold text-white"
              style={{ background: BRAND }}
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || loading || !data}
              onClick={() => void runReport('Z')}
              className="h-10 min-w-[120px] px-4 rounded-lg text-[13px] font-bold text-white disabled:opacity-40"
              style={{ background: BRAND }}
            >
              {submitting ? 'Saving…' : 'Z-Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
