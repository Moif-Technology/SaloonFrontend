/**
 * Settlement dialog — visual match to Saloon-POS settlement.dart (#521C1D).
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
  const balance = netTotal - paid
  const displayCustomer = creditCustomer?.customerName || customerName
  const mode = useMemo(() => PAYMENT_METHOD_TO_API[selectedPayment], [selectedPayment])

  if (!open) return null

  function resetExtras() {
    setPaymentSplits(null)
    setOnlineSource(null)
    setComplimentApprovedBy(null)
    setCreditCustomer(null)
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
  }

  function onKeyTap(key: string) {
    if (key === 'Close') {
      onClose()
      return
    }
    if (key === 'Clear') {
      setPaidText('0')
      return
    }
    if (key === 'Back') {
      setPaidText((prev) => {
        if (!prev || prev === '0') return '0'
        const next = prev.slice(0, -1)
        return next || '0'
      })
      return
    }

    setPaidText((text) => {
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
    })
  }

  async function onSave(printReceipt: boolean) {
    setError(null)

    if (!orderData?.items?.length) {
      setError('No order data. Add items and try again.')
      return
    }
    if (mode === 'MULTIPAYMENT' && (!paymentSplits || paymentSplits.length === 0)) {
      setError('Add multi-payment splits first')
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
    if (needsFullPay && paid < netTotal - 0.001) {
      setError(`Paid amount (${fmtMoney(paid)}) must be >= Net amount (${fmtMoney(netTotal)})`)
      return
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

      if (mode === 'MULTIPAYMENT') payload.paymentSplits = paymentSplits ?? undefined
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

      const apiRes = (await apiService.saveSettlement(
        payload as unknown as Record<string, unknown>,
      )) as unknown as SettleResult
      const balancePaid = Number(apiRes.balancePaid) || Math.max(paid - netTotal, 0)
      const message = `Bill #${apiRes.billNo} settled (${mode}).\nChange: ${fmtMoney(balancePaid)}`
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
            width: 'min(68vw, 940px)',
            minWidth: 560,
            height: 'min(84vh, 740px)',
            minHeight: 520,
            borderRadius: 10,
            padding: 10,
          }}
        >
          {/* Header chips — Saloon-POS */}
          <div
            className="flex items-center"
            style={{
              padding: '9px 10px',
              borderRadius: 10,
              background: 'rgb(82 28 29 / 0.06)',
              border: '1px solid rgb(82 28 29 / 0.12)',
            }}
          >
            <HeaderChip icon={<Clock size={16} color={BRAND} />} label="Start" value={startTime} />
            <div className="w-px h-[26px] mx-2.5 bg-[#E0E0E0]" />
            <HeaderChip icon={<Timer size={16} color={BRAND} />} label="Elapsed" value={elapsed} />
            <div className="w-px h-[26px] mx-2.5 bg-[#E0E0E0]" />
            <HeaderChip icon={<User size={16} color={BRAND} />} label="Customer" value={displayCustomer} />
            <button
              type="button"
              aria-label="Close settlement"
              title="Close"
              disabled={saving}
              onClick={onClose}
              className="ml-auto flex items-center justify-center shrink-0 disabled:opacity-40"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: BRAND,
                color: '#fff',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex gap-2.5 mt-2.5">
            {/* LEFT: payment + keypad */}
            <div className="flex-[2] min-w-0 flex flex-col gap-2.5">
              <div className="grid grid-cols-3 gap-2.5">
                {METHODS.map(({ label, icon: Icon }) => (
                  <CompactBtn
                    key={label}
                    label={label}
                    icon={<Icon size={18} />}
                    dense
                    selected={selectedPayment === label}
                    onClick={() => onPaymentTap(label)}
                  />
                ))}
              </div>

              <div
                className="flex-1 min-h-0 bg-white"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  border: '1px solid #E0E0E0',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div className="h-full grid grid-cols-3 grid-rows-5 gap-2">
                  {KEYS.map((k) => {
                    const action = k === 'Clear' || k === 'Back' || k === 'Close'
                    return (
                      <KeypadTile key={k} label={k} action={action} onClick={() => onKeyTap(k)} />
                    )
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT: totals */}
            <div
              className="flex-1 min-w-[220px] flex flex-col gap-2.5 bg-white"
              style={{ padding: 10, borderRadius: 10, border: '1px solid #E0E0E0' }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold text-[#424242]">Payment Mode</span>
                <span
                  className="px-2.5 py-1.5 text-[11.5px] font-black"
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
                <div className="text-[11px] font-black text-[#424242] mb-1.5">Net Total</div>
                <div
                  className="flex items-center h-11 px-2.5 text-[16px] font-black text-black"
                  style={{ background: '#EEEEEE', border: '1px solid #E0E0E0', borderRadius: 10 }}
                >
                  {fmtMoney(netTotal)}
                </div>
              </div>

              <MoneyField label="Paid Amount" value={paidText} active showKeypadBadge />
              <MoneyField label="Balance Amount" value={fmtMoney(balance)} readOnly />

              <div
                className="mt-auto flex gap-2.5"
                style={{
                  padding: 10,
                  borderRadius: 10,
                  background: 'rgb(82 28 29 / 0.06)',
                  border: '1px solid rgb(82 28 29 / 0.15)',
                }}
              >
                <Info size={16} style={{ color: BRAND, flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px] font-semibold text-[#424242] leading-snug">
                  Use keypad to edit Paid Amount. Balance updates automatically.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm font-bold px-1" style={{ color: '#DC2626' }}>
              {error}
            </p>
          )}

          {/* Bottom — all selected (filled brand) like Flutter */}
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            <CompactBtn
              label={saving ? 'Saving...' : 'Save'}
              icon={saving ? null : <Save size={18} />}
              selected
              disabled={saving}
              onClick={() => void onSave(false)}
            />
            <CompactBtn
              label={saving ? '...' : 'Save & Entry'}
              icon={saving ? null : <ListChecks size={18} />}
              selected
              disabled={saving}
              onClick={() => void onSave(true)}
            />
            <CompactBtn
              label={saving ? '...' : 'Enter'}
              icon={saving ? null : <CircleCheck size={18} />}
              selected
              disabled={saving}
              onClick={() => void onSave(false)}
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
          setShowMulti(false)
          if (!paymentSplits?.length) {
            setSelectedPayment('Cash')
            setPaymentSplits(null)
            setPaidText(fmtMoney(netTotal))
          }
        }}
        onConfirm={(splits) => {
          setPaymentSplits(splits)
          setSelectedPayment('M-Pay')
          setShowMulti(false)
          setPaidText(fmtMoney(netTotal))
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
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <div
        className="flex items-center justify-center shrink-0 bg-white"
        style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #E0E0E0' }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10.5px] text-[#616161] leading-tight">{label}</div>
        <div className="text-[12.5px] font-extrabold truncate" style={{ color: BRAND }}>
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
      className="inline-flex items-center justify-center gap-2 disabled:opacity-50"
      style={{
        height: dense ? 42 : 46,
        padding: '0 10px',
        borderRadius: 10,
        background: selected ? BRAND : '#fff',
        border: `1px solid ${selected ? BRAND : '#BDBDBD'}`,
        boxShadow: selected ? '0 6px 10px rgba(82,28,29,0.25)' : 'none',
        color: selected ? '#fff' : '#000',
        fontSize: 13,
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
      className="inline-flex items-center justify-center gap-2"
      style={{
        borderRadius: 10,
        background: action ? 'rgb(82 28 29 / 0.10)' : '#F5F5F5',
        border: `1px solid ${action ? 'rgb(82 28 29 / 0.35)' : '#E0E0E0'}`,
        boxShadow: '0 3px 6px rgba(0,0,0,0.04)',
        color: action ? BRAND : '#000',
        fontSize: action ? 13 : 16,
        fontWeight: 900,
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
}: {
  label: string
  value: string
  active?: boolean
  readOnly?: boolean
  showKeypadBadge?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-black text-[#424242]">{label}</span>
        {showKeypadBadge && (
          <span
            className="text-[10px] font-black px-2 py-1"
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
      <div
        className="flex items-center gap-2 h-[42px] px-2.5"
        style={{
          borderRadius: 10,
          background: readOnly ? '#F5F5F5' : '#fff',
          border: active ? `1.6px solid ${BRAND}` : '1px solid #BDBDBD',
          boxShadow: active ? '0 4px 10px rgba(82,28,29,0.18)' : 'none',
        }}
      >
        <WalletCards size={16} style={{ color: active ? BRAND : '#616161', flexShrink: 0 }} />
        <span className="text-[13px] font-extrabold tabular-nums">{value}</span>
      </div>
    </div>
  )
}
