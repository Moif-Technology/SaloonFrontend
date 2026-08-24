import { useMemo, useState } from 'react'
import {
  Download,
  Printer,
  RotateCcw,
  Search,
  X,
} from 'lucide-react'
import { useSnackbar } from '../../context/SnackbarContext'

interface ServiceReportsModalProps {
  open: boolean
  onClose: () => void
}

type ServiceReportRow = {
  id: string
  serviceName: string
  category: string
  staffMember: string
  totalBookings: number
  revenueGenerated: number
  averageDuration: number
}

const MOCK_SERVICE_REPORTS: ServiceReportRow[] = [
  {
    id: '1',
    serviceName: 'Haircut',
    category: 'Hair',
    staffMember: 'Arun',
    totalBookings: 42,
    revenueGenerated: 16800,
    averageDuration: 45,
  },
  {
    id: '2',
    serviceName: 'Hair Coloring',
    category: 'Hair',
    staffMember: 'Sneha',
    totalBookings: 28,
    revenueGenerated: 25200,
    averageDuration: 90,
  },
  {
    id: '3',
    serviceName: 'Keratin Treatment',
    category: 'Hair',
    staffMember: 'Nisha',
    totalBookings: 16,
    revenueGenerated: 28800,
    averageDuration: 150,
  },
  {
    id: '4',
    serviceName: 'Facial',
    category: 'Beauty',
    staffMember: 'Meera',
    totalBookings: 34,
    revenueGenerated: 20400,
    averageDuration: 60,
  },
  {
    id: '5',
    serviceName: 'Manicure',
    category: 'Nails',
    staffMember: 'Anjali',
    totalBookings: 31,
    revenueGenerated: 12400,
    averageDuration: 45,
  },
  {
    id: '6',
    serviceName: 'Pedicure',
    category: 'Nails',
    staffMember: 'Anjali',
    totalBookings: 24,
    revenueGenerated: 12000,
    averageDuration: 50,
  },
  {
    id: '7',
    serviceName: 'Head Massage',
    category: 'Spa',
    staffMember: 'Rahul',
    totalBookings: 22,
    revenueGenerated: 8800,
    averageDuration: 40,
  },
  {
    id: '8',
    serviceName: 'Body Spa',
    category: 'Spa',
    staffMember: 'Meera',
    totalBookings: 14,
    revenueGenerated: 19600,
    averageDuration: 90,
  },
]

function formatCurrency(value: number) {
  return value.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  })
}

export default function ServiceReportsModal({
  open,
  onClose,
}: ServiceReportsModalProps) {
  const { showSnackbar } = useSnackbar()

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [staffFilter, setStaffFilter] = useState('All')
  const [confirmResetOpen, setConfirmResetOpen] =
    useState(false)

  const categories = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          MOCK_SERVICE_REPORTS.map(
            (service) => service.category,
          ),
        ),
      ),
    ]
  }, [])

  const staffMembers = useMemo(() => {
    return [
      'All',
      ...Array.from(
        new Set(
          MOCK_SERVICE_REPORTS.map(
            (service) => service.staffMember,
          ),
        ),
      ),
    ]
  }, [])

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return MOCK_SERVICE_REPORTS.filter((service) => {
      const matchesSearch =
        !query ||
        service.serviceName.toLowerCase().includes(query) ||
        service.category.toLowerCase().includes(query) ||
        service.staffMember.toLowerCase().includes(query)

      const matchesCategory =
        categoryFilter === 'All' ||
        service.category === categoryFilter

      const matchesStaff =
        staffFilter === 'All' ||
        service.staffMember === staffFilter

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStaff
      )
    })
  }, [searchQuery, categoryFilter, staffFilter])

  const totalBookings = useMemo(
    () =>
      filteredServices.reduce(
        (sum, service) => sum + service.totalBookings,
        0,
      ),
    [filteredServices],
  )

  const totalRevenue = useMemo(
    () =>
      filteredServices.reduce(
        (sum, service) => sum + service.revenueGenerated,
        0,
      ),
    [filteredServices],
  )

  const averageDuration = useMemo(() => {
    if (filteredServices.length === 0) return 0

    return (
      filteredServices.reduce(
        (sum, service) => sum + service.averageDuration,
        0,
      ) / filteredServices.length
    )
  }, [filteredServices])

  function handlePrint() {
    showSnackbar(
      'Service report sent to printer',
      'success',
    )
  }

  function handleExport() {
    showSnackbar(
      'Service statistics exported successfully!',
      'success',
    )
  }

  function handleResetRequest() {
    setConfirmResetOpen(true)
  }

  function handleConfirmReset() {
    setSearchQuery('')
    setCategoryFilter('All')
    setStaffFilter('All')
    setConfirmResetOpen(false)

    showSnackbar(
      'Service report filters cleared',
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
        <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.15)]">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Service Reports
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Review service bookings, staff performance,
                revenue, and average service duration.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close service reports"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="shrink-0 px-6 py-4">
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {/* Search */}
                <div className="lg:min-w-[260px]">
                  <label
                    htmlFor="service-report-search"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Search Service / Staff
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="service-report-search"
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

                {/* Category */}
                <div>
                  <label
                    htmlFor="service-report-category"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Category
                  </label>

                  <select
                    id="service-report-category"
                    value={categoryFilter}
                    onChange={(event) =>
                      setCategoryFilter(event.target.value)
                    }
                    className="h-10 w-full min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    {categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staff */}
                <div>
                  <label
                    htmlFor="service-report-staff"
                    className="mb-1.5 block text-xs font-semibold text-slate-700"
                  >
                    Staff Member
                  </label>

                  <select
                    id="service-report-staff"
                    value={staffFilter}
                    onChange={(event) =>
                      setStaffFilter(event.target.value)
                    }
                    className="h-10 w-full min-w-[160px] rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-[#6b1d2f] focus:ring-2 focus:ring-[#6b1d2f]/10"
                  >
                    {staffMembers.map((staff) => (
                      <option
                        key={staff}
                        value={staff}
                      >
                        {staff}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
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

          {/* Summary */}
          <div className="grid shrink-0 grid-cols-1 gap-3 px-6 pb-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Total Bookings
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {totalBookings}
              </p>
            </div>

            <div className="rounded-xl border border-[#6b1d2f]/15 bg-[#6b1d2f]/5 p-4">
              <p className="text-xs font-medium text-slate-500">
                Revenue Generated
              </p>

              <p className="mt-1 text-xl font-bold text-[#6b1d2f]">
                {formatCurrency(totalRevenue)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Average Duration
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {averageDuration.toFixed(0)} min
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
                      Service Name
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Category
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-xs font-bold text-slate-600">
                      Staff Assigned
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Total Bookings
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-slate-600">
                      Revenue Generated
                    </th>

                    <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-bold text-slate-600">
                      Avg. Duration
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <tr
                        key={service.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-800">
                          {service.serviceName}
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {service.category}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                          {service.staffMember}
                        </td>

                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                          {service.totalBookings}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#6b1d2f]">
                          {formatCurrency(
                            service.revenueGenerated,
                          )}
                        </td>

                        <td className="px-4 py-3 text-center text-slate-700">
                          {service.averageDuration} min
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          No service reports found
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Try changing your search or filters.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>

                {filteredServices.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-[#f9f9f9]">
                      <td
                        colSpan={3}
                        className="px-4 py-3 text-xs font-bold text-slate-700"
                      >
                        Total
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-900">
                        {totalBookings}
                      </td>

                      <td className="px-4 py-3 text-right text-sm font-bold text-[#6b1d2f]">
                        {formatCurrency(totalRevenue)}
                      </td>

                      <td className="px-4 py-3 text-center text-sm font-bold text-slate-700">
                        {averageDuration.toFixed(0)} min
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
              Showing {filteredServices.length} service
              {filteredServices.length === 1 ? '' : 's'}
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
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6b1d2f] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#581725] focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/20"
              >
                <Download className="h-4 w-4" />
                Export
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
                Reset Service Filters?
              </h3>

              <p className="mt-1.5 text-sm leading-5 text-white/65">
                This will clear the search, category, and staff
                filters and restore the complete service report.
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
  )
}