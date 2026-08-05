/**
 * Multi-Pay / Split Payment — ported from Counter-pos MultiPaymentModal.jsx
 * (design + working identical; standalone onConfirm mode for Salon settlement).
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { X, Layers, Delete, AlertCircle } from 'lucide-react'
import type { PaymentSplit } from '../../types/settlement'

const BRAND = '#6b0000'
const BRAND2 = '#990000'

const CSS_VARS: CSSProperties = {
  ['--brand' as string]: BRAND,
  ['--brand-2' as string]: BRAND2,
  ['--brand-bg' as string]: '#fff2f2',
  ['--brand-border' as string]: '#f5b8b8',
  ['--purple' as string]: '#6d28d9',
  ['--purple-bg' as string]: '#f5f3ff',
  ['--purple-border' as string]: '#ddd6fe',
  ['--blue' as string]: '#1d4ed8',
  ['--blue-bg' as string]: '#eff6ff',
  ['--blue-border' as string]: '#bfdbfe',
  ['--red' as string]: '#dc2626',
  ['--red-bg' as string]: '#fef2f2',
  ['--red-border' as string]: '#fecaca',
  ['--green' as string]: BRAND,
  ['--green-bg' as string]: '#fff2f2',
  ['--green-border' as string]: '#f5b8b8',
  ['--surface' as string]: '#fff',
  ['--surface-2' as string]: '#edece8',
  ['--border' as string]: '#dbd9d2',
  ['--text-1' as string]: '#1a1a1a',
  ['--text-2' as string]: '#4a4a4a',
  ['--text-3' as string]: '#7a7a7a',
  ['--text-4' as string]: '#a3a3a3',
  ['--shadow-sm' as string]: '0 1px 3px rgba(0,0,0,0.08)',
}

const SPLIT_PAY_MODES = [
  { key: 'CASH', label: 'CASH', color: 'var(--brand)', bg: 'var(--brand-bg)', border: 'var(--brand-border)' },
  { key: 'CREDITCARD', label: 'CREDITCARD', color: 'var(--brand)', bg: 'var(--brand-bg)', border: 'var(--brand-border)' },
  { key: 'ONLINE', label: 'ONLINE', color: 'var(--blue)', bg: 'var(--blue-bg)', border: 'var(--blue-border)' },
  { key: 'VOUCHER', label: 'VOUCHER', color: 'var(--text-2)', bg: 'var(--surface-2)', border: 'var(--border)' },
] as const

const NUM_ROWS = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['0', '.', '00'],
]

let rowSeq = 1

function num(v: unknown, d = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : d
}

function roundMoney(v: number) {
  return Math.round((Number(v) || 0) * 100) / 100
}

function fmtMoney(v: number) {
  return roundMoney(v).toFixed(2)
}

function moneyInputRegex() {
  return /^\d+(\.\d{0,2})?$/
}

function moneyPlaceholder() {
  return '0.00'
}

function rowsToSplits(list: SplitRow[]): PaymentSplit[] {
  return list.map((r) => ({
    payMode: r.payMode,
    amount: roundMoney(r.amount),
    tip: roundMoney(r.tip),
    refNo: r.refNo ?? '',
  }))
}

interface SplitRow {
  id: number
  payerNo: number
  payMode: string
  amount: number
  tip: number
  refNo: string
}

function hydrateRowsFromSplits(splits?: PaymentSplit[] | null): SplitRow[] {
  if (!Array.isArray(splits) || !splits.length) return []
  return splits.map((s, i) => ({
    id: rowSeq++,
    payerNo: i + 1,
    payMode: s.payMode ?? 'CASH',
    amount: num(s.amount, 0),
    tip: num(s.tip, 0),
    refNo: s.refNo ?? '',
  }))
}

interface MultiPayDialogProps {
  open: boolean
  billAmount: number
  initialSplits?: PaymentSplit[] | null
  onClose: () => void
  onConfirm: (splits: PaymentSplit[]) => void
}

export default function MultiPayDialog({
  open,
  billAmount,
  initialSplits,
  onClose,
  onConfirm,
}: MultiPayDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const netAmount = Number(billAmount) || 0

  const [rows, setRows] = useState<SplitRow[]>(() => hydrateRowsFromSplits(initialSplits))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [payMode, setPayMode] = useState('CASH')
  const [amount, setAmount] = useState('')
  const [tip, setTip] = useState('')
  const [refNo, setRefNo] = useState('')
  const [focusField, setFocusField] = useState<'amount' | 'tip' | 'ref'>('amount')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setRows(hydrateRowsFromSplits(initialSplits))
    setSelectedId(null)
    setPayMode('CASH')
    setAmount('')
    setTip('')
    setRefNo('')
    setFocusField('amount')
    setError('')
  }, [open, initialSplits])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const billTotal = useMemo(
    () => roundMoney(rows.reduce((a, r) => a + num(r.amount, 0), 0)),
    [rows],
  )
  const tipTotal = useMemo(
    () => roundMoney(rows.reduce((a, r) => a + num(r.tip, 0), 0)),
    [rows],
  )
  const remaining = useMemo(
    () => roundMoney(netAmount - billTotal),
    [netAmount, billTotal],
  )
  const grandTotal = useMemo(() => roundMoney(billTotal + tipTotal), [billTotal, tipTotal])
  const balanced = Math.abs(remaining) <= 0.02
  const canDone = rows.length > 0 && balanced

  if (!open) return null

  const setFieldValue = (field: typeof focusField, value: string) => {
    if (field === 'amount') setAmount(value)
    else if (field === 'tip') setTip(value)
    else setRefNo(value)
  }

  const getFieldValue = (field: typeof focusField) => {
    if (field === 'amount') return amount
    if (field === 'tip') return tip
    return refNo
  }

  const appendKey = (key: string) => {
    setError('')
    if (focusField === 'ref') {
      setRefNo((v) => v + key)
      return
    }
    const cur = getFieldValue(focusField)
    const next = cur + key
    if (!moneyInputRegex().test(next)) return
    setFieldValue(focusField, next)
  }

  const backspace = () => {
    setError('')
    if (focusField === 'ref') {
      setRefNo((v) => v.slice(0, -1))
      return
    }
    setFieldValue(focusField, getFieldValue(focusField).slice(0, -1))
  }

  const clearField = () => {
    setError('')
    setFieldValue(focusField, '')
  }

  const useRemaining = () => {
    setError('')
    if (remaining <= 0) {
      setError('No remaining balance to apply.')
      return
    }
    setAmount(fmtMoney(remaining))
    setFocusField('amount')
  }

  const addRow = () => {
    setError('')
    if (remaining <= 0.01) {
      setError('Split balance is 0.00 — cannot add more rows.')
      return
    }
    const amt = num(amount, 0)
    const tipAmt = num(tip, 0)
    const refVal = refNo.trim()
    if (amt <= 0) {
      setError('Enter split amount.')
      setFocusField('amount')
      return
    }
    if (amt > remaining + 0.01) {
      setError(`Amount exceeds remaining balance (${fmtMoney(remaining)}).`)
      setFocusField('amount')
      return
    }
    const id = rowSeq++
    setRows((prev) => [
      ...prev,
      { id, payerNo: prev.length + 1, payMode, amount: amt, tip: tipAmt, refNo: refVal },
    ])
    setSelectedId(id)
    setAmount('')
    setTip('')
    setRefNo('')
    setFocusField('amount')
  }

  const removeSelected = () => {
    setError('')
    if (selectedId == null) return
    setRows((prev) =>
      prev.filter((r) => r.id !== selectedId).map((r, i) => ({ ...r, payerNo: i + 1 })),
    )
    setSelectedId(null)
  }

  const clearAll = () => {
    setError('')
    setRows([])
    setSelectedId(null)
  }

  const done = () => {
    setError('')
    if (!rows.length) {
      setError('Add split rows first.')
      return
    }
    if (!balanced) {
      setError(`Split not completed. Balance: ${fmtMoney(remaining)}`)
      return
    }
    onConfirm(rowsToSplits(rows))
    onClose()
  }

  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.93)'
  }
  const release = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)'
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(10,8,6,0.44)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...CSS_VARS,
      }}
    >
      <style>{`
        @keyframes sp-fade  { from{opacity:0} to{opacity:1} }
        @keyframes sp-slide { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 700,
          maxWidth: '96vw',
          maxHeight: '94vh',
          background: '#fff',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: '0 28px 72px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sp-slide 0.18s cubic-bezier(.22,.68,0,1.2)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`,
            padding: '14px 18px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={16} color="#fff" />
              </div>
              <div>
                <p
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.55)',
                    fontWeight: 600,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Settlement
                </p>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: 0 }}>
                  Split Payment
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                flexShrink: 0,
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Bill Total', value: fmtMoney(netAmount), accent: false },
              { label: 'Remaining', value: fmtMoney(remaining), accent: !balanced },
              { label: 'Paid', value: fmtMoney(billTotal), accent: false },
            ].map((chip) => (
              <div
                key={chip.label}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.85)',
                }}
              >
                {chip.label}{' '}
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 16,
                    fontWeight: 800,
                    color: chip.accent ? '#fecaca' : '#fff',
                  }}
                >
                  {chip.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', overflow: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 14 }}>
            {SPLIT_PAY_MODES.map((m) => {
              const active = payMode === m.key
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPayMode(m.key)}
                  style={{
                    height: 40,
                    borderRadius: 10,
                    border: `1.5px solid ${active ? m.border : 'var(--border)'}`,
                    background: active ? m.bg : 'var(--surface)',
                    color: active ? m.color : 'var(--text-3)',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                    boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 228px', gap: 14, marginBottom: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <FieldRow
                label="Amount"
                focused={focusField === 'amount'}
                value={amount}
                mono
                placeholder={moneyPlaceholder()}
                onFocus={() => setFocusField('amount')}
              />
              <FieldRow
                label="Tip"
                focused={focusField === 'tip'}
                value={tip}
                mono
                placeholder={moneyPlaceholder()}
                onFocus={() => setFocusField('tip')}
              />
              <FieldRow
                label="Ref"
                focused={focusField === 'ref'}
                value={refNo}
                mono={false}
                placeholder="Reference…"
                onFocus={() => setFocusField('ref')}
              />
              <button
                type="button"
                onClick={addRow}
                onMouseDown={press}
                onMouseUp={release}
                style={{
                  marginTop: 4,
                  height: 42,
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.4,
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(107,0,0,0.2)',
                }}
              >
                ADD PAYMENT
              </button>
            </div>

            <div>
              <button
                type="button"
                onClick={useRemaining}
                style={{
                  width: '100%',
                  height: 36,
                  marginBottom: 8,
                  borderRadius: 10,
                  border: '1.5px solid var(--green-border)',
                  background: 'var(--green-bg)',
                  color: 'var(--green)',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Use Remaining
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {NUM_ROWS.flat().map((k) => (
                  <NumBtn key={k} label={k} onClick={() => appendKey(k)} press={press} release={release} />
                ))}
                <NumBtn label={<Delete size={15} />} onClick={backspace} press={press} release={release} />
                <NumBtn
                  label="C"
                  onClick={clearField}
                  press={press}
                  release={release}
                  style={{ background: 'var(--surface-2)', color: 'var(--text-3)' }}
                />
                <NumBtn
                  label="ADD"
                  onClick={addRow}
                  press={press}
                  release={release}
                  style={{
                    background: 'var(--purple-bg)',
                    borderColor: 'var(--purple-border)',
                    color: 'var(--purple)',
                    fontWeight: 800,
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              border: '1.5px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
              background: 'var(--surface)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                  {['#', 'Ref', 'Mode', 'Amount', 'Tip'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        fontWeight: 800,
                        fontSize: 10,
                        color: 'var(--text-3)',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{ padding: 28, textAlign: 'center', color: 'var(--text-4)', fontWeight: 600 }}
                    >
                      No payments added
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const selected = r.id === selectedId
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        style={{
                          background: selected ? 'var(--brand-bg)' : '#fff',
                          color: selected ? 'var(--brand)' : 'var(--text-1)',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{r.payerNo}</td>
                        <td
                          style={{
                            padding: '8px 10px',
                            maxWidth: 100,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.refNo || '—'}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            fontWeight: 700,
                            maxWidth: 100,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.payMode}
                        </td>
                        <td
                          style={{
                            padding: '8px 10px',
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 800,
                          }}
                        >
                          {fmtMoney(r.amount)}
                        </td>
                        <td style={{ padding: '8px 10px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {fmtMoney(r.tip)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <ActionBtn label="Remove Selected" onClick={removeSelected} press={press} release={release} />
            <ActionBtn label="Clear All" onClick={clearAll} press={press} release={release} variant="danger" />
          </div>

          {error && (
            <div
              style={{
                marginTop: 10,
                padding: '8px 12px',
                borderRadius: 10,
                background: 'var(--red-bg)',
                border: '1.5px solid var(--red-border)',
                color: 'var(--red)',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 20,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-2)',
            }}
          >
            <span>
              Paid{' '}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-1)' }}>
                {fmtMoney(billTotal)}
              </span>
            </span>
            <span>
              Tips{' '}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-1)' }}>
                {fmtMoney(tipTotal)}
              </span>
            </span>
            <span>
              Grand Total{' '}
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--green)',
                  fontWeight: 800,
                }}
              >
                {fmtMoney(grandTotal)}
              </span>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '12px 18px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}
        >
          <button
            type="button"
            onClick={done}
            disabled={!canDone}
            onMouseDown={press}
            onMouseUp={release}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 10,
              border: 'none',
              background: canDone
                ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`
                : 'var(--border)',
              color: canDone ? '#fff' : 'var(--text-4)',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: 0.5,
              cursor: canDone ? 'pointer' : 'not-allowed',
              boxShadow: canDone ? '0 4px 14px rgba(107,0,0,0.22)' : 'none',
            }}
          >
            Done
          </button>
          <button
            type="button"
            onClick={onClose}
            onMouseDown={press}
            onMouseUp={release}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 10,
              border: '1.5px solid var(--red-border)',
              background: 'var(--red-bg)',
              color: 'var(--red)',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldRow({
  label,
  focused,
  value,
  mono,
  placeholder,
  onFocus,
}: {
  label: string
  focused: boolean
  value: string
  mono: boolean
  placeholder: string
  onFocus: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          width: 58,
          flexShrink: 0,
          textAlign: 'right',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-2)',
        }}
      >
        {label}
      </span>
      <div
        onClick={onFocus}
        style={{
          flex: 1,
          height: 38,
          borderRadius: 8,
          boxSizing: 'border-box',
          border: `1.5px solid ${focused ? 'var(--brand-border)' : 'var(--border)'}`,
          background: focused ? 'var(--brand-bg)' : '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          fontSize: mono ? 15 : 12,
          fontWeight: mono ? 800 : 600,
          color: value ? 'var(--text-1)' : 'var(--text-4)',
          fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
          cursor: 'text',
        }}
      >
        {value || placeholder}
      </div>
    </div>
  )
}

function NumBtn({
  label,
  onClick,
  style = {},
  press,
  release,
}: {
  label: ReactNode
  onClick: () => void
  style?: CSSProperties
  press: (e: React.MouseEvent<HTMLButtonElement>) => void
  release: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const isText = typeof label === 'string'
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={press}
      onMouseUp={release}
      style={{
        height: 44,
        width: '100%',
        borderRadius: 10,
        border: '1.5px solid var(--border)',
        background: '#fff',
        color: 'var(--text-1)',
        fontSize: isText && label.length > 2 ? 11 : 16,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily:
          isText && label !== 'C' && label !== 'ADD' ? "'JetBrains Mono', monospace" : 'inherit',
        transition: 'all 0.1s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {label}
    </button>
  )
}

function ActionBtn({
  label,
  onClick,
  variant = 'default',
  press,
  release,
}: {
  label: string
  onClick: () => void
  variant?: 'default' | 'danger'
  press: (e: React.MouseEvent<HTMLButtonElement>) => void
  release: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  const styles =
    variant === 'danger'
      ? {
          background: 'var(--red-bg)',
          border: '1.5px solid var(--red-border)',
          color: 'var(--red)',
        }
      : {
          background: '#fff',
          border: '1.5px solid var(--border)',
          color: 'var(--text-2)',
        }
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={press}
      onMouseUp={release}
      style={{
        flex: 1,
        height: 38,
        borderRadius: 10,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: 0.3,
        cursor: 'pointer',
        transition: 'all 0.12s',
        ...styles,
      }}
    >
      {label}
    </button>
  )
}
