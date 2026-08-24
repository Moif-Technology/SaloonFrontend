import { useMemo, useState } from 'react'
import { CalendarDays, Download, RotateCcw, X } from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface SalesReportsModalProps {
  open: boolean
  onClose: () => void
}

type SalesReportRow = {
  id: string
  date: string
  invoiceNo: string
  customer: string
  stylist: string
  paymentMethod: string
  items: number
  amount: number
}

const MOCK_SALES: SalesReportRow[] = [
  {
    id: '1',
    date: '2026-08-24',
    invoiceNo: 'INV-001245',
    customer: 'Anjali',
    stylist: 'Arun',
    paymentMethod: 'Cash',
    items: 3,
    amount: 1850,
  },
  {
    id: '2',
    date: '2026-08-24',
    invoiceNo: 'INV-001244',
    customer: 'Meera',
    stylist: 'Sneha',
    paymentMethod: 'Card',
    items: 2,
    amount: 2400,
  },
  {
    id: '3',
    date: '2026-08-23',
    invoiceNo: 'INV-001243',
    customer: 'Rahul',
    stylist: 'Arun',
    paymentMethod: 'UPI',
    items: 4,
    amount: 3200,
  },
  {
    id: '4',
    date: '2026-08-23',
    invoiceNo: 'INV-001242',
    customer: 'Diya',
    stylist: 'Nisha',
    paymentMethod: 'Cash',
    items: 2,
    amount: 1450,
  },
  {
    id: '5',
    date: '2026-08-22',
    invoiceNo: 'INV-001241',
    customer: 'Fathima',
    stylist: 'Sneha',
    paymentMethod: 'Card',
    items: 5,
    amount: 4100,
  },
  {
    id: '6',
    date: '2026-08-21',
    invoiceNo: 'INV-001240',
    customer: 'Akhil',
    stylist: 'Arun',
    paymentMethod: 'UPI',
    items: 1,
    amount: 950,
  },
]

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

export default function SalesReportsModal({
  open,
  onClose,
}: SalesReportsModalProps) {
  const { showSnackbar } = useSnackbar()

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const filteredSales = useMemo(() => {
    return MOCK_SALES.filter((sale) => {
      const matchesStart = !startDate || sale.date >= startDate
      const matchesEnd = !endDate || sale.date <= endDate

      return matchesStart && matchesEnd
    })
  }, [startDate, endDate])

  const totalSales = useMemo(
    () =>
      filteredSales.reduce(
        (sum, sale) => sum + sale.amount,
        0,
      ),
    [filteredSales],
  )

  const totalTransactions = filteredSales.length

  const averageTicket =
    totalTransactions > 0
      ? totalSales / totalTransactions
      : 0

  function handleExport() {
    showSnackbar(
      'Sales report exported successfully!',
      'success',
    )
  }

  function handleResetRequest() {
    setConfirmResetOpen(true)
  }

  function handleConfirmReset() {
    setStartDate('')
    setEndDate('')
    setConfirmResetOpen(false)

    showSnackbar(
      'Sales report filters cleared',
      'info',
    )
  }

  function handleCancelReset() {
    setConfirmResetOpen(false)
  }

  if (!open) return null

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Sales Reports
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review sales performance, transactions, and
                revenue details.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close sales reports"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="shrink-0 px-6 py-4">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                {/* Start Date */}
                <div>
                  <label
                    htmlFor="sales-start-date"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Start Date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="sales-start-date"
                      type="date"
                      value={startDate}
                      onChange={(event) =>
                        setStartDate(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 sm:w-[170px]"
                    />
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="sales-end-date"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    End Date
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="sales-end-date"
                      type="date"
                      value={endDate}
                      onChange={(event) =>
                        setEndDate(event.target.value)
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10 sm:w-[170px]"
                    />
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetRequest}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Summary Metrics */}
          <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pb-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Total Sales
              </p>

              <p className="mt-1 text-xl font-bold text-[#6b1d2f]">
                {formatCurrency(totalSales)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Total Transactions
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {totalTransactions}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Average Ticket Size
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(averageTicket)}
              </p>
            </div>
          </div>

          {/* Table Section */}
          <div className="min-h-0 flex-1 overflow-auto px-6 pb-4">
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#f9f9f9]">
                  <tr className="border-b border-slate-200">
                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Date
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Invoice
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Customer
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Stylist
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Payment
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Items
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                          {sale.date}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                          {sale.invoiceNo}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {sale.customer}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {sale.stylist}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {sale.paymentMethod}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center text-slate-600">
                          {sale.items}
                        </td>

                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(sale.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          No sales found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Try changing the selected date range.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              Showing {filteredSales.length} transaction
              {filteredSales.length === 1 ? '' : 's'}
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
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <Download className="h-4 w-4" />
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#24171b] p-5 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">
                Clear Report Filters?
              </h3>

              <p className="mt-1.5 text-sm leading-5 text-white/65">
                This will clear the selected dates and restore
                the complete sales report.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelReset}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReset}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#581725]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )}