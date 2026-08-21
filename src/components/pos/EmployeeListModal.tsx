import { useState, useEffect } from 'react'
import { IdCard, Pencil, Search, Trash2, X } from 'lucide-react'
import Button from '../common/Button'


export interface EmployeeListModalProps {
  open: boolean
  onClose: () => void
}
type EmployeeRow = {
    id: string
    employeeId: string
    fullName: string
    role: string
    phone: string
    email: string
    workingDays: string
    workingHours: string
  }
  
  const MOCK_EMPLOYEES: EmployeeRow[] = [
    {
      id: '1',
      employeeId: 'EMP-001',
      fullName: 'Jessica Roy',
      role: 'Senior Stylist',
      phone: '9876543210',
      email: 'jessica@salon.com',
      workingDays: 'Mon–Sat',
      workingHours: '9:00 AM – 6:00 PM',
    },
    {
      id: '2',
      employeeId: 'EMP-002',
      fullName: 'David Kumar',
      role: 'Barber',
      phone: '9123456780',
      email: 'david@salon.com',
      workingDays: 'Tue–Sun',
      workingHours: '10:00 AM – 7:00 PM',
    },
    {
      id: '3',
      employeeId: 'EMP-003',
      fullName: 'Mia Thomas',
      role: 'Receptionist',
      phone: '9988776655',
      email: 'mia@salon.com',
      workingDays: 'Mon–Fri',
      workingHours: '9:00 AM – 5:00 PM',
    },
  ]
export default function EmployeeListModal({
  open,
  onClose,
}: EmployeeListModalProps) {
    const [employees, setEmployees] = useState(MOCK_EMPLOYEES)
  
  const [search, setSearch] = useState('')

const rows = employees.filter((e) => {
  if (!search.trim()) return true
  const q = search.toLowerCase()
  return (
    e.fullName.toLowerCase().includes(q) ||
    e.role.toLowerCase().includes(q)
  )
})
const [formOpen, setFormOpen] = useState(false)
const [editingId, setEditingId] = useState<string | null>(null)
const [formName, setFormName] = useState('')
const [formRole, setFormRole] = useState('')
const [formPhone, setFormPhone] = useState('')
const [formEmail, setFormEmail] = useState('')
const [formWorkingDays, setFormWorkingDays] = useState('')
const [submitted, setSubmitted] = useState(false)
const [showToast, setShowToast] = useState(false)
const [toastMessage, setToastMessage] = useState('')
const [deleteEmployeeId, setDeleteEmployeeId] = useState<string | null>(null)

useEffect(() => {
  if (!showToast) return
  const timer = setTimeout(() => setShowToast(false), 3000)
  return () => clearTimeout(timer)
}, [showToast])

function resetForm() {
  setFormName('')
  setFormRole('')
  setFormPhone('')
  setFormEmail('')
  setFormWorkingDays('')
  setEditingId(null)
  setSubmitted(false)
}
function openEditForm(employee: EmployeeRow) {
    setEditingId(employee.id)
    setFormName(employee.fullName)
    setFormRole(employee.role)
    setFormPhone(employee.phone)
    setFormEmail(employee.email)
    setFormWorkingDays(employee.workingDays)
    setSubmitted(false)
    setFormOpen(true)
  }
  function handleDelete(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
    setDeleteEmployeeId(id)
  }
  function confirmDelete() {
    if (!deleteEmployeeId) return
  
    setEmployees((prev) =>
      prev.filter((e) => e.id !== deleteEmployeeId),
    )
  
    setDeleteEmployeeId(null)
    setToastMessage('Employee deleted successfully')
    setShowToast(true)
  }
  
if (!open) return null

  function handleSave() {
    setSubmitted(true)
    if (!formName.trim() || !formRole.trim() || !formPhone.trim() || !formWorkingDays.trim()) {
      return
    }
  
    if (editingId) {
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === editingId
            ? {
                ...e,
                fullName: formName.trim(),
                role: formRole.trim(),
                phone: formPhone.trim(),
                email: formEmail.trim(),
                workingDays: formWorkingDays.trim(),
              }
            : e,
        ),
      )
      setToastMessage('Employee updated successfully')
      setShowToast(true)
    } else {
      const nextNum =
        employees.reduce((max, e) => {
          const n = parseInt(e.employeeId.replace('EMP-', ''), 10)
          return Number.isNaN(n) ? max : Math.max(max, n)
        }, 0) + 1
  
      const newEmployee: EmployeeRow = {
        id: String(Date.now()),
        employeeId: `EMP-${String(nextNum).padStart(3, '0')}`,
        fullName: formName.trim(),
        role: formRole.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        workingDays: formWorkingDays.trim(),
        workingHours: '9:00 AM – 6:00 PM',
      }
  
      setEmployees((prev) => [...prev, newEmployee])
      setToastMessage('Employee added successfully')
      setShowToast(true)
    }
  
    resetForm()
    setFormOpen(false)
  }

  
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="employee-list-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
      <header className="flex shrink-0 flex-col gap-3 border-b border-salon-border px-5 py-4">
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
        <IdCard size={22} />
      </span>
      <div className="min-w-0">
        <h2 id="employee-list-title" className="text-xl font-bold text-salon-text">
          Employee List
        </h2>
        <p className="mt-0.5 text-sm font-medium text-salon-muted">
          Manage salon staff and working hours
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={onClose}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
      aria-label="Close"
    >
      <X size={22} />
    </button>
  </div>

  <div className="flex flex-wrap items-center gap-2">
  <label className="relative min-w-0 flex-1">
    <Search
      size={18}
      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
    />
    <input
      type="search"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search employee name or role…"
      className="h-10 w-full rounded-xl border-2 border-salon-border bg-white py-2 pl-10 pr-3 text-sm font-medium outline-none focus:border-salon-primary"
    />
  </label>
  <button
    type="button"
    onClick={() => setFormOpen(true)}
    className="h-10 shrink-0 rounded-xl bg-salon-primary px-4 text-sm font-semibold text-white hover:opacity-90"
  >
    + Add Employee
  </button>
</div>
</header>

        {/* Body — table & search added in next steps */}
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/80 px-4 pb-3 md:px-5">
  {rows.length === 0 ? (
    <p className="py-12 text-center text-sm font-medium text-salon-muted">
      No employees match your search.
    </p>
  ) : (
    <table className="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
          <th className="px-2 py-2">Employee ID</th>
          <th className="px-2 py-2">Full Name</th>
          <th className="px-2 py-2">Role</th>
          <th className="px-2 py-2">Phone</th>
          <th className="px-2 py-2">Working Hours</th>
          <th className="px-2 py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.id} className="border-b border-salon-border text-salon-text">
            <td className="px-2 py-2 font-semibold">{e.employeeId}</td>
            <td className="px-2 py-2 font-medium">{e.fullName}</td>
            <td className="px-2 py-2">{e.role}</td>
            <td className="px-2 py-2 tabular-nums text-salon-muted">{e.phone}</td>
            <td className="px-2 py-2">{e.workingHours}</td>
            <td className="px-2 py-2">
              <div className="flex justify-end gap-1">
              <button
  type="button"
  title="Edit"
  onClick={() => openEditForm(e)}
  className="flex h-7 w-7 items-center justify-center rounded-lg text-salon-muted hover:bg-salon-primary-light hover:text-salon-primary"
>
  <Pencil size={15} />
</button>
                <button
  type="button"
  title="Delete"
  onClick={() => handleDelete(e.id)}
  className="flex h-7 w-7 items-center justify-center rounded-lg text-salon-muted hover:bg-rose-50 hover:text-rose-600"
>
  <Trash2 size={15} />
</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>
{formOpen && (
  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4 sm:p-6">
    <div className="w-full max-w-md rounded-2xl border border-salon-border bg-white p-5 shadow-xl sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-salon-text">Add Employee</h3>
        <button
          type="button"
          onClick={() => { setFormOpen(false); resetForm() }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
          aria-label="Close form"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {[
          { label: 'Name *', value: formName, set: setFormName, placeholder: 'e.g. Jessica Roy' },
          { label: 'Role *', value: formRole, set: setFormRole, placeholder: 'e.g. Senior Stylist' },
          { label: 'Phone *', value: formPhone, set: setFormPhone, placeholder: 'e.g. 9876543210' },
          { label: 'Email', value: formEmail, set: setFormEmail, placeholder: 'e.g. jessica@salon.com' },
          { label: 'Working Days *', value: formWorkingDays, set: setFormWorkingDays, placeholder: 'e.g. Mon–Sat' },
        ].map(({ label, value, set, placeholder }) => (
          <label key={label} className="block text-sm font-semibold text-salon-text">
            {label}
            <input
  type="text"
  value={value}
  onChange={(e) => {
    const value = e.target.value

    if (label === 'Phone *') {
      if (!/^\d*$/.test(value)) return
    }

    set(value)
  }}
  placeholder={placeholder}
  className={[
    'mt-1 h-10 w-full rounded-xl border-2 bg-white px-3 text-sm font-medium outline-none',
    submitted && label.includes('*') && !value.trim()
      ? 'border-red-400 focus:border-red-500'
      : 'border-salon-border focus:border-salon-primary',
  ].join(' ')}
/>
          </label>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" size="compact" fullWidth onClick={() => setFormOpen(false)}>
          Cancel
        </Button>
        <Button variant="primary" size="compact" fullWidth onClick={handleSave}>
  Save
</Button>
      </div>
      </div>
  </div>
)}
{deleteEmployeeId && (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-employee-title"
      className="w-full max-w-sm rounded-2xl border border-salon-border bg-white p-5 shadow-2xl"
    >
      <h3
        id="delete-employee-title"
        className="text-lg font-bold text-salon-text"
      >
        Delete Employee
      </h3>

      <p className="mt-2 text-sm font-medium text-salon-muted">
        Are you sure you want to delete this employee?
      </p>

      <div className="mt-5 flex gap-3">
        <Button
          type="button"
          variant="secondary"
          size="compact"
          fullWidth
          onClick={() => setDeleteEmployeeId(null)}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="primary"
          size="compact"
          fullWidth
          onClick={confirmDelete}
        >
          Confirm
        </Button>
      </div>
    </div>
  </div>
)}
{showToast && (
  <div className="fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-xl border border-[#83263c] bg-[#6b1d2f] px-4 py-3 shadow-2xl animate-[slideUp_0.25s_ease-out]">
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>

    <p className="text-[12px] font-medium text-white">
      {toastMessage}
    </p>
  </div>
)}
        <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
          <Button type="button" variant="secondary" size="compact" fullWidth onClick={onClose}>
            Close
          </Button>
        </footer>
      </div>
    </div>
  )
}