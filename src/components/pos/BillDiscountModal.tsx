/**
 * Bill Discount modal — Counter-pos BillDiscountModal design + behaviour.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Percent, X } from 'lucide-react'
import {
  billDiscountInitialState,
  billTaxableBeforeDiscount,
  previewBillDiscount,
  resolveDiscountOnTaxable,
} from '../../lib/discountCalc'
import type { BillItem } from '../../types/pos'
import DiscountEntryPanel from './DiscountEntryPanel'

const BRAND = '#790728'
const BRAND2 = '#5c0520'

interface BillDiscountModalProps {
  open: boolean
  items: BillItem[]
  billDiscountAmt: number
  onApply: (amount: number) => void
  onClose: () => void
}

export default function BillDiscountModal({
  open,
  items,
  billDiscountAmt,
  onApply,
  onClose,
}: BillDiscountModalProps) {
  const taxableBase = useMemo(() => billTaxableBeforeDiscount(items), [items])
  const initial = useMemo(
    () => billDiscountInitialState(taxableBase, billDiscountAmt),
    [taxableBase, billDiscountAmt],
  )

  const [mode, setMode] = useState<'pct' | 'amt'>(initial.mode)
  const [discPct, setDiscPct] = useState(initial.discPct)
  const [discAmt, setDiscAmt] = useState(initial.discAmt)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const next = billDiscountInitialState(taxableBase, billDiscountAmt)
    setMode(next.mode)
    setDiscPct(next.discPct)
    setDiscAmt(next.discAmt)
  }, [open, taxableBase, billDiscountAmt])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !items.length) return null

  const preview = previewBillDiscount(items, mode, discPct, discAmt)
  const displayPct = mode === 'pct' ? discPct : preview.pct ? String(preview.pct) : ''
  const displayAmt = mode === 'amt' ? discAmt : preview.discountAmt ? String(preview.discountAmt) : ''

  function handleKey(k: string) {
    if (k === 'C') {
      if (mode === 'pct') setDiscPct('')
      else setDiscAmt('')
      return
    }
    if (k === '⌫') {
      if (mode === 'pct') setDiscPct((v) => v.slice(0, -1))
      else setDiscAmt((v) => v.slice(0, -1))
      return
    }
    if (k === '.' && (mode === 'pct' ? discPct : discAmt).includes('.')) return

    if (mode === 'pct') {
      const next = discPct + k
      if (parseFloat(next) > 100) return
      setDiscPct(next)
    } else {
      const next = discAmt + k
      if (parseFloat(next) > Math.abs(taxableBase)) return
      setDiscAmt(next)
    }
  }

  function applyPreset(p: number) {
    setMode('pct')
    setDiscPct(String(p))
    setDiscAmt('')
  }

  function handleDone() {
    const { discountAmt } = resolveDiscountOnTaxable(
      taxableBase,
      mode,
      mode === 'pct' ? discPct : displayPct,
      mode === 'amt' ? discAmt : displayAmt,
    )
    onApply(discountAmt)
    onClose()
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
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
      }}
    >
      <style>{`
        @media (max-width: 600px) {
          .dc-body { flex-direction: column !important; }
          .dc-left { border-right: none !important; border-bottom: 1px solid #dbd9d2 !important; }
          .dc-right { width: 100% !important; }
        }
      `}</style>

      <div
        style={{
          width: 600,
          maxWidth: '96vw',
          maxHeight: '90vh',
          background: '#fff',
          borderRadius: 24,
          boxShadow: '0 28px 72px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND2} 100%)`,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
              <Percent size={16} color="#fff" />
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
                Bill
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#fff',
                  lineHeight: 1,
                  margin: 0,
                }}
              >
                Bill Discount
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

        <DiscountEntryPanel
          contextLabel={`${items.length} item${items.length !== 1 ? 's' : ''} on bill`}
          contextHint="Bill discount on taxable total (before VAT)."
          taxableBefore={taxableBase}
          discountAmt={preview.discountAmt}
          taxableAfter={preview.netTaxable}
          totalWithVat={preview.grossTotal}
          totalLabel="Bill total (incl. VAT)"
          mode={mode}
          setMode={setMode}
          displayPct={displayPct}
          displayAmt={displayAmt}
          onKey={handleKey}
          applyPreset={applyPreset}
          onClear={() => {
            setDiscPct('')
            setDiscAmt('')
          }}
          onDone={handleDone}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
