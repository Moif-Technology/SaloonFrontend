import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { toDateKey } from '../../utils/appointmentDate'

export interface DatePickerProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
}

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const

function parseDateKey(dateKey: string): Date | null {
  if (!dateKey) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function formatDisplay(dateKey: string): string {
  const date = parseDateKey(dateKey)
  if (!date) return ''
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

export default function DatePicker({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  id,
}: DatePickerProps) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const todayKey = toDateKey()
  const selected = parseDateKey(value)
  const [viewYear, setViewYear] = useState(() => selected?.getFullYear() ?? new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(() => (selected?.getMonth() ?? new Date().getMonth()) + 1)

  useEffect(() => {
    if (!open) return
    const selectedDate = parseDateKey(value)
    if (selectedDate) {
      setViewYear(selectedDate.getFullYear())
      setViewMonth(selectedDate.getMonth() + 1)
    }
  }, [open, value])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  function shiftMonth(delta: number) {
    const dt = new Date(viewYear, viewMonth - 1 + delta, 1)
    setViewYear(dt.getFullYear())
    setViewMonth(dt.getMonth() + 1)
  }

  const firstDay = new Date(viewYear, viewMonth - 1, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) =>
    i < firstDay ? null : i - firstDay + 1,
  )

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={inputId}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={[
          'flex h-full w-full min-w-[148px] items-center gap-2 rounded-lg border border-salon-border bg-white px-3 text-sm transition-colors',
          value ? 'text-salon-text' : 'text-salon-muted',
          'hover:border-salon-primary/40 focus:outline-none focus:ring-2 focus:ring-salon-primary/30',
        ].join(' ')}
      >
        <CalendarDays size={16} className="shrink-0 text-salon-primary" />
        <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby={inputId}
          className="absolute right-0 top-[calc(100%+6px)] z-50 w-[280px] overflow-hidden rounded-xl border border-salon-border bg-white p-3 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-salon-muted transition-colors hover:bg-salon-primary-light hover:text-salon-primary"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-salon-text">
              {monthLabel(viewYear, viewMonth)}
            </span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-salon-muted transition-colors hover:bg-salon-primary-light hover:text-salon-primary"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-1 text-center text-[11px] font-bold uppercase tracking-wide text-salon-muted"
              >
                {label}
              </div>
            ))}

            {cells.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} aria-hidden />
              }

              const dateKey = `${String(viewYear).padStart(4, '0')}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = value === dateKey
              const isToday = todayKey === dateKey

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    onChange(dateKey)
                    setOpen(false)
                  }}
                  className={[
                    'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition-colors',
                    isSelected
                      ? 'bg-salon-primary text-white shadow-sm'
                      : isToday
                        ? 'text-salon-primary ring-1 ring-inset ring-salon-primary/35 hover:bg-salon-primary-light'
                        : 'text-salon-text hover:bg-salon-primary-light hover:text-salon-primary',
                  ].join(' ')}
                >
                  {day}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-salon-border pt-3">
            <button
              type="button"
              onClick={() => {
                onChange(todayKey)
                setOpen(false)
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-salon-primary transition-colors hover:bg-salon-primary-light"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-salon-muted transition-colors hover:bg-salon-primary-light hover:text-salon-primary"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
