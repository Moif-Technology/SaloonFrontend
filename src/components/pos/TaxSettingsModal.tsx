import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Percent,
  Plus,
  Save,
  PercentCircle,
  Trash2,
  X,
} from 'lucide-react'

import { useSnackbar } from '../../context/SnackbarContext'

interface TaxSettingsModalProps {
  open: boolean
  onClose: () => void
}

type TaxApplicability = 'All Services' | 'Specific Categories'

type TaxRate = {
  id: string
  name: string
  rate: number
  applicability: TaxApplicability
  status: 'Active' | 'Inactive'
}

const INITIAL_TAX_RATES: TaxRate[] = [
  {
    id: '1',
    name: 'GST',
    rate: 18,
    applicability: 'All Services',
    status: 'Active',
  },
  {
    id: '2',
    name: 'VAT',
    rate: 5,
    applicability: 'Specific Categories',
    status: 'Inactive',
  },
  {
    id: '3',
    name: 'Service Tax',
    rate: 12,
    applicability: 'All Services',
    status: 'Active',
  },
]

const EMPTY_TAX: TaxRate = {
  id: '',
  name: '',
  rate: 0,
  applicability: 'All Services',
  status: 'Active',
}

export default function TaxSettingsModal({
  open,
  onClose,
}: TaxSettingsModalProps) {
  const { showSnackbar } = useSnackbar()

  const [taxRates, setTaxRates] = useState<TaxRate[]>(INITIAL_TAX_RATES)
  const [editingTax, setEditingTax] = useState<TaxRate | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const activeTaxCount = useMemo(
    () => taxRates.filter((tax) => tax.status === 'Active').length,
    [taxRates],
  )

  const totalTaxRate = useMemo(
    () =>
      taxRates
        .filter((tax) => tax.status === 'Active')
        .reduce((sum, tax) => sum + tax.rate, 0),
    [taxRates],
  )

  const highestTaxRate = useMemo(
    () =>
      taxRates.length > 0
        ? Math.max(...taxRates.map((tax) => tax.rate))
        : 0,
    [taxRates],
  )

  function handleToggleStatus(id: string) {
    setTaxRates((prev) =>
      prev.map((tax) =>
        tax.id === id
          ? {
              ...tax,
              status: tax.status === 'Active' ? 'Inactive' : 'Active',
            }
          : tax,
      ),
    )
  }

  function handleEdit(tax: TaxRate) {
    setEditingTax({ ...tax })
    setShowAddForm(true)
  }

  function handleAddNew() {
    setEditingTax({
      ...EMPTY_TAX,
      id: `tax-${Date.now()}`,
    })
    setShowAddForm(true)
  }

  function handleDelete(id: string) {
    const target = taxRates.find((tax) => tax.id === id)

    setTaxRates((prev) => prev.filter((tax) => tax.id !== id))

    // Toast notification for delete action
    showSnackbar(
      target ? `${target.name} tax rate removed successfully` : 'Tax rate removed',
      'info',
    )
  }

  function handleSaveTax() {
    if (!editingTax) return

    const trimmedName = editingTax.name.trim()

    if (!trimmedName) {
      showSnackbar('Please enter a tax type', 'error')
      return
    }

    if (
      !Number.isFinite(editingTax.rate) ||
      editingTax.rate < 0 ||
      editingTax.rate > 100
    ) {
      showSnackbar('Tax rate must be between 0% and 100%', 'error')
      return
    }

    const isExisting = taxRates.some((tax) => tax.id === editingTax.id)

    setTaxRates((prev) => {
      const exists = prev.some((tax) => tax.id === editingTax.id)

      if (exists) {
        return prev.map((tax) =>
          tax.id === editingTax.id
            ? {
                ...editingTax,
                name: trimmedName,
              }
            : tax,
        )
      }

      return [
        ...prev,
        {
          ...editingTax,
          name: trimmedName,
        },
      ]
    })

    setEditingTax(null)
    setShowAddForm(false)

    // Toast notification for Edit vs Add
    showSnackbar(
      isExisting ? 'Tax rate updated successfully' : 'Tax rate added successfully',
      'success',
    )
  }

  function handleCancelForm() {
    setEditingTax(null)
    setShowAddForm(false)
  }

  function handleSaveChanges() {
    // Toast notification for global changes save
    showSnackbar(
      'Tax settings saved successfully',
      'success',
    )

    onClose()
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
          className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b1d2f] text-white shadow-sm">
                <PercentCircle size={21} />
              </span>

              <div>
                <h2 className="text-xl font-bold text-salon-text">
                  Tax Settings
                </h2>

                <p className="text-sm text-salon-muted">
                  Configure tax rates and their applicability across services.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </header>

          {/* Summary Metrics */}
          <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pt-5 sm:grid-cols-3">
            <div className="rounded-xl border border-[#6b1d2f]/30 bg-gradient-to-br from-white to-[#6b1d2f]/5 px-4 py-3 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[#6b1d2f]">
                Active Tax Rates
              </p>

              <p className="mt-1 text-xl font-extrabold text-[#6b1d2f] tabular-nums">
                {activeTaxCount}
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Currently applied
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Combined Active Rate
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {totalTaxRate}%
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Across active tax rules
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-medium text-slate-500">
                Highest Rate
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900 tabular-nums">
                {highestTaxRate}%
              </p>

              <p className="mt-0.5 text-xs text-slate-500">
                Configured maximum
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
            {/* Helper Text */}
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#6b1d2f]/10 bg-[#6b1d2f]/5 px-4 py-3">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                <Percent size={15} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#6b1d2f]">
                  Tax configuration
                </p>

                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                  Define the tax percentage and choose whether it applies to
                  all services or selected categories.
                </p>
              </div>
            </div>

            {/* Add / Edit Form */}
            {showAddForm && editingTax && (
              <div className="mb-5 rounded-xl border border-[#6b1d2f]/20 bg-[#6b1d2f]/5 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {taxRates.some((tax) => tax.id === editingTax.id)
                        ? 'Edit Tax Rate'
                        : 'Add Tax Rate'}
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Enter the tax details below.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="rounded-full p-1.5 text-slate-400 transition hover:bg-white hover:text-[#6b1d2f]"
                    aria-label="Close tax form"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  {/* Tax Name */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Tax Type
                    </label>

                    <input
                      type="text"
                      value={editingTax.name}
                      onChange={(e) =>
                        setEditingTax((prev) =>
                          prev
                            ? {
                                ...prev,
                                name: e.target.value,
                              }
                            : prev,
                        )
                      }
                      placeholder="e.g. GST"
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    />
                  </div>

                  {/* Rate */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Percentage Rate
                    </label>

                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={editingTax.rate}
                        onChange={(e) =>
                          setEditingTax((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rate: Number(e.target.value),
                                }
                              : prev,
                          )
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-9 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Applicability */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Applicability
                    </label>

                    <select
                      value={editingTax.applicability}
                      onChange={(e) =>
                        setEditingTax((prev) =>
                          prev
                            ? {
                                ...prev,
                                applicability:
                                  e.target.value as TaxApplicability,
                              }
                            : prev,
                        )
                      }
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                    >
                      <option value="All Services">
                        All Services
                      </option>

                      <option value="Specific Categories">
                        Specific Categories
                      </option>
                    </select>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Status
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingTax((prev) =>
                          prev
                            ? {
                                ...prev,
                                status:
                                  prev.status === 'Active'
                                    ? 'Inactive'
                                    : 'Active',
                              }
                            : prev,
                        )
                      }
                      className={[
                        'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-sm font-semibold transition',
                        editingTax.status === 'Active'
                          ? 'border-emerald-200 text-emerald-700'
                          : 'border-slate-300 text-slate-500',
                      ].join(' ')}
                    >
                      <span>{editingTax.status}</span>

                      <span
                        className={[
                          'relative h-5 w-9 rounded-full transition',
                          editingTax.status === 'Active'
                            ? 'bg-[#6b1d2f]'
                            : 'bg-slate-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition',
                            editingTax.status === 'Active'
                              ? 'left-4'
                              : 'left-0.5',
                          ].join(' ')}
                        />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTax}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Tax Rate
                  </button>
                </div>
              </div>
            )}

            {/* Tax Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Configured Tax Rates
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Manage the tax rules used by the POS.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddNew}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#6b1d2f]/20 bg-[#6b1d2f]/5 px-3 py-2 text-xs font-bold text-[#6b1d2f] transition hover:bg-[#6b1d2f]/10"
                >
                  <Plus className="h-4 w-4" />
                  Add Tax Rate
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-salon-border bg-[#6b1d2f]/5 text-[11px] font-bold uppercase tracking-wide text-[#6b1d2f]">
                      <th className="px-4 py-3">
                        Tax Type
                      </th>

                      <th className="px-4 py-3">
                        Rate
                      </th>

                      <th className="px-4 py-3">
                        Applicability
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {taxRates.length > 0 ? (
                      taxRates.map((tax) => (
                        <tr
                          key={tax.id}
                          className="transition hover:bg-[#6b1d2f]/5"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6b1d2f]/10 text-[#6b1d2f]">
                                <Percent size={15} />
                              </span>

                              <div>
                                <p className="font-semibold text-slate-800">
                                  {tax.name}
                                </p>

                                <p className="text-xs text-slate-400">
                                  Tax rule
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900">
                              {tax.rate}%
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {tax.applicability}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleStatus(tax.id)
                              }
                              className="inline-flex items-center gap-2"
                              aria-label={`Toggle ${tax.name} status`}
                            >
                              <span
                                className={[
                                  'relative h-5 w-9 rounded-full transition',
                                  tax.status === 'Active'
                                    ? 'bg-[#6b1d2f]'
                                    : 'bg-slate-300',
                                ].join(' ')}
                              >
                                <span
                                  className={[
                                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition',
                                    tax.status === 'Active'
                                      ? 'left-4'
                                      : 'left-0.5',
                                  ].join(' ')}
                                />
                              </span>

                              <span
                                className={[
                                  'text-xs font-semibold',
                                  tax.status === 'Active'
                                    ? 'text-emerald-700'
                                    : 'text-slate-500',
                                ].join(' ')}
                              >
                                {tax.status}
                              </span>
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleEdit(tax)}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6b1d2f] transition hover:bg-[#6b1d2f]/10"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(tax.id)
                                }
                                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                aria-label={`Delete ${tax.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center"
                        >
                          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#6b1d2f]/10 text-[#6b1d2f]">
                            <Percent size={19} />
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-700">
                            No tax rates configured
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Add a tax rate to start configuring taxes.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
            <p className="text-xs text-slate-500">
              {taxRates.length} tax rules configured · {activeTaxCount} active
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725]"
              >
                <Save size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}