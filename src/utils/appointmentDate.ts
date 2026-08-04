/** Local YYYY-MM-DD (device timezone) */
export function toDateKey(d = new Date()): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  
  export function addDays(dateKey: string, days: number): string {
    const [y, m, d] = dateKey.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + days)
    return toDateKey(dt)
  }
  
  /** UI label for <input type="date"> value */
  export function formatDateLabel(dateKey: string): string {
    const [y, m, d] = dateKey.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }
  
  export function formatTime12(hhmm: string): string {
    const [hStr, mStr] = hhmm.split(':')
    let h = Number(hStr)
    const m = mStr ?? '00'
    const ampm = h >= 12 ? 'PM' : 'AM'
    h = h % 12 || 12
    return `${h}:${m} ${ampm}`
  }