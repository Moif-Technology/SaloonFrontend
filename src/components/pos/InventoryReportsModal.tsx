import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  Download,
  Warehouse,
  Search,
  X,
  Printer,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface InventoryReportsModalProps {
  open: boolean
  onClose: () => void
}

type InventoryReportRow = {
  id: string
  itemName: string
  category: string
  stockIn: number
  stockOut: number
  currentStock: number
  unitCost: number
  reorderLevel: number
}

type AuditAction = 'export' | 'audit'

const MOCK_INVENTORY_REPORTS: InventoryReportRow[] = [
  {
    id: '1',
    itemName: 'Shampoo',
    category: 'Hair Care',
    stockIn: 120,
    stockOut: 82,
    currentStock: 38,
    unitCost: 320,
    reorderLevel: 15,
  },
  {
    id: '2',
    itemName: 'Hair Conditioner',
    category: 'Hair Care',
    stockIn: 100,
    stockOut: 88,
    currentStock: 12,
    unitCost: 280,
    reorderLevel: 20,
  },
  {
    id: '3',
    itemName: 'Hair Serum',
    category: 'Hair Care',
    stockIn: 75,
    stockOut: 60,
    currentStock: 15,
    unitCost: 450,
    reorderLevel: 15,
  },
  {
    id: '4',
    itemName: 'Face Cleanser',
    category: 'Skin Care',
    stockIn: 80,
    stockOut: 52,
    currentStock: 28,
    unitCost: 380,
    reorderLevel: 15,
  },
  {
    id: '5',
    itemName: 'Facial Mask',
    category: 'Skin Care',
    stockIn: 60,
    stockOut: 55,
    currentStock: 5,
    unitCost: 520,
    reorderLevel: 10,
  },
  {
    id: '6',
    itemName: 'Nail Polish',
    category: 'Nail Care',
    stockIn: 150,
    stockOut: 150,
    currentStock: 0,
    unitCost: 180,
    reorderLevel: 20,
  },
  {
    id: '7',
    itemName: 'Body Lotion',
    category: 'Body Care',
    stockIn: 90,
    stockOut: 64,
    currentStock: 26,
    unitCost: 420,
    reorderLevel: 15,
  },
  {
    id: '8',
    itemName: 'Massage Oil',
    category: 'Spa',
    stockIn: 70,
    stockOut: 58,
    currentStock: 12,
    unitCost: 650,
    reorderLevel: 15,
  },
  {
    id: '9',
    itemName: 'Disposable Gloves',
    category: 'Consumables',
    stockIn: 500,
    stockOut: 340,
    currentStock: 160,
    unitCost: 8,
    reorderLevel: 50,
  },
  {
    id: '10',
    itemName: 'Wax Beans',
    category: 'Waxing',
    stockIn: 100,
    stockOut: 72,
    currentStock: 28,
    unitCost: 350,
    reorderLevel: 20,
  },
]

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

function getStockStatus(
  item: InventoryReportRow,
): 'out' | 'low' | 'healthy' {
  if (item.currentStock === 0) {
    return 'out'
  }

  if (item.currentStock <= item.reorderLevel) {
    return 'low'
  }

  return 'healthy'
}

export default function InventoryReportsModal({
  open,
  onClose,
}: InventoryReportsModalProps) {
  const { showSnackbar } = useSnackbar()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<AuditAction | null>(null)

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          MOCK_INVENTORY_REPORTS.map(
            (item) => item.category,
          ),
        ),
      ),
    ]
  }, [])

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return MOCK_INVENTORY_REPORTS.filter((item) => {
      const matchesSearch =
        !query ||
        item.itemName.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)

      const status = getStockStatus(item)

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Low Stock' && status === 'low') ||
        (statusFilter === 'Out of Stock' && status === 'out') ||
        (statusFilter === 'Healthy' && status === 'healthy')

      const matchesCategory =
        categoryFilter === 'All' ||
        item.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [searchQuery, statusFilter, categoryFilter])

  const totalItems = filteredInventory.length

  const totalStockIn = useMemo(
    () =>
      filteredInventory.reduce(
        (sum, item) => sum + item.stockIn,
        0,
      ),
    [filteredInventory],
  )

  const totalStockOut = useMemo(
    () =>
      filteredInventory.reduce(
        (sum, item) => sum + item.stockOut,
        0,
      ),
    [filteredInventory],
  )

  const totalCurrentStock = useMemo(
    () =>
      filteredInventory.reduce(
        (sum, item) => sum + item.currentStock,
        0,
      ),
    [filteredInventory],
  )

  const totalValuation = useMemo(
    () =>
      filteredInventory.reduce(
        (sum, item) => sum + item.currentStock * item.unitCost,
        0,
      ),
    [filteredInventory],
  )

  const lowStockCount = useMemo(
    () =>
      filteredInventory.filter(
        (item) => getStockStatus(item) === 'low',
      ).length,
    [filteredInventory],
  )

  const outOfStockCount = useMemo(
    () =>
      filteredInventory.filter(
        (item) => getStockStatus(item) === 'out',
      ).length,
    [filteredInventory],
  )

  function handlePrint() {
    showSnackbar('Inventory report sent to printer', 'success')
  }

  function handleExportRequest() {
    setPendingAction('export')
    setConfirmOpen(true)
  }

  function handleAuditRequest() {
    setPendingAction('audit')
    setConfirmOpen(true)
  }

  function handleConfirmAction() {
    if (pendingAction === 'export') {
      showSnackbar(
        'Inventory report exported successfully!',
        'success',
      )
    }

    if (pendingAction === 'audit') {
      showSnackbar(
        'Inventory stock audit completed successfully!',
        'success',
      )
    }

    setConfirmOpen(false)
    setPendingAction(null)
  }

  function handleCancelAction() {
    setConfirmOpen(false)
    setPendingAction(null)
  }

  function handleResetRequest() {
    setConfirmResetOpen(true)
  }

  function handleConfirmReset() {
    setSearchQuery('')
    setStatusFilter('All')
    setCategoryFilter('All')
    setConfirmResetOpen(false)
    showSnackbar('Inventory report filters cleared', 'info')
  }

  function handleCancelReset() {
    setConfirmResetOpen(false)
  }

  if (!open) return null

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={onClose}
      >
        <div
          className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <Warehouse size={22} />
              </span>
              <div>
                <h2 className="text-xl font-bold text-salon-text">
                  Inventory Reports
                </h2>
                <p className="text-sm text-salon-muted">
                  Review stock movement, current inventory, valuation, and stock alerts.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close inventory reports"
            >
              <X size={22} />
            </button>
          </header>

          {/* Filters */}
          <div className="shrink-0 px-6 py-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Search */}
                <div className="lg:min-w-[260px]">
                  <label
                    htmlFor="inventory-report-search"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Search Item / Category
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="inventory-report-search"
                      type="text"
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      placeholder="Search..."
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label
                    htmlFor="inventory-report-category"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Category
                  </label>

                  <select
                    id="inventory-report-category"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                    className="h-10 w-full min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label
                    htmlFor="inventory-status-filter"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Stock Status
                  </label>

                  <select
                    id="inventory-status-filter"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="h-10 w-full min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    <option value="All">All Items</option>
                    <option value="Healthy">Healthy Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {lowStockCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {lowStockCount} Low
                    </span>
                  )}
                  {outOfStockCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 border border-red-200">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {outOfStockCount} Out
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleResetRequest}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid shrink-0 grid-cols-2 gap-3 px-6 pb-4 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Total Items</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalItems}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Stock In</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalStockIn}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Stock Out</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalStockOut}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">Current Stock</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{totalCurrentStock}</p>
            </div>

            <div className="col-span-2 rounded-xl border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 p-4 lg:col-span-1">
              <p className="text-xs font-medium text-slate-500">Inventory Valuation</p>
              <p className="mt-1 text-xl font-bold text-[#6b1d2f]">
                {formatCurrency(totalValuation)}
              </p>
            </div>
          </div>

          {/* Table Container with explicit scrolling wrapper height */}
          <div className="px-6 pb-4">
            <div className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-20 bg-slate-100 shadow-sm">
                  <tr className="border-b border-slate-200">
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">
                      Item Name
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-xs font-bold text-slate-600">
                      Category
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Stock In
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Stock Out
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Current Stock
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Unit Cost
                    </th>
                    <th className="whitespace-nowrap bg-slate-100 px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Total Value
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.length > 0 ? (
                    filteredInventory.map((item) => {
                      const status = getStockStatus(item)
                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50/70"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              {item.itemName}
                              {status === 'out' && (
                                <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                                  OUT
                                </span>
                              )}
                              {status === 'low' && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                  LOW
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {item.category}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center text-slate-700">
                            {item.stockIn}
                          </td>

                          <td className="px-4 py-3 text-center text-slate-700">
                            {item.stockOut}
                          </td>

                          <td className="px-4 py-3 text-center font-semibold text-slate-900">
                            {item.currentStock}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                            {formatCurrency(item.unitCost)}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#6b1d2f]">
                            {formatCurrency(item.currentStock * item.unitCost)}
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <p className="text-sm font-semibold text-slate-700">
                          No inventory items found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try changing your search or filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>

                {filteredInventory.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-[#f9f9f9]">
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-xs font-bold text-slate-700"
                      >
                        Total
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {totalStockIn}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {totalStockOut}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {totalCurrentStock}
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-bold text-slate-500">
                        -
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-[#6b1d2f]">
                        {formatCurrency(totalValuation)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing {filteredInventory.length} item
              {filteredInventory.length === 1 ? '' : 's'}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>

              <button
                type="button"
                onClick={handleAuditRequest}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <CheckCircle2 className="h-4 w-4 text-[#6b1d2f]" />
                Audit Stock
              </button>

              <button
                type="button"
                onClick={handleExportRequest}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#6b1d2f]/20 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-salon-text">
                {pendingAction === 'audit' ? 'Finalize Stock Audit?' : 'Export Inventory Report?'}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {pendingAction === 'audit'
                  ? 'Are you sure you want to finalize this inventory stock audit? The current stock information will be treated as reviewed.'
                  : 'Are you sure you want to export the current inventory report with the selected filters?'}
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelAction}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmAction}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#6b1d2f]/20 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-salon-text">
                Reset Inventory Filters?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                This will clear the search, category, and status filters and restore the complete inventory report.
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelReset}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}