/**
 * Settlement dialog — visual match to Saloon-POS settlement.dart (#521C1D).
 * Keypad sized like PIN login; payment buttons + right panel emphasized.
 */
import { useMemo, useState, type ReactNode } from 'react'
import {
  Banknote,
  CreditCard,
  Landmark,
  Wallet,
  Cloud,
  Gift,
  CheckCircle2,
  Info,
  Clock,
  Timer,
  User,
  Save,
  ListChecks,
  CircleCheck,
  Delete,
  Eraser,
  X,
  WalletCards,
} from 'lucide-react'
import { apiService } from '../../api/apiService'
import type {
  CreditCustomer,
  PaymentMethodLabel,
  PaymentSplit,
  SettleOrderData,
  SettleResult,
} from '../../types/settlement'
import { ONLINE_SOURCES, PAYMENT_METHOD_TO_API } from '../../types/settlement'
import { fmtMoney, parseMoney } from '../../utils/posSession'
import CreditCustomerDialog from './CreditCustomerDialog'
import MultiPayDialog from './MultiPayDialog'
import OnlineSourceDialog from './OnlineSourceDialog'
import ComplimentDialog from './ComplimentDialog'

/** Saloon-POS settlement.dart theme */
const BRAND = '#521C1D'

const METHODS: { label: PaymentMethodLabel; icon: typeof Banknote }[] = [
  { label: 'Cash', icon: Banknote },
  { label: 'Card', icon: CreditCard },
  { label: 'Credit', icon: Landmark },
  { label: 'M-Pay', icon: Wallet },
  { label: 'Online', icon: Cloud },
  { label: 'Compliment', icon: Gift },
]

const KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', '00', 'Clear', 'Back', 'Close'] as const

interface SettlementDialogProps {
  open: boolean
  netTotal: number
  customerName?: string
  startTime?: string
  elapsed?: string
  orderData: SettleOrderData
  initialMethod?: PaymentMethodLabel
  onClose: () => void
  onSuccess: (
    result: SettleResult & { printReceipt: boolean; settledOrder: SettleOrderData },
  ) => void
}

export default function SettlementDialog({
  open,
  netTotal,
  customerName = 'Walk-in',
  startTime = '—',
  elapsed = '—',
  orderData,
  initialMethod = 'Cash',
  onClose,
  onSuccess,
}: SettlementDialogProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodLabel>(initialMethod)
  const [paidText, setPaidText] = useState(fmtMoney(netTotal))
  const [tipText, setTipText] = useState('0')
  const [focusField, setFocusField] = useState<'paid' | 'tip'>('paid')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [paymentSplits, setPaymentSplits] = useState<PaymentSplit[] | null>(null)
  const [onlineSource, setOnlineSource] = useState<string | null>(null)
  const [complimentApprovedBy, setComplimentApprovedBy] = useState<string | null>(null)
  const [creditCustomer, setCreditCustomer] = useState<CreditCustomer | null>(null)

  const [showCredit, setShowCredit] = useState(false)
  const [showMulti, setShowMulti] = useState(false)
  const [showOnline, setShowOnline] = useState(false)
  const [showCompliment, setShowCompliment] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingResult, setPendingResult] = useState<
    (SettleResult & { printReceipt: boolean; settledOrder: SettleOrderData }) | null
  >(null)

  const paid = parseMoney(paidText)
  const tip = parseMoney(tipText)
  const canEnterTip =
    selectedPayment === 'Cash' || selectedPayment === 'Card' || selectedPayment === 'Online'
  // Tip is extra — customer must pay bill + tip
  const grandTotal = netTotal + (canEnterTip ? tip : 0)
  const changeDue = Math.max(paid - grandTotal, 0)
  const shortfall = Math.max(grandTotal - paid, 0)
  const displayCustomer = creditCustomer?.customerName || customerName
  const mode = useMemo(() => PAYMENT_METHOD_TO_API[selectedPayment], [selectedPayment])

  if (!open) return null

  function resetExtras() {
    setPaymentSplits(null)
    setOnlineSource(null)
    setComplimentApprovedBy(null)
    setCreditCustomer(null)
    setTipText('0')
    setFocusField('paid')
  }

  function onPaymentTap(method: PaymentMethodLabel) {
    setSelectedPayment(method)
    setError(null)

    if (method === 'Credit') {
      setShowCredit(true)
      return
    }
    if (method === 'M-Pay') {
      setShowMulti(true)
      return
    }
    if (method === 'Online') {
      setShowOnline(true)
      return
    }
    if (method === 'Compliment') {
      setShowCompliment(true)
      return
    }

    resetExtras()
    setPaidText(fmtMoney(netTotal))
    setTipText('0')
    setFocusField('paid')
  }

  function onKeyTap(key: string) {
    if (key === 'Close') {
      onClose()
      return
    }
    if (key === 'Clear') {
      if (focusField === 'tip') {
        setTipText('0')
        // Tip cleared — leave Paid as-is (may still equal bill or more)
      } else {
        setPaidText('0')
      }
      return
    }
    if (key === 'Back') {
      if (focusField === 'tip') {
        const prev = tipText
        const next = !prev || prev === '0' ? '0' : prev.slice(0, -1) || '0'
        setTipText(next)
        // Keep Paid covering bill + tip when tip was driving the paid amount
        const nextTip = parseMoney(next)
        const need = netTotal + nextTip
        if (paid + 0.001 < need) setPaidText(fmtMoney(need))
      } else {
        setPaidText((prev) => {
          if (!prev || prev === '0') return '0'
          const next = prev.slice(0, -1)
          return next || '0'
        })
      }
      return
    }

    const applyKey = (text: string) => {
      let next = text === '0' ? '' : text
      if (key === '.') {
        if (next.includes('.')) return text
        next = next ? `${next}.` : '0.'
      } else if (key === '00') {
        next = next ? `${next}00` : '0'
      } else {
        next = `${next}${key}`
      }
      if (next.startsWith('.')) next = `0${next}`
      return next
    }

    if (focusField === 'tip') {
      const next = applyKey(tipText)
      const nextTip = parseMoney(next || '0')
      const need = netTotal + nextTip
      setTipText(next || '0')
      // Auto-raise Paid to bill + tip so settle never under-collects tip
      if (paid + 0.001 < need) setPaidText(fmtMoney(need))
    } else {
      setPaidText((text) => applyKey(text))
    }
  }

  async function onSave(printReceipt: boolean) {
    setError(null)

    if (!orderData?.items?.length) {
      setError('No order data. Add items and try again.')
      return
    }
    if (mode === 'ONLINE' && !onlineSource) {
      setError('Select an online source')
      return
    }
    if (mode === 'COMPLIMENT' && !complimentApprovedBy) {
      setError('Compliment needs supervisor approval')
      return
    }
    if (mode === 'CREDIT' && !creditCustomer?.customerId) {
      setError('Select a credit customer for Credit settlement')
      return
    }

    const needsFullPay = mode === 'CASH' || mode === 'CREDITCARD' || mode === 'ONLINE'
    const tipDue = canEnterTip ? tip : 0
    const minPaid = netTotal + tipDue
    if (needsFullPay && paid < minPaid - 0.001) {
      setError(
        tipDue > 0.001
          ? `Paid (${fmtMoney(paid)}) must cover bill + tip (${fmtMoney(minPaid)})`
          : `Paid amount (${fmtMoney(paid)}) must be >= Net amount (${fmtMoney(netTotal)})`,
      )
      return
    }

    if (mode === 'MULTIPAYMENT') {
      const splits = paymentSplits ?? []
      if (!splits.length) {
        setError('Add multi-payment splits first')
        return
      }
      const splitSum = splits.reduce((a, s) => a + (Number(s.amount) || 0), 0)
      if (Math.abs(splitSum - netTotal) > 0.02) {
        setError(
          `Split total (${fmtMoney(splitSum)}) must equal bill (${fmtMoney(netTotal)})`,
        )
        return
      }
    }

    if (saving) return
    setSaving(true)

    try {
      const payload: SettleOrderData = {
        ...orderData,
        paidAmount:
          mode === 'CREDIT' || mode === 'COMPLIMENT'
            ? 0
            : mode === 'MULTIPAYMENT'
              ? netTotal
              : paid,
        paymentMode: mode,
        netAmount: netTotal,
      }

      if (mode === 'MULTIPAYMENT') {
        // Keep tip on each split — API writes tip_amount per row for counter-close reports
        const splits = (paymentSplits ?? []).map((s) => ({
          payMode: s.payMode,
          amount: Math.round((Number(s.amount) || 0) * 1000) / 1000,
          tip: Math.round(Math.max(0, Number(s.tip) || 0) * 1000) / 1000,
          refNo: s.refNo ?? '',
        }))
        payload.paymentSplits = splits
        const splitTipTotal = splits.reduce((a, s) => a + (Number(s.tip) || 0), 0)
        if (splitTipTotal > 0.001) payload.tipAmount = splitTipTotal
      }
      if (mode === 'ONLINE') {
        payload.onlineSource = onlineSource ?? undefined
        payload.paymentRefNo = onlineSource ?? undefined
      }
      if (mode === 'COMPLIMENT') payload.complimentApprovedBy = complimentApprovedBy ?? undefined
      if (creditCustomer?.customerId) {
        payload.customerId = Number(creditCustomer.customerId) || 0
        payload.customerName = creditCustomer.customerName
        payload.customerCode = creditCustomer.customerCode
        payload.mobileNo = [creditCustomer.mobileNo, creditCustomer.telephone]
          .filter(Boolean)
          .join(' / ')
        payload.address = creditCustomer.address || ''
        payload.taxRegNo = creditCustomer.taxRegNo || ''
      }

      // Single-tender tip (Cash / Card / Online) — tip_amount on sales_payment_split
      if (canEnterTip && tip > 0.001 && mode !== 'MULTIPAYMENT') {
        payload.tipAmount = tip
        payload.paymentSplits = [
          {
            payMode: mode,
            amount: netTotal,
            tip,
            refNo: mode === 'ONLINE' ? onlineSource ?? '' : '',
          },
        ]
      }

      const apiRes = (await apiService.saveSettlement(
        payload as unknown as Record<string, unknown>,
      )) as unknown as SettleResult
      const balancePaid = Number(apiRes.balancePaid) || changeDue
      const splitTipTotal =
        mode === 'MULTIPAYMENT'
          ? (payload.paymentSplits ?? []).reduce((a, s) => a + (Number(s.tip) || 0), 0)
          : 0
      const tipShown =
        canEnterTip && tip > 0.001 ? tip : splitTipTotal > 0.001 ? splitTipTotal : 0
      const tipLine = tipShown > 0.001 ? `\nTip: ${fmtMoney(tipShown)}` : ''
      const message = `Bill #${apiRes.billNo} settled (${mode}).\nChange: ${fmtMoney(balancePaid)}${tipLine}`
      setSuccessMsg(message)
      setPendingResult({
        ...apiRes,
        paymentMode: apiRes.paymentMode ?? mode,
        printReceipt,
        settledOrder: payload,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Settlement failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3">
        <div
          className="bg-white flex flex-col shadow-2xl"
          style={{
            width: 'min(72vw, 980px)',
            minWidth: 640,
            maxHeight: '92vh',
            borderRadius: 12,
            padding: 12,
          }}
        >
          {/* Header chips */}
          <div
            className="flex items-center shrink-0"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgb(82 28 29 / 0.06)',
              border: '1px solid rgb(82 28 29 / 0.12)',
            }}
          >
            <HeaderChip icon={<Clock size={18} color={BRAND} />} label="Start" value={startTime} />
            <div className="w-px h-7 mx-3 bg-[#E0E0E0]" />
            <HeaderChip icon={<Timer size={18} color={BRAND} />} label="Elapsed" value={elapsed} />
            <div className="w-px h-7 mx-3 bg-[#E0E0E0]" />
            <HeaderChip icon={<User size={18} color={BRAND} />} label="Customer" value={displayCustomer} />
            <button
              type="button"
              aria-label="Close settlement"
              title="Close"
              disabled={saving}
              onClick={onClose}
              className="ml-auto flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: BRAND,
                color: '#fff',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex gap-3 mt-3 overflow-hidden">
            {/* LEFT: payment + compact keypad */}
            <div className="flex-[1.15] min-w-0 flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2.5 shrink-0">
                {METHODS.map(({ label, icon: Icon }) => (
                  <CompactBtn
                    key={label}
                    label={label}
                    icon={<Icon size={22} strokeWidth={2.25} />}
                    dense
                    selected={selectedPayment === label}
                    onClick={() => onPaymentTap(label)}
                  />
                ))}
              </div>

              {/* Login-style compact numpad — fixed key height, does not stretch */}
              <div
                className="shrink-0 bg-white self-stretch"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid #E0E0E0',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                  maxWidth: 420,
                }}
              >
                <div className="grid grid-cols-3 gap-2.5">
                  {KEYS.map((k) => {
                    const action = k === 'Clear' || k === 'Back' || k === 'Close'
                    return (
                      <KeypadTile key={k} label={k} action={action} onClick={() => onKeyTap(k)} />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: larger totals panel */}
            <div
              className="flex-1 min-w-[260px] flex flex-col gap-3 bg-white overflow-y-auto"
              style={{ padding: 14, borderRadius: 12, border: '1px solid #E0E0E0' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-extrabold text-[#424242]">Payment Mode</span>
                <span
                  className="px-3 py-2 text-[14px] font-black"
                  style={{
                    borderRadius: 10,
                    background: 'rgb(82 28 29 / 0.08)',
                    border: '1px solid rgb(82 28 29 / 0.15)',
                    color: BRAND,
                  }}
                >
                  {selectedPayment}
                  {selectedPayment === 'Online' && onlineSource ? ` · ${onlineSource}` : ''}
                  {selectedPayment === 'M-Pay' && paymentSplits?.length
                    ? ` · ${paymentSplits.length}`
                    : ''}
                </span>
              </div>

              <div>
                <div className="text-[13px] font-black text-[#424242] mb-2">Net Total</div>
                <div
                  className="flex items-center h-14 px-3.5 text-[22px] font-black text-black tabular-nums"
                  style={{ background: '#EEEEEE', border: '1px solid #E0E0E0', borderRadius: 10 }}
                >
                  {fmtMoney(netTotal)}
                </div>
              </div>

              <MoneyField
                label="Paid Amount"
                value={paidText}
                active={focusField === 'paid'}
                showKeypadBadge={focusField === 'paid'}
                onFocus={() => setFocusField('paid')}
              />
              {canEnterTip ? (
                <MoneyField
                  label="Tip"
                  value={tipText}
                  active={focusField === 'tip'}
                  showKeypadBadge={focusField === 'tip'}
                  onFocus={() => setFocusField('tip')}
                />
              ) : null}
              {canEnterTip && tip > 0.001 ? (
                <div>
                  <div className="text-[13px] font-black text-[#424242] mb-2">Grand Total</div>
                  <div
                    className="flex items-center h-12 px-3.5 text-[18px] font-black tabular-nums"
                    style={{
                      background: 'rgb(82 28 29 / 0.06)',
                      border: '1px solid rgb(82 28 29 / 0.2)',
                      borderRadius: 10,
                      color: BRAND,
                    }}
                  >
                    {fmtMoney(grandTotal)}
                  </div>
                </div>
              ) : null}
              <MoneyField
                label={
                  changeDue > 0.001
                    ? 'Change'
                    : shortfall > 0.001
                      ? 'Amount Due'
                      : 'Balance Amount'
                }
                value={fmtMoney(
                  changeDue > 0.001 ? changeDue : shortfall > 0.001 ? shortfall : 0,
                )}
                readOnly
              />

              <div
                className="mt-auto flex gap-2.5"
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: 'rgb(82 28 29 / 0.06)',
                  border: '1px solid rgb(82 28 29 / 0.15)',
                }}
              >
                <Info size={18} style={{ color: BRAND, flexShrink: 0, marginTop: 1 }} />
                <p className="text-[12.5px] font-semibold text-[#424242] leading-snug">
                  Tip is extra and not taxed. Paid must cover bill + tip (auto-updates when you
                  enter tip).
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm font-bold px-1 shrink-0" style={{ color: '#DC2626' }}>
              {error}
            </p>
          )}

          <div className="mt-3 grid grid-cols-3 gap-2.5 shrink-0">
            <CompactBtn
              label={saving ? 'Saving...' : 'Save'}
              icon={saving ? null : <Save size={20} />}
              selected
              disabled={saving}
              onClick={() => void onSave(false)}
            />
            <CompactBtn
              label={saving ? '...' : 'Save & Entry'}
              icon={saving ? null : <ListChecks size={20} />}
              selected
              disabled={saving}
              onClick={() => void onSave(true)}
            />
            <CompactBtn
              label={saving ? '...' : 'Enter'}
              icon={saving ? null : <CircleCheck size={20} />}
              selected
              disabled={saving}
              onClick={() => void onSave(true)}
            />
          </div>
        </div>
      </div>

      <CreditCustomerDialog
        open={showCredit}
        onClose={() => {
          setShowCredit(false)
          setSelectedPayment('Cash')
          resetExtras()
          setPaidText(fmtMoney(netTotal))
        }}
        onSelect={(c) => {
          setCreditCustomer(c)
          setShowCredit(false)
          setPaidText(fmtMoney(0))
        }}
      />

      <MultiPayDialog
        open={showMulti}
        billAmount={netTotal}
        initialSplits={paymentSplits}
        onClose={() => {
          // Cancel / overlay only — keep existing splits if user already confirmed once
          setShowMulti(false)
          if (!paymentSplits?.length) {
            setSelectedPayment('Cash')
            setPaymentSplits(null)
            setPaidText(fmtMoney(netTotal))
          }
        }}
        onConfirm={(splits) => {
          // Persist tips on each split row for ops.sales_payment_split.tip_amount
          setPaymentSplits(splits)
          setSelectedPayment('M-Pay')
          setShowMulti(false)
          setPaidText(fmtMoney(netTotal))
          setTipText('0')
          setFocusField('paid')
        }}
      />

      <OnlineSourceDialog
        open={showOnline}
        sources={ONLINE_SOURCES}
        onClose={() => {
          setShowOnline(false)
          setSelectedPayment('Cash')
          setOnlineSource(null)
        }}
        onSelect={(source) => {
          setOnlineSource(source)
          setShowOnline(false)
          setPaidText(fmtMoney(netTotal))
        }}
      />

      <ComplimentDialog
        open={showCompliment}
        onClose={() => {
          setShowCompliment(false)
          setSelectedPayment('Cash')
          setComplimentApprovedBy(null)
          setPaidText(fmtMoney(netTotal))
        }}
        onApprove={(name) => {
          setComplimentApprovedBy(name)
          setShowCompliment(false)
          setPaidText(fmtMoney(0))
        }}
      />

      {successMsg && pendingResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md p-6 shadow-xl" style={{ borderRadius: 12 }}>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="text-green-700" size={28} />
              <h3 className="text-xl font-bold" style={{ color: BRAND }}>
                Success
              </h3>
            </div>
            <p className="text-base text-black/80 whitespace-pre-line mb-5">{successMsg}</p>
            <button
              type="button"
              className="w-full h-12 text-white font-bold"
              style={{ background: BRAND, borderRadius: 8 }}
              onClick={() => {
                const result = pendingResult
                setSuccessMsg(null)
                setPendingResult(null)
                onSuccess(result)
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function HeaderChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2.5">
      <div
        className="flex items-center justify-center shrink-0 bg-white"
        style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #E0E0E0' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-[#616161] leading-tight">{label}</div>
        <div className="text-[14px] font-extrabold truncate" style={{ color: BRAND }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function CompactBtn({
  label,
  icon,
  selected,
  dense,
  disabled,
  onClick,
}: {
  label: string
  icon?: ReactNode
  selected?: boolean
  dense?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2.5 disabled:opacity-50"
      style={{
        height: dense ? 54 : 52,
        padding: '0 12px',
        borderRadius: 10,
        background: selected ? BRAND : '#fff',
        border: `1.5px solid ${selected ? BRAND : '#BDBDBD'}`,
        boxShadow: selected ? '0 6px 12px rgba(82,28,29,0.28)' : '0 1px 2px rgba(0,0,0,0.04)',
        color: selected ? '#fff' : '#000',
        fontSize: dense ? 15 : 14,
        fontWeight: 900,
        letterSpacing: 0.2,
      }}
    >
      {icon ? (
        <span style={{ color: selected ? '#fff' : BRAND, display: 'inline-flex' }}>{icon}</span>
      ) : null}
      {label}
    </button>
  )
}

function KeypadTile({
  label,
  action,
  onClick,
}: {
  label: string
  action?: boolean
  onClick: () => void
}) {
  const icon =
    label === 'Clear' ? (
      <Eraser size={18} />
    ) : label === 'Back' ? (
      <Delete size={18} />
    ) : label === 'Close' ? (
      <X size={18} />
    ) : null

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={(e) => e.preventDefault()}
      className="inline-flex h-14 items-center justify-center gap-1.5 active:scale-[0.97] transition-transform"
      style={{
        borderRadius: 8,
        background: action ? 'rgb(82 28 29 / 0.10)' : '#fff',
        border: `1px solid ${action ? 'rgb(82 28 29 / 0.35)' : '#DDD8D6'}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        color: action ? BRAND : '#1a1a1a',
        fontSize: action ? 13 : 20,
        fontWeight: 800,
        letterSpacing: 0.2,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

function MoneyField({
  label,
  value,
  active,
  readOnly,
  showKeypadBadge,
  onFocus,
}: {
  label: string
  value: string
  active?: boolean
  readOnly?: boolean
  showKeypadBadge?: boolean
  onFocus?: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-black text-[#424242]">{label}</span>
        {showKeypadBadge && (
          <span
            className="text-[11px] font-black px-2.5 py-1"
            style={{
              borderRadius: 10,
              background: 'rgb(82 28 29 / 0.08)',
              border: '1px solid rgb(82 28 29 / 0.15)',
              color: BRAND,
            }}
          >
            KEYPAD
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={readOnly}
        onClick={readOnly ? undefined : onFocus}
        className="w-full text-left disabled:cursor-default"
      >
        <div
          className="flex items-center gap-2.5 h-14 px-3.5"
          style={{
            borderRadius: 10,
            background: readOnly ? '#F5F5F5' : '#fff',
            border: active ? `2px solid ${BRAND}` : '1.5px solid #BDBDBD',
            boxShadow: active ? '0 4px 12px rgba(82,28,29,0.18)' : 'none',
          }}
        >
          <WalletCards size={20} style={{ color: active ? BRAND : '#616161', flexShrink: 0 }} />
          <span className="text-[20px] font-extrabold tabular-nums">{value}</span>
        </div>
      </button>
    </div>
  )
}
