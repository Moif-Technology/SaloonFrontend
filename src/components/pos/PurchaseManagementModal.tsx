import { ShoppingCart, X } from 'lucide-react'
import { useState } from 'react'

type DeliveryStatus = 'Ordered' | 'Shipped' | 'Delivered'
type InvoiceItem = {
    name: string
    qty: number
    unitCost: number
  }
  
  type PurchaseOrderRow = {
    poNumber: string
    supplierName: string
    orderDate: string
    totalCost: number
    status: DeliveryStatus
    items: InvoiceItem[]
  }
  
  const MOCK_ORDERS: PurchaseOrderRow[] = [
    {
      poNumber: 'PO-1001',
      supplierName: 'BeautySupply Co',
      orderDate: '2026-08-18',
      totalCost: 12500,
      status: 'Ordered',
      items: [
        { name: 'Keratin Shampoo', qty: 10, unitCost: 450 },
        { name: 'Hair Mask', qty: 20, unitCost: 400 },
      ],
    },
    {
      poNumber: 'PO-1002',
      supplierName: 'Salon Essentials',
      orderDate: '2026-08-15',
      totalCost: 8400,
      status: 'Shipped',
      items: [
        { name: 'Vitamin C Serum', qty: 12, unitCost: 700 },
      ],
    },
    {
      poNumber: 'PO-1003',
      supplierName: 'HairCare Distributors',
      orderDate: '2026-08-10',
      totalCost: 15600,
      status: 'Delivered',
      items: [
        { name: 'Hair Oil 100ml', qty: 24, unitCost: 350 },
        { name: 'Styling Gel', qty: 30, unitCost: 240 },
      ],
    },
  ]

function statusBadgeClass(status: DeliveryStatus) {
  if (status === 'Ordered') return 'bg-amber-100 text-amber-700'
  if (status === 'Shipped') return 'bg-sky-100 text-sky-700'
  return 'bg-emerald-100 text-emerald-700'
}



export interface PurchaseManagementModalProps {
  open: boolean
  onClose: () => void
}

export default function PurchaseManagementModal({
  open,
  onClose,
}: PurchaseManagementModalProps) {
    const [orders, setOrders] = useState(MOCK_ORDERS)
    const [selectedPo, setSelectedPo] = useState<PurchaseOrderRow | null>(null)
  
    function handleStatusChange(poNumber: string, status: DeliveryStatus) {
      setOrders((prev) =>
        prev.map((row) => (row.poNumber === poNumber ? { ...row, status } : row)),
      )
      setSelectedPo((prev) =>
        prev?.poNumber === poNumber ? { ...prev, status } : prev,
      )
    }
  
    if (!open) return null


  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-management-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 flex-col gap-3 border-b border-salon-border px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
                <ShoppingCart size={22} />
              </span>
              <div className="min-w-0">
                <h2
                  id="purchase-management-title"
                  className="text-xl font-bold text-salon-text"
                >
                  Purchase Management
                </h2>
                <p className="mt-0.5 text-sm font-medium text-salon-muted">
                  Track supplier purchase orders and deliveries
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="h-9 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white hover:opacity-90"
              >
                Create Purchase Order
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
  <div className="overflow-x-auto rounded-xl border border-salon-border bg-white">
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
          <th className="px-3 py-2">PO Number</th>
          <th className="px-3 py-2">Supplier Name</th>
          <th className="px-3 py-2">Order Date</th>
          <th className="px-3 py-2">Total Cost</th>
          <th className="px-3 py-2">Delivery Status</th>
        </tr>
      </thead>
      <tbody>
      {orders.map((row) => (
  <tr
    key={row.poNumber}
    onClick={() => setSelectedPo(row)}
    className="cursor-pointer border-b border-salon-border text-salon-text hover:bg-salon-surface"
  >
            <td className="px-3 py-2.5 font-medium tabular-nums">{row.poNumber}</td>
            <td className="px-3 py-2.5">{row.supplierName}</td>
            <td className="px-3 py-2.5 text-salon-muted">{row.orderDate}</td>
            <td className="px-3 py-2.5 tabular-nums">
              ₹{row.totalCost.toLocaleString('en-IN')}
            </td>
            <td className="px-3 py-2.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
              >
                {row.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
</div>

        {selectedPo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6">
            <div className="max-h-full w-full max-w-md overflow-auto rounded-2xl border border-salon-border bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-salon-text">
                  Invoice — {selectedPo.poNumber}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedPo(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
                  aria-label="Close details"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mb-3 text-sm text-salon-muted">
                {selectedPo.supplierName} · {selectedPo.orderDate}
              </p>

              <table className="mb-4 w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-salon-border text-[11px] font-bold uppercase text-salon-muted">
                    <th className="py-1.5">Item</th>
                    <th className="py-1.5">Qty</th>
                    <th className="py-1.5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPo.items.map((item) => (
                    <tr key={item.name} className="border-b border-salon-border">
                      <td className="py-2 font-medium">{item.name}</td>
                      <td className="py-2 tabular-nums">{item.qty}</td>
                      <td className="py-2 text-right tabular-nums">
                        ₹{(item.qty * item.unitCost).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <label className="mb-1 block text-xs font-semibold uppercase text-salon-muted">
                Delivery Status
              </label>
              <select
                value={selectedPo.status}
                onChange={(e) =>
                  handleStatusChange(
                    selectedPo.poNumber,
                    e.target.value as DeliveryStatus,
                  )
                }
                className="h-10 w-full rounded-xl border border-salon-border bg-white px-3 text-sm font-medium text-salon-text"
              >
                <option value="Ordered">Ordered</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>
        )}

      </div>
    </div>
  )

}