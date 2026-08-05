import { useEffect, useState } from 'react'
import { apiService } from '../../api/apiService'
import type { CreditCustomer } from '../../types/settlement'
import { fmtMoney } from '../../utils/posSession'

interface CreditCustomerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (customer: CreditCustomer) => void
}

export default function CreditCustomerDialog({
  open,
  onClose,
  onSelect,
}: CreditCustomerDialogProps) {
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<CreditCustomer[]>([])
  const [selected, setSelected] = useState(-1)

  useEffect(() => {
    if (!open) return
    setQ('')
    setSelected(-1)
    void load('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => void load(q), 300)
    return () => clearTimeout(t)
  }, [q, open])

  async function load(search: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await apiService.fetchCreditSettlementCustomers({
        search,
        limit: 50,
      })
      const mapped: CreditCustomer[] = data
        .map((r) => ({
          customerId: String(r.customerId ?? r.CustomerID ?? r.customer_id ?? ''),
          customerCode: String(r.customerCode ?? r.CustomerCode ?? r.customer_code ?? ''),
          customerName: String(r.customerName ?? r.CustomerName ?? r.customer_name ?? ''),
          osAmount: Number(r.osAmount ?? r.OSAmount ?? r.os_amount ?? 0) || 0,
          mobileNo: (r.mobileNo ?? r.MobileNo ?? r.mobile_no)?.toString(),
          telephone: (r.telephone ?? r.Telephone)?.toString(),
          address: (r.address ?? r.Address)?.toString(),
          taxRegNo: (r.taxRegNo ?? r.CustTRN ?? r.tax_reg_no)?.toString(),
        }))
        .filter((c) => c.customerId)
      setRows(mapped)
      setSelected(mapped.length ? 0 : -1)
    } catch (e) {
      setRows([])
      setSelected(-1)
      setError(e instanceof Error ? e.message : 'Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-salon-border">
          <h3 className="text-xl font-bold text-salon-primary">Select Credit Customer</h3>
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name / code / mobile"
            className="mt-3 w-full h-11 px-3 rounded-lg border-2 border-salon-border focus:border-salon-primary outline-none"
          />
        </div>

        <div className="flex-1 overflow-auto min-h-[240px]">
          {loading && <p className="p-4 text-salon-muted">Loading…</p>}
          {error && <p className="p-4 text-salon-danger">{error}</p>}
          {!loading && !error && rows.length === 0 && (
            <p className="p-4 text-salon-muted">No credit customers found</p>
          )}
          <ul>
            {rows.map((c, i) => (
              <li key={c.customerId}>
                <button
                  type="button"
                  onClick={() => setSelected(i)}
                  onDoubleClick={() => onSelect(c)}
                  className={[
                    'w-full text-left px-5 py-3 border-b border-salon-border',
                    selected === i ? 'bg-salon-primary-light' : 'hover:bg-salon-bg',
                  ].join(' ')}
                >
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-bold text-salon-text">{c.customerName}</div>
                      <div className="text-sm text-salon-muted">
                        {c.customerCode}
                        {c.mobileNo ? ` · ${c.mobileNo}` : ''}
                      </div>
                    </div>
                    <div className="font-semibold text-salon-primary">
                      O/S {fmtMoney(c.osAmount)}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-3 p-4 border-t border-salon-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-12 rounded-lg border-2 border-salon-border font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selected < 0}
            onClick={() => selected >= 0 && onSelect(rows[selected])}
            className="flex-1 h-12 rounded-lg bg-salon-primary text-white font-bold disabled:opacity-40"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  )
}
