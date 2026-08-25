import { useMemo, useState } from 'react'
import { FileDown, TrendingUp, X } from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface SalesReportModalProps {
  open: boolean
  onClose: () => void
}

type SalesReportRow = {
  id: string
  category: string
  totalTransactions: number
  grossSales: number
  discounts: number
  netSales: number
}

type SalesPeriod = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly'

const MOCK_SALES_DATA: SalesReportRow[] = [
  {
    id: '1',
    category: 'Hair Services',
    totalTransactions: 142,
    grossSales: 52000,
    discounts: 3500,
    netSales: 48500,
  },
  {
    id: '2',
    category: 'Beauty Services',
    totalTransactions: 98,
    grossSales: 35000,
    discounts: 2400,
    netSales: 32600,
  },
  {
    id: '3',
    category: 'Spa Services',
    totalTransactions: 45,
    grossSales: 23000,
    discounts: 1600,
    netSales: 21400,
  },
  {
    id: '4',
    category: 'Hair Products',
    totalTransactions: 64,
    grossSales: 19000,
    discounts: 800,
    netSales: 18200,
  },
  {
    id: '5',
    category: 'Beauty Products',
    totalTransactions: 38,
    grossSales: 13000,
    discounts: 600,
    netSales: 12400,
  },
]

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

export default function SalesReportModal({
  open,
  onClose,
}: SalesReportModalProps) {
  const { showSnackbar } = useSnackbar()

  const [period, setPeriod] = useState<SalesPeriod>('Monthly')
  const [confirmGenerateOpen, setConfirmGenerateOpen] =
    useState(false)

  const totalTransactionsCount = useMemo(
    () =>
      MOCK_SALES_DATA.reduce(
        (sum, row) => sum + row.totalTransactions,
        0,
      ),
    [],
  )

  const totalGrossSales = useMemo(
    () =>
      MOCK_SALES_DATA.reduce(
        (sum, row) => sum + row.grossSales,
        0,
      ),
    [],
  )

  const totalDiscounts = useMemo(
    () =>
      MOCK_SALES_DATA.reduce(
        (sum, row) => sum + row.discounts,
        0,
      ),
    [],
  )

  const totalNetSales = useMemo(
    () =>
      MOCK_SALES_DATA.reduce(
        (sum, row) => sum + row.netSales,
        0,
      ),
    [],
  )

  function handleGenerateRequest() {
    setConfirmGenerateOpen(true)
  }

  function handleConfirmGenerate() {
    setConfirmGenerateOpen(false)

    showSnackbar(
      'Sales report generated successfully!',
      'success',
    )
  }

  function handleCancelGenerate() {
    setConfirmGenerateOpen(false)
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
          className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <TrendingUp size={22} />
              </span>
              <div>
                <h2 id="sales-report-title" className="text-xl font-bold text-salon-text">
                  Sales Report
                </h2>
                <p className="text-sm text-salon-muted">
                  Review transaction volumes, gross revenues, discounts, and net sales breakdowns.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close sales report"
            >
              <X size={22} />
            </button>
          </header>

          {/* Period Filters */}
          <div className="shrink-0 px-6 py-4">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Reporting Period
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Select the timeframe you want to analyze.
                </p>
              </div>

              <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                {(
                  ['Daily', 'Weekly', 'Monthly', 'Yearly'] as SalesPeriod[]
                ).map((option) => {
                  const active = period === option

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPeriod(option)}
                      className={`flex-1 rounded-md px-4 py-2 text-xs font-semibold transition sm:flex-none ${
                        active
                          ? 'bg-[#6b1d2f] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pb-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Total Transactions
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {totalTransactionsCount}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Gross Sales
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(totalGrossSales)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Discounts Given
              </p>

              <p className="mt-1 text-xl font-bold text-rose-600">
                -{formatCurrency(totalDiscounts)}
              </p>
            </div>

            <div className="rounded-xl border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 p-4">
              <p className="text-xs font-medium text-slate-500">
                Net Sales
              </p>

              <p className="mt-1 text-xl font-bold text-[#6b1d2f]">
                {formatCurrency(totalNetSales)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="min-h-0 flex-1 overflow-auto px-6 pb-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#f9f9f9]">
                  <tr className="border-b border-slate-200">
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Category / Service Type
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Transactions
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Gross Sales
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Discounts
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Net Sales
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {MOCK_SALES_DATA.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {row.category}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {row.totalTransactions}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                        {formatCurrency(row.grossSales)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-rose-600">
                        -{formatCurrency(row.discounts)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#6b1d2f]">
                        {formatCurrency(row.netSales)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-200 bg-[#f9f9f9]">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">
                      Total
                    </td>

                    <td className="px-4 py-3 text-center text-xs font-bold text-slate-900">
                      {totalTransactionsCount}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(totalGrossSales)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-rose-600">
                      -{formatCurrency(totalDiscounts)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-[#6b1d2f]">
                      {formatCurrency(totalNetSales)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs text-slate-500">
                Selected period
              </p>

              <p className="text-sm font-semibold text-slate-800">
                {period}
              </p>
            </div>

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
                onClick={handleGenerateRequest}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <FileDown size={16} />
                Generate Sales Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Confirmation Modal */}
      {confirmGenerateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#6b1d2f]/20 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
            <div className="mb-5">
              <h3 className="text-lg font-bold text-salon-text">
                Generate Sales Report?
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Are you sure you want to generate the sales report for the selected {period.toLowerCase()}{' '}
                period?
              </p>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={handleCancelGenerate}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmGenerate}
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