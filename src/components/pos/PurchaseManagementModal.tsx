import { Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { useSnackbar } from '../../context/SnackbarContext'

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

type NewPOItem = {
  name: string
  qty: string
  unitCost: string
}

type FormErrors = {
  supplier?: string
  items?: string
  expectedTotalCost?: string
}

export interface PurchaseManagementModalProps {
  open: boolean
  onClose: () => void

  /**
   * Called when a purchase order changes to Delivered.
   * The parent inventory page should use this callback
   * to increase stock quantities.
   */
  onInventoryStockUpdate?: (items: InvoiceItem[]) => void
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
  if (status === 'Ordered') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'Shipped') {
    return 'bg-sky-100 text-sky-700'
  }

  return 'bg-emerald-100 text-emerald-700'
}

const EMPTY_ITEM: NewPOItem = {
  name: '',
  qty: '',
  unitCost: '',
}

export default function PurchaseManagementModal({
  open,
  onClose,
  onInventoryStockUpdate,
}: PurchaseManagementModalProps) {
  const { showSnackbar } = useSnackbar()

  const [orders, setOrders] =
    useState<PurchaseOrderRow[]>(MOCK_ORDERS)

  const [selectedPo, setSelectedPo] =
    useState<PurchaseOrderRow | null>(null)

  const [isCreatePoOpen, setIsCreatePoOpen] =
    useState(false)

  const [supplierName, setSupplierName] =
    useState('')

  const [expectedTotalCost, setExpectedTotalCost] =
    useState('')

  const [newItems, setNewItems] =
    useState<NewPOItem[]>([
      { ...EMPTY_ITEM },
    ])

  const [formErrors, setFormErrors] =
    useState<FormErrors>({})
    const [deleteItemIndex, setDeleteItemIndex] =
    useState<number | null>(null)
  const canAddItem = newItems.every(
    (item) =>
      item.name.trim() &&
      item.qty &&
      Number(item.qty) > 0 &&
      item.unitCost &&
      Number(item.unitCost) >= 0,
  )

  function resetCreateForm() {
    setSupplierName('')
    setExpectedTotalCost('')
    setNewItems([{ ...EMPTY_ITEM }])
    setFormErrors({})
  }

  function closeCreateModal() {
    resetCreateForm()
    setIsCreatePoOpen(false)
  }

  function addItemRow() {
    if (!canAddItem) {
      setFormErrors((prev) => ({
        ...prev,
        items:
          'Complete all item fields before adding another item.',
      }))

      return
    }

    setFormErrors((prev) => ({
      ...prev,
      items: undefined,
    }))

    setNewItems((prev) => [
      ...prev,
      { ...EMPTY_ITEM },
    ])
  }

  function removeItemRow(index: number) {
    if (newItems.length === 1) {
      return
    }
  
    setDeleteItemIndex(index)
  }
  
  function confirmDeleteItem() {
    if (deleteItemIndex === null) {
      return
    }
  
    const itemName = newItems[deleteItemIndex]?.name.trim()
  
    setNewItems((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== deleteItemIndex),
    )
  
    setFormErrors((prev) => ({
      ...prev,
      items: undefined,
    }))
  
    setDeleteItemIndex(null)
  
    showSnackbar(
      itemName
        ? `Item "${itemName}" deleted successfully`
        : 'Item deleted successfully',
      'success',
    )
  }

  function updateItem(
    index: number,
    field: keyof NewPOItem,
    value: string,
  ) {
    setNewItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    )

    setFormErrors((prev) => ({
      ...prev,
      items: undefined,
    }))
  }

  function getNextPoNumber() {
    const highestNumber = orders.reduce(
      (highest, order) => {
        const number = Number(
          order.poNumber.replace('PO-', ''),
        )

        return Number.isNaN(number)
          ? highest
          : Math.max(highest, number)
      },
      1000,
    )

    return `PO-${highestNumber + 1}`
  }

  function handleCreatePurchaseOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormErrors({})

    if (!supplierName.trim()) {
      setFormErrors({
        supplier: 'Supplier name is required.',
      })
      return
    }

    const hasInvalidItem = newItems.some(
      (item) =>
        !item.name.trim() ||
        !item.qty ||
        Number(item.qty) <= 0 ||
        !item.unitCost ||
        Number(item.unitCost) < 0,
    )

    if (hasInvalidItem) {
      setFormErrors({
        items: 'Complete all item fields before creating the purchase order.',
      })
      return
    }

    const totalCost = Number(expectedTotalCost)
    if (!expectedTotalCost || totalCost <= 0) {
      setFormErrors({
        expectedTotalCost: 'Expected total cost is required.',
      })
      return
    }

    const newOrder: PurchaseOrderRow = {
      poNumber: getNextPoNumber(),
      supplierName: supplierName.trim(),
      orderDate: new Date().toISOString().slice(0, 10),
      totalCost,
      status: 'Ordered',
      items: newItems.map((item) => ({
        name: item.name.trim(),
        qty: Number(item.qty),
        unitCost: Number(item.unitCost),
      })),
    }

    setOrders((prev) => [newOrder, ...prev])
    closeCreateModal()

    showSnackbar(
      `Purchase Order ${newOrder.poNumber} created successfully!`,
      'success',
    )
  }

  function handleStatusChange(
    poNumber: string,
    status: DeliveryStatus,
  ) {
    const currentOrder = orders.find(
      (order) =>
        order.poNumber === poNumber,
    )

    if (!currentOrder) {
      return
    }

    const isNewlyDelivered =
      currentOrder.status !== 'Delivered' &&
      status === 'Delivered'

    setOrders((prev) =>
      prev.map((row) =>
        row.poNumber === poNumber
          ? {
              ...row,
              status,
            }
          : row,
      ),
    )

    setSelectedPo((prev) =>
      prev?.poNumber === poNumber
        ? {
            ...prev,
            status,
          }
        : prev,
    )

    if (isNewlyDelivered) {
      onInventoryStockUpdate?.(
        currentOrder.items,
      )

      showSnackbar(
        'Order delivered and inventory stock updated',
        'success',
      )
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-management-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">

        {/* MAIN HEADER */}
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
                onClick={() =>
                  setIsCreatePoOpen(true)
                }
                className="h-9 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white transition hover:opacity-90"
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

        {/* PO TABLE */}
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
                    onClick={() =>
                      setSelectedPo(row)
                    }
                    className="cursor-pointer border-b border-salon-border text-salon-text hover:bg-salon-surface"
                  >
                    <td className="px-3 py-2.5 font-medium tabular-nums">
                      {row.poNumber}
                    </td>
                    <td className="px-3 py-2.5">
                      {row.supplierName}
                    </td>
                    <td className="px-3 py-2.5 text-salon-muted">
                      {row.orderDate}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      ₹
                      {row.totalCost.toLocaleString(
                        'en-IN',
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                          row.status,
                        )}`}
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

        {/* CREATE PURCHASE ORDER MODAL */}
        {isCreatePoOpen && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <form
              onSubmit={handleCreatePurchaseOrder}
              className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* CREATE PO HEADER */}
              <div className="flex items-center justify-between border-b border-salon-border px-5 py-4">
                <div>
                  <h3 className="text-lg font-bold text-salon-text">
                    Create Purchase Order
                  </h3>
                  <p className="mt-0.5 text-sm text-salon-muted">
                    Add supplier and purchase items
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
                  aria-label="Close create purchase order"
                >
                  <X size={20} />
                </button>
              </div>

              {/* CREATE PO BODY */}
              <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
                {/* SUPPLIER */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-salon-muted">
                    Supplier Name
                  </label>
                  <input
                    value={supplierName}
                    onChange={(e) => {
                      setSupplierName(e.target.value)
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => ({
                          ...prev,
                          supplier: undefined,
                        }))
                      }
                    }}
                    placeholder="Enter supplier name"
                    className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-salon-text outline-none focus:border-salon-primary ${
                      formErrors.supplier
                        ? 'border-red-400'
                        : 'border-salon-border'
                    }`}
                  />
                  {formErrors.supplier && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {formErrors.supplier}
                    </p>
                  )}
                </div>

                {/* ITEMS */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <label className="text-xs font-semibold uppercase text-salon-muted">
                        Purchase Items
                      </label>
                      {formErrors.items && (
                        <p className="mt-1 text-xs font-medium text-red-600">
                          {formErrors.items}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={addItemRow}
                      disabled={!canAddItem}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-salon-border px-3 py-1.5 text-xs font-semibold text-salon-primary hover:bg-salon-surface disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus size={14} />
                      Add Item
                    </button>
                  </div>

                  <div className="space-y-2">
                    {newItems.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[1fr_90px_110px_36px] gap-2"
                      >
                        <input
                          value={item.name}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'name',
                              e.target.value,
                            )
                          }
                          placeholder="Item name"
                          className={`h-10 rounded-xl border px-3 text-sm outline-none focus:border-salon-primary ${
                            formErrors.items &&
                            !item.name.trim()
                              ? 'border-red-400'
                              : 'border-salon-border'
                          }`}
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'qty',
                              e.target.value,
                            )
                          }
                          placeholder="Qty"
                          className={`h-10 rounded-xl border px-3 text-sm outline-none focus:border-salon-primary ${
                            formErrors.items &&
                            (!item.qty ||
                              Number(item.qty) <= 0)
                              ? 'border-red-400'
                              : 'border-salon-border'
                          }`}
                        />
                        <input
                          type="number"
                          min="0"
                          value={item.unitCost}
                          onChange={(e) =>
                            updateItem(
                              index,
                              'unitCost',
                              e.target.value,
                            )
                          }
                          placeholder="Unit cost"
                          className={`h-10 rounded-xl border px-3 text-sm outline-none focus:border-salon-primary ${
                            formErrors.items &&
                            (!item.unitCost ||
                              Number(item.unitCost) < 0)
                              ? 'border-red-400'
                              : 'border-salon-border'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            removeItemRow(index)
                          }
                          className="flex h-10 w-9 items-center justify-center rounded-xl text-salon-muted hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXPECTED TOTAL */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase text-salon-muted">
                    Expected Total Cost (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={expectedTotalCost}
                    onChange={(e) => {
                      setExpectedTotalCost(e.target.value)
                      if (Number(e.target.value) > 0) {
                        setFormErrors((prev) => ({
                          ...prev,
                          expectedTotalCost: undefined,
                        }))
                      }
                    }}
                    placeholder="Enter expected total cost"
                    className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-salon-text outline-none focus:border-salon-primary ${
                      formErrors.expectedTotalCost
                        ? 'border-red-400'
                        : 'border-salon-border'
                    }`}
                  />
                  {formErrors.expectedTotalCost && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {formErrors.expectedTotalCost}
                    </p>
                  )}
                </div>
              </div>

              {/* CREATE PO FOOTER */}
              <div className="flex shrink-0 justify-end gap-2 border-t border-salon-border px-5 py-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="h-10 rounded-xl border border-salon-border px-4 text-sm font-semibold text-salon-text hover:bg-salon-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 rounded-xl bg-[#6b1d2f] px-5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        )}
{deleteItemIndex !== null && (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4">
    <div
      className="w-full max-w-sm rounded-2xl border border-salon-border bg-white p-5 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-salon-text">
          Delete Item
        </h3>

        <p className="mt-1.5 text-sm text-salon-muted">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-salon-text">
            {newItems[deleteItemIndex]?.name.trim()
              ? `"${newItems[deleteItemIndex].name.trim()}"`
              : 'this item'}
          </span>
          ?
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setDeleteItemIndex(null)}
          className="h-9 rounded-xl border border-salon-border px-4 text-sm font-semibold text-salon-text transition hover:bg-salon-surface"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={confirmDeleteItem}
          className="h-9 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
)}
        {/* INVOICE / PO DETAILS MODAL */}
        {selectedPo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-6">
            <div
              className="max-h-full w-full max-w-md overflow-auto rounded-2xl border border-salon-border bg-white p-6 shadow-xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-salon-text">
                  Invoice — {selectedPo.poNumber}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPo(null)
                  }
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
                    <tr
                      key={item.name}
                      className="border-b border-salon-border"
                    >
                      <td className="py-2 font-medium">
                        {item.name}
                      </td>
                      <td className="py-2 tabular-nums">
                        {item.qty}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        ₹
                        {(
                          item.qty * item.unitCost
                        ).toLocaleString('en-IN')}
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

              {selectedPo.status === 'Delivered' && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                  Inventory stock has been synchronized for this delivered order.
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}