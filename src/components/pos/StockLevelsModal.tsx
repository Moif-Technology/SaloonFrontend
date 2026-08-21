import { Layers, X } from 'lucide-react'
import { useState } from 'react'


type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

type StockRow = {
  id: string
  name: string
  currentStock: number
  minThreshold: number
}

const MOCK_STOCK: StockRow[] = [
  { id: '1', name: 'Keratin Shampoo', currentStock: 24, minThreshold: 10 },
  { id: '2', name: 'Vitamin C Serum', currentStock: 6, minThreshold: 8 },
  { id: '3', name: 'Nail Polish Remover', currentStock: 0, minThreshold: 5 },
  { id: '4', name: 'Hair Oil 100ml', currentStock: 18, minThreshold: 12 },
]

function getStockStatus(row: StockRow): StockStatus {
  if (row.currentStock <= 0) return 'Out of Stock'
  if (row.currentStock < row.minThreshold) return 'Low Stock'
  return 'In Stock'
}

function statusBadgeClass(status: StockStatus) {
  if (status === 'In Stock') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Low Stock') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100/80 text-rose-700'
}
export interface StockLevelsModalProps {
  open: boolean
  onClose: () => void
}

export default function StockLevelsModal({
  open,
  onClose,

}: StockLevelsModalProps) {
    const [rows, setRows] = useState(MOCK_STOCK)
  
    const totalProducts = rows.length
    const inStockCount = rows.filter((r) => getStockStatus(r) === 'In Stock').length
    const lowStockCount = rows.filter((r) => getStockStatus(r) === 'Low Stock').length
    function adjustStock(id: string, delta: number) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? { ...row, currentStock: Math.max(0, row.currentStock + delta) }
              : row,
          ),
        )
      }
      
      function restock(id: string) {
        setRows((prev) =>
          prev.map((row) =>
            row.id === id
              ? {
                  ...row,
                  currentStock: Math.max(row.currentStock, row.minThreshold) + 10,
                }
              : row,
          ),
        )
      }
    if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-levels-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 flex-col gap-3 border-b border-salon-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
                <Layers size={22} />
              </span>
              <div className="min-w-0">
                <h2
                  id="stock-levels-title"
                  className="text-xl font-bold text-salon-text"
                >
                  Stock Levels
                </h2>
                <p className="mt-0.5 text-sm font-medium text-salon-muted">
                  Monitor current stock quantities and low-stock alerts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </header>

      

<div className="min-h-0 flex-1 overflow-auto px-5 py-4">
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
    <div className="rounded-xl border border-salon-border bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        Total Products
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-salon-text">
  {totalProducts}
</p>
    </div>
    <div className="rounded-xl border border-salon-border bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        In Stock
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600">
  {inStockCount}
</p>
    </div>
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
        Low Stock Alerts
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-amber-700">
  {lowStockCount}
</p>
    </div>
    </div>

<div className="mt-4 overflow-x-auto rounded-xl border border-salon-border bg-white">
  <table className="w-full min-w-[640px] border-collapse text-left text-sm">
    <thead>
      <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        <th className="px-3 py-2">Product Name</th>
        <th className="px-3 py-2">Current Stock</th>
        <th className="px-3 py-2">Minimum Threshold</th>
        <th className="px-3 py-2">Status</th>
        <th className="px-3 py-2 text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => {
        const status = getStockStatus(row)
        return (
          <tr key={row.id} className="border-b border-salon-border text-salon-text">
            <td className="px-3 py-2.5 font-medium">{row.name}</td>
            <td className="px-3 py-2.5 tabular-nums">{row.currentStock}</td>
            <td className="px-3 py-2.5 tabular-nums text-salon-muted">
              {row.minThreshold}
            </td>
            <td className="px-3 py-2.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(status)}`}
              >
                {status}
              </span>
            </td>
            <td className="px-3 py-2.5">
  <div className="flex justify-end gap-1.5">
    <button
      type="button"
      onClick={() => adjustStock(row.id, -1)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-salon-border text-sm font-semibold text-salon-text hover:bg-black/5"
      aria-label={`Decrease ${row.name} stock`}
    >
      −
    </button>
    <button
      type="button"
      onClick={() => adjustStock(row.id, 1)}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-salon-border text-sm font-semibold text-salon-text hover:bg-black/5"
      aria-label={`Increase ${row.name} stock`}
    >
      +
    </button>
    <button
      type="button"
      onClick={() => restock(row.id)}
      className="inline-flex h-8 items-center rounded-lg bg-[#6b1d2f] px-2.5 text-[11px] font-semibold text-white hover:opacity-90"
    >
      Restock
    </button>
  </div>
</td>
          </tr>
        )
      })}
    </tbody>
  </table>
</div>
</div>
      </div>
    </div>
  )
}