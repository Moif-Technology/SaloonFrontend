import { useState } from 'react'
import { Scissors, Search, X } from 'lucide-react'
import Button from '../common/Button'
import { useSnackbar } from '../../context/SnackbarContext'

const SERVICES = [
    { id: 'svc-haircut', name: 'Haircut' },
    { id: 'svc-keratin', name: 'Keratin Treatment' },
    { id: 'svc-facial', name: 'Facial' },
    { id: 'svc-beard', name: 'Beard Trim' },
  ] as const
  
  const STAFF = [
    { id: 'emp-jessica', name: 'Jessica' },
    { id: 'emp-david', name: 'David' },
    { id: 'emp-mia', name: 'Mia' },
    { id: 'emp-ava', name: 'Ava' },
  ] as const
  
  type AssignmentKey = `${string}:${string}`
  
  const INITIAL_ASSIGNMENTS: Record<AssignmentKey, boolean> = {
    'svc-haircut:emp-jessica': true,
    'svc-haircut:emp-david': true,
    'svc-keratin:emp-jessica': true,
    'svc-facial:emp-mia': true,
    'svc-beard:emp-david': true,
    'svc-beard:emp-ava': true,
  }
export interface ServiceAssignmentsModalProps {
  open: boolean
  onClose: () => void
}

export default function ServiceAssignmentsModal({
  open,
  onClose,
}: ServiceAssignmentsModalProps) {
  const { showSnackbar } = useSnackbar()
  const [search, setSearch] = useState('')
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS)

function assignmentKey(serviceId: string, staffId: string): AssignmentKey {
  return `${serviceId}:${staffId}`
}

function handleToggle(serviceId: string, staffId: string) {
  const key = assignmentKey(serviceId, staffId)
  setAssignments((prev) => ({ ...prev, [key]: !prev[key] }))
  showSnackbar('Service assignments updated successfully', 'success')
}
function handleToggleAll(serviceId: string) {
  const allAssigned = STAFF.every(
    (emp) => Boolean(assignments[assignmentKey(serviceId, emp.id)]),
  )

  setAssignments((prev) => {
    const next = { ...prev }

    STAFF.forEach((emp) => {
      const key = assignmentKey(serviceId, emp.id)
      next[key] = !allAssigned
    })

    return next
  })

  showSnackbar(
    allAssigned
      ? 'Service unassigned from all staff'
      : 'Service assigned to all staff',
    'success',
  )
}
const q = search.trim().toLowerCase()
const visibleServices = SERVICES.filter(
  (s) => !q || s.name.toLowerCase().includes(q),
)
const visibleStaff = STAFF.filter(
  (e) => !q || e.name.toLowerCase().includes(q),
)
// If search matches a service, show all staff for that service (and vice versa)
const servicesToShow =
  q && visibleStaff.length && !visibleServices.length
    ? [...SERVICES]
    : visibleServices.length
      ? visibleServices
      : q
        ? []
        : [...SERVICES]
const staffToShow =
  q && visibleServices.length && !visibleStaff.length
    ? [...STAFF]
    : visibleStaff.length
      ? visibleStaff
      : q
        ? []
        : [...STAFF]

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-assignments-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
      <header className="flex shrink-0 flex-col gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
        <Scissors size={22} />
      </span>
      <div className="min-w-0">
        <h2
          id="service-assignments-title"
          className="text-xl font-bold text-salon-text"
        >
          Service Assignments
        </h2>
        <p className="mt-0.5 text-sm font-medium text-salon-muted">
          Assign services to staff members
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f] transition"
      aria-label="Close"
    >
      <X size={22} />
    </button>
  </div>

  <div className="relative">
    <Search
      size={18}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
    />
    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search service or employee…"
      className="h-10 w-full rounded-xl border border-salon-border bg-white py-2 pl-10 pr-3 text-sm font-medium text-salon-text outline-none transition focus:border-salon-primary focus:ring-2 focus:ring-[#6b1d2f]/10"
    />
  </div>
</header>

        <div className="min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-50/80 px-4 pb-3 md:px-5 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
  {servicesToShow.length === 0 || staffToShow.length === 0 ? (
    <p className="mt-6 text-center text-sm font-medium text-salon-muted">
      No services or staff match your search.
    </p>
  ) : (
    <table className="mt-3 w-max min-w-full border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        <th className="sticky left-0 z-20 min-w-[180px] bg-white px-3 py-2 shadow-sm">
  Service
</th>

{staffToShow.map((emp) => (
  <th
  key={emp.id}
  className="min-w-[110px] px-2 py-2 text-center"
>
  {emp.name}
</th>
))}

<th className="sticky right-0 z-20 bg-white px-2 py-2 text-center shadow-sm">
  All
</th>
        </tr>
      </thead>
      <tbody>
        {servicesToShow.map((svc) => (
          <tr
            key={svc.id}
            className="border-b border-salon-border text-salon-text"
          >
            <td className="sticky left-0 z-10 bg-white px-2 py-2 font-medium text-salon-text shadow-sm">
  {svc.name}
</td>
            {staffToShow.map((emp) => {
              const key = `${svc.id}:${emp.id}` as AssignmentKey
              const checked = Boolean(assignments[key])
              return (
                <td key={emp.id} className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleToggle(svc.id, emp.id)}
                    aria-label={`${svc.name} — ${emp.name}`}
                    className="h-5 w-5 accent-[var(--color-salon-primary,#521C1D)]"
                  />
                </td>
              )
            })}
            <td className="sticky right-0 z-10 bg-white px-2 py-2 text-center shadow-sm">
  {(() => {
    const allAssigned = STAFF.every(
      (emp) => Boolean(assignments[assignmentKey(svc.id, emp.id)]),
    )

    return (
      <button
        type="button"
        onClick={() => handleToggleAll(svc.id)}
        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
          allAssigned
            ? 'bg-salon-primary text-white hover:bg-salon-primary/90'
            : 'border border-salon-border bg-white text-salon-muted hover:bg-salon-surface hover:text-salon-text'
        }`}
        aria-label={
          allAssigned
            ? `Unassign ${svc.name} from all staff`
            : `Assign ${svc.name} to all staff`
        }
      >
        {allAssigned ? 'All' : 'Assign All'}
      </button>
    )
  })()}
</td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

        <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
          <Button
            type="button"
            variant="secondary"
            size="compact"
            fullWidth
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="compact"
            fullWidth
            onClick={() => {
              showSnackbar('Service assignments updated successfully', 'success')
              onClose()
            }}
          >
            Save Changes
          </Button>
        </footer>
      </div>
    </div>
  )
}