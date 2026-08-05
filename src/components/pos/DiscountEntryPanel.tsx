/**
 * Shared discount keypad + summary — Counter-pos DiscountEntryPanel.
 */
import type { CSSProperties, ReactNode } from 'react'
import { Percent, XCircle } from 'lucide-react'
import { moneyPlaceholder } from '../../lib/discountCalc'
import { fmtMoney } from '../../utils/posSession'

const BRAND = '#790728'
const BRAND2 = '#5c0520'

function SummaryRow({
  label,
  value,
  highlight,
  muted,
  minus,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
  minus?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 0',
        borderBottom: highlight ? 'none' : '1px dashed #dbd9d2',
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: muted ? '#b3b0a8' : highlight ? BRAND : '#8c8980',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: highlight ? 16 : 13,
          fontWeight: highlight ? 900 : 700,
          color: minus ? '#b45309' : highlight ? BRAND : '#17150f',
          fontFamily: "ui-monospace, 'Cascadia Code', monospace",
        }}
      >
        {minus && value !== fmtMoney(0) ? `− ${value}` : value}
      </span>
    </div>
  )
}

export interface DiscountEntryPanelProps {
  contextLabel?: string
  contextHint?: string
  taxableBefore: number
  discountAmt: number
  taxableAfter: number
  totalWithVat: number
  totalLabel?: string
  mode: 'pct' | 'amt'
  setMode: (m: 'pct' | 'amt') => void
  displayPct: string
  displayAmt: string
  onKey: (k: string) => void
  applyPreset: (p: number) => void
  onClear: () => void
  onDone: () => void
  onClose: () => void
}

export default function DiscountEntryPanel({
  contextLabel,
  contextHint,
  taxableBefore,
  discountAmt,
  taxableAfter,
  totalWithVat,
  totalLabel = 'Total (incl. VAT)',
  mode,
  setMode,
  displayPct,
  displayAmt,
  onKey,
  applyPreset,
  onClear,
  onDone,
  onClose,
}: DiscountEntryPanelProps) {
  const press = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(0.91)'
  }
  const release = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.transform = 'scale(1)'
  }

  function NumBtn({
    label,
    keyVal,
    flex = 1,
    style = {},
    onClick,
  }: {
    label: ReactNode
    keyVal?: string
    flex?: number
    style?: CSSProperties
    onClick?: () => void
  }) {
    return (
      <button
        type="button"
        onClick={onClick ?? (() => onKey(keyVal ?? String(label)))}
        onMouseDown={press}
        onMouseUp={release}
        style={{
          flex,
          height: 48,
          borderRadius: 10,
          border: '1.5px solid #dbd9d2',
          background: '#fff',
          color: '#17150f',
          fontSize: 17,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.1s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'inherit',
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!style.background) {
            e.currentTarget.style.background = '#fff2f2'
            e.currentTarget.style.borderColor = '#f5b8b8'
            e.currentTarget.style.color = BRAND
          } else {
            e.currentTarget.style.filter = 'brightness(0.92)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'brightness(1)'
          if (!style.background) {
            e.currentTarget.style.background = '#fff'
            e.currentTarget.style.borderColor = '#dbd9d2'
            e.currentTarget.style.color = '#17150f'
          }
        }}
      >
        {label}
      </button>
    )
  }

  const tabStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    height: 36,
    borderRadius: 8,
    border: 'none',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    background: active ? BRAND : '#edece8',
    color: active ? '#fff' : '#8c8980',
    transition: 'all 0.12s',
  })

  const inputValue =
    mode === 'pct' ? displayPct || moneyPlaceholder() : displayAmt || moneyPlaceholder()

  return (
    <div className="dc-body" style={{ display: 'flex', overflow: 'hidden' }}>
      <div
        className="dc-left"
        style={{
          flex: 1,
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          borderRight: '1px solid #dbd9d2',
        }}
      >
        {contextLabel && (
          <div
            style={{
              padding: '9px 12px',
              borderRadius: 10,
              background: '#fff2f2',
              border: '1.5px solid #f5b8b8',
              fontSize: 12,
              fontWeight: 800,
              color: BRAND,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {contextLabel}
          </div>
        )}

        {contextHint && (
          <p
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#b3b0a8',
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {contextHint}
          </p>
        )}

        <div
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            background: '#edece8',
            border: '1.5px solid #dbd9d2',
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#b3b0a8',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Summary
          </div>
          <SummaryRow label="Taxable (before discount)" value={fmtMoney(taxableBefore)} />
          <SummaryRow label="Discount" value={fmtMoney(discountAmt)} minus muted />
          <div
            style={{
              margin: '8px 0',
              padding: '8px 10px',
              borderRadius: 8,
              background: '#fff2f2',
              border: '1.5px solid #f5b8b8',
            }}
          >
            <SummaryRow
              label="Taxable (after discount)"
              value={fmtMoney(taxableAfter)}
              highlight
            />
          </div>
          <SummaryRow label={totalLabel} value={fmtMoney(totalWithVat)} />
        </div>

        <div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: '#b3b0a8',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            Enter discount
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <button type="button" onClick={() => setMode('pct')} style={tabStyle(mode === 'pct')}>
              By %
            </button>
            <button type="button" onClick={() => setMode('amt')} style={tabStyle(mode === 'amt')}>
              By Amount
            </button>
          </div>
          <div
            style={{
              height: 52,
              borderRadius: 10,
              border: '2px solid #fcd34d',
              background: '#fffbeb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '0 14px',
            }}
          >
            <Percent
              size={16}
              color="#b45309"
              style={{ flexShrink: 0, opacity: mode === 'pct' ? 1 : 0.35 }}
            />
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: 22,
                fontWeight: 900,
                color: '#b45309',
                fontFamily: "ui-monospace, 'Cascadia Code', monospace",
              }}
            >
              {inputValue}
            </span>
            {mode === 'pct' && (
              <span style={{ fontSize: 18, fontWeight: 800, color: '#b45309', flexShrink: 0 }}>
                %
              </span>
            )}
          </div>
          {mode === 'pct' && displayAmt ? (
            <p
              style={{
                fontSize: 10,
                color: '#b3b0a8',
                margin: '6px 0 0',
                textAlign: 'center',
                minHeight: 14,
              }}
            >
              = {fmtMoney(discountAmt)} off taxable
            </p>
          ) : mode === 'amt' && displayPct ? (
            <p
              style={{
                fontSize: 10,
                color: '#b3b0a8',
                margin: '6px 0 0',
                textAlign: 'center',
                minHeight: 14,
              }}
            >
              = {displayPct}% of taxable
            </p>
          ) : (
            <p style={{ minHeight: 20, margin: '6px 0 0' }} />
          )}
        </div>
      </div>

      <div
        className="dc-right"
        style={{
          width: 252,
          flexShrink: 0,
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {(
          [
            { digits: ['7', '8', '9'], preset: 5 },
            { digits: ['4', '5', '6'], preset: 10 },
            { digits: ['1', '2', '3'], preset: 25 },
          ] as const
        ).map(({ digits, preset }) => (
          <div key={preset} style={{ display: 'flex', gap: 5 }}>
            {digits.map((d) => (
              <NumBtn key={d} label={d} />
            ))}
            {mode === 'pct' ? (
              <NumBtn
                label={`${preset}%`}
                onClick={() => applyPreset(preset)}
                style={{
                  background: '#fffbeb',
                  borderColor: '#fcd34d',
                  color: '#b45309',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              />
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 5 }}>
          <NumBtn label="0" />
          <NumBtn label="." />
          <NumBtn
            label={<XCircle size={17} />}
            onClick={onClear}
            style={{ background: '#edece8', borderColor: '#dbd9d2', color: '#8c8980' }}
          />
          <NumBtn
            label="Cancel"
            onClick={onClose}
            style={{
              background: '#fef2f2',
              borderColor: '#fecaca',
              color: '#dc2626',
              fontSize: 10,
              fontWeight: 800,
            }}
          />
        </div>

        <button
          type="button"
          onClick={onDone}
          onMouseDown={press}
          onMouseUp={release}
          style={{
            height: 50,
            borderRadius: 10,
            border: 'none',
            marginTop: 4,
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`,
            color: '#fff',
            fontSize: 15,
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(121,7,40,0.22)',
          }}
        >
          Done
        </button>
      </div>
    </div>
  )
}
