import { useMemo, useState } from 'react'
import { FileDown, X } from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface TaxSummaryModalProps {
  open: boolean
  onClose: () => void
}

type TaxSummaryRow = {
  id: string
  category: string
  taxableAmount: number
  gstRate: number
  taxCollected: number
  netTotal: number
}

type TaxPeriod = 'Monthly' | 'Quarterly' | 'Yearly'

const MOCK_TAX_DATA: TaxSummaryRow[] = [
  {
    id: '1',
    category: 'Hair Services',
    taxableAmount: 48500,
    gstRate: 18,
    taxCollected: 8730,
    netTotal: 57230,
  },
  {
    id: '2',
    category: 'Beauty Services',
    taxableAmount: 32600,
    gstRate: 18,
    taxCollected: 5868,
    netTotal: 38468,
  },
  {
    id: '3',
    category: 'Spa Services',
    taxableAmount: 21400,
    gstRate: 18,
    taxCollected: 3852,
    netTotal: 25252,
  },
  {
    id: '4',
    category: 'Hair Products',
    taxableAmount: 18200,
    gstRate: 12,
    taxCollected: 2184,
    netTotal: 20384,
  },
  {
    id: '5',
    category: 'Beauty Products',
    taxableAmount: 12400,
    gstRate: 12,
    taxCollected: 1488,
    netTotal: 13888,
  },
]

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

export default function TaxSummaryModal({
  open,
  onClose,
}: TaxSummaryModalProps) {
  const { showSnackbar } = useSnackbar()

  const [period, setPeriod] = useState<TaxPeriod>('Monthly')
  const [confirmGenerateOpen, setConfirmGenerateOpen] =
    useState(false)

  const totalTaxableAmount = useMemo(
    () =>
      MOCK_TAX_DATA.reduce(
        (sum, row) => sum + row.taxableAmount,
        0,
      ),
    [],
  )

  const totalTaxCollected = useMemo(
    () =>
      MOCK_TAX_DATA.reduce(
        (sum, row) => sum + row.taxCollected,
        0,
      ),
    [],
  )

  const totalNetTotal = useMemo(
    () =>
      MOCK_TAX_DATA.reduce(
        (sum, row) => sum + row.netTotal,
        0,
      ),
    [],
  )

  const totalTaxRate =
    totalTaxableAmount > 0
      ? (totalTaxCollected / totalTaxableAmount) * 100
      : 0

  function handleGenerateRequest() {
    setConfirmGenerateOpen(true)
  }

  function handleConfirmGenerate() {
    /*
     * File-generation / tax-filing API integration can be
     * connected here later.
     */

    setConfirmGenerateOpen(false)

    showSnackbar(
      'Tax summary generated successfully!',
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Tax Summary
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review taxable sales, GST collected, and net
                totals for tax filing.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close tax summary"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Period Filters */}
          <div className="shrink-0 px-6 py-4">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Reporting Period
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Select the period you want to review.
                </p>
              </div>

              <div className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-50 p-1 sm:w-auto">
                {(
                  ['Monthly', 'Quarterly', 'Yearly'] as TaxPeriod[]
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
                Taxable Amount
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(totalTaxableAmount)}
              </p>
            </div>

            <div className="rounded-xl border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 p-4">
              <p className="text-xs font-medium text-slate-500">
                Tax Collected
              </p>

              <p className="mt-1 text-xl font-bold text-[#6b1d2f]">
                {formatCurrency(totalTaxCollected)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Net Total
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatCurrency(totalNetTotal)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Effective Tax Rate
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {totalTaxRate.toFixed(2)}%
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

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Taxable Amount
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-slate-600">
                      GST Rate
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Tax Collected
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Net Total
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {MOCK_TAX_DATA.map((row) => (
                    <tr
                      key={row.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {row.category}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                        {formatCurrency(row.taxableAmount)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {row.gstRate}%
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#6b1d2f]">
                        {formatCurrency(row.taxCollected)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(row.netTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="border-t border-slate-200 bg-[#f9f9f9]">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">
                      Total
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(totalTaxableAmount)}
                    </td>

                    <td className="px-4 py-3 text-center text-xs font-semibold text-slate-500">
                      —
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-[#6b1d2f]">
                      {formatCurrency(totalTaxCollected)}
                    </td>

                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(totalNetTotal)}
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
                <FileDown className="h-4 w-4" />
                Generate Tax Summary
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Confirmation Modal */}
      {confirmGenerateOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#24171b] p-5 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-base font-bold text-white">
                Generate Tax Summary?
              </h3>

              <p className="mt-1.5 text-sm leading-5 text-white/65">
                Are you sure you want to generate the tax
                summary for the selected {period.toLowerCase()}{' '}
                period?
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelGenerate}
                className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmGenerate}
                className="rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#581725]"
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