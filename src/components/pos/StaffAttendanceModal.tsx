import { useState, useEffect } from 'react'
import { ClipboardCheck, X } from 'lucide-react'
import Button from '../common/Button'
import { useSnackbar } from '../../context/SnackbarContext'
type AttendanceStatus = 'Present' | 'Late' | 'Absent'

type AttendanceRow = {
  id: string
  name: string
  shift: string
  checkIn: string
  checkOut: string
  status: AttendanceStatus
}

const MOCK_ATTENDANCE: AttendanceRow[] = [
  { id: '1', name: 'Jessica', shift: '9:00 AM – 6:00 PM', checkIn: '9:02 AM', checkOut: '—', status: 'Present' },
  { id: '2', name: 'David', shift: '10:00 AM – 7:00 PM', checkIn: '10:18 AM', checkOut: '—', status: 'Late' },
  { id: '3', name: 'Mia', shift: '9:00 AM – 5:00 PM', checkIn: '—', checkOut: '—', status: 'Absent' },
  { id: '4', name: 'Ava', shift: '11:00 AM – 8:00 PM', checkIn: '10:55 AM', checkOut: '—', status: 'Present' },
]

function statusBadgeClass(status: AttendanceStatus) {
  if (status === 'Present') return 'bg-emerald-100 text-emerald-700'
  if (status === 'Late') return 'bg-amber-100 text-amber-700'
  return 'bg-rose-100 text-rose-700'
}
export interface StaffAttendanceModalProps {
  open: boolean
  onClose: () => void
}

export default function StaffAttendanceModal({
  open,
  onClose,
}: StaffAttendanceModalProps) {
    const { showSnackbar } = useSnackbar()
    const [selectedDate, setSelectedDate] = useState(
      () => new Date().toISOString().slice(0, 10),
    )
    const [rows, setRows] = useState(MOCK_ATTENDANCE)

useEffect(() => {
  setRows(MOCK_ATTENDANCE)
}, [selectedDate])

function handleMarkStatus(id: string, status: AttendanceStatus) {
  const now = new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  setRows((prev) =>
    prev.map((row) => {
      if (row.id !== id) return row

      return {
        ...row,
        status,
        checkIn: status === 'Absent' ? '—' : now,
      }
    }),
  )

  const name = rows.find((r) => r.id === id)?.name ?? 'Staff'
  showSnackbar(`${name} attendance updated successfully`, 'success')
}
    
   
    

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-attendance-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
    <header className="flex shrink-0 flex-col gap-3 border-b border-salon-border px-5 py-4">
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
        <ClipboardCheck size={22} />
      </span>
      <div className="min-w-0">
        <h2
          id="staff-attendance-title"
          className="text-xl font-bold text-salon-text"
        >
          Staff Attendance
        </h2>
        <p className="mt-0.5 text-sm font-medium text-salon-muted">
          Mark daily staff check-in and status
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
    <input
      type="date"
      value={selectedDate}
      onChange={(e) => setSelectedDate(e.target.value)}
      className="h-10 rounded-xl border-2 border-salon-border bg-white px-3 text-sm font-medium text-salon-text outline-none focus:border-salon-primary"
    />

  </div>
</header>

        {/* Body + footer added in later steps */}
        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/80 px-4 pb-3 md:px-5">
  <table className="mt-3 w-full min-w-[720px] border-collapse text-left text-sm">
    <thead>
      <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
        <th className="px-2 py-2">Employee Name</th>
        <th className="px-2 py-2">Shift Timings</th>
        <th className="px-2 py-2">Check-In Time</th>
        <th className="px-2 py-2">Check-Out Time</th>
        <th className="px-2 py-2">Status</th>
        <th className="px-2 py-2 text-right">Actions</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row) => (
        <tr key={row.id} className="border-b border-salon-border text-salon-text">
          <td className="px-2 py-2 font-medium">{row.name}</td>
          <td className="px-2 py-2">{row.shift}</td>
          <td className="px-2 py-2 tabular-nums text-salon-muted">{row.checkIn}</td>
          <td className="px-2 py-2 tabular-nums text-salon-muted">{row.checkOut}</td>
          <td className="px-2 py-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(row.status)}`}
            >
              {row.status}
            </span>
          </td>
          <td className="px-2 py-2">
  <div className="flex justify-end">
    {(['Present', 'Late', 'Absent'] as AttendanceStatus[]).map((status) => {
      const isActive = row.status === status
      const statusClasses =
      status === 'Present'
        ? isActive
          ? 'border-[#6b1d2f] bg-[#6b1d2f] text-white shadow-sm ring-2 ring-rose-200'
          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
        : status === 'Late'
          ? isActive
            ? 'border-amber-300 bg-amber-100 text-amber-900 shadow-sm ring-2 ring-amber-200'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
          : isActive
            ? 'border-slate-200 bg-slate-100 text-slate-700 shadow-sm ring-2 ring-slate-200'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'

      return (
        <button
          key={status}
          type="button"
          onClick={() => handleMarkStatus(row.id, status)}
          aria-pressed={isActive}
          className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold leading-none transition-colors duration-150 ${statusClasses}`}
        >
          {status}
          
        </button>
      )
    })}
  </div>
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
<footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
  <Button
    type="button"
    variant="secondary"
    size="compact"
    fullWidth
    onClick={onClose}
  >
    Close
  </Button>
  <Button
    type="button"
    variant="primary"
    size="compact"
    fullWidth
    onClick={() => {
      showSnackbar('Changes saved successfully', 'success')
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