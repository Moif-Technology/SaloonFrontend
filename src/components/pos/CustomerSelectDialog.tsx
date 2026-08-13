/**
 * Select customer for current job/bill — search by name or mobile.
 * New opens Customer Entry; Walk-in clears the selection.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Contact, Plus, Search, UserRound, X } from 'lucide-react'
import { apiService } from '../../api/apiService'
import CustomerEntryModal from './CustomerEntryModal'

export type SelectedPosCustomer = {
  id: string
  name: string
  mobile?: string
  code?: string
}

interface CustomerSelectDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (customer: SelectedPosCustomer | null) => void
  onError?: (message: string) => void
  onInfo?: (message: string) => void
  /** Current selection highlight (optional) */
  selectedId?: string | null
}

type Row = SelectedPosCustomer

/** Map Select Customer search into New Customer prefill (mobile vs name). */
function prefillFromSearch(q: string): { name?: string; mobile?: string } | null {
  const trimmed = q.trim()
  if (!trimmed) return null
  const compact = trimmed.replace(/[\s\-()]/g, '')
  if (/^\+?\d{7,15}$/.test(compact)) {
    return { mobile: compact }
  }
  return { name: trimmed }
}

function mapRow(raw: Record<string, unknown>): Row | null {
  const id = String(raw.CustomerID ?? raw.customerId ?? '').trim()
  if (!id || id === '0') return null
  return {
    id,
    name: String(raw.CustomerName ?? raw.customerName ?? '').trim() || 'Customer',
    mobile: String(raw.MobileNo ?? raw.mobileNo ?? raw.Telephone ?? '').trim() || undefined,
    code: String(raw.CustomerCode ?? raw.customerCode ?? '').trim() || undefined,
  }
}

export default function CustomerSelectDialog({
  open,
  onClose,
  onSelect,
  onError,
  onInfo,
  selectedId = null,
}: CustomerSelectDialogProps) {
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [entryOpen, setEntryOpen] = useState(false)
  const [entryPrefill, setEntryPrefill] = useState<{
    name?: string
    mobile?: string
  } | null>(null)
  const backdropDownRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const loadSeqRef = useRef(0)
  const onErrorRef = useRef(onError)
  const onInfoRef = useRef(onInfo)
  const onCloseRef = useRef(onClose)
  const onSelectRef = useRef(onSelect)
  onErrorRef.current = onError
  onInfoRef.current = onInfo
  onCloseRef.current = onClose
  onSelectRef.current = onSelect

  const load = useCallback(async (q: string) => {
    const seq = ++loadSeqRef.current
    setLoading(true)
    try {
      const list = await apiService.fetchCustomers({
        search: q.trim() || undefined,
        limit: 80,
      })
      if (seq !== loadSeqRef.current) return
      setRows(list.map(mapRow).filter((r): r is Row => r != null))
    } catch (e) {
      if (seq !== loadSeqRef.current) return
      setRows([])
      onErrorRef.current?.(e instanceof Error ? e.message : 'Failed to search customers')
    } finally {
      if (seq === loadSeqRef.current) setLoading(false)
    }
  }, [])

  // Clear search when closed so reopen starts clean (avoids stale-query race)
  useEffect(() => {
    if (!open) {
      setSearch('')
      setEntryOpen(false)
      setEntryPrefill(null)
      return
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(t)
  }, [open])

  // Debounced search — load is stable; only re-runs when open/search change
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => void load(search), search ? 280 : 0)
    return () => window.clearTimeout(t)
  }, [search, open, load])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !entryOpen) onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, entryOpen])

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
        role="dialog"
        aria-modal="true"
        aria-label="Select customer"
        onMouseDown={(e) => {
          backdropDownRef.current = e.target === e.currentTarget
        }}
        onClick={(e) => {
          if (e.target !== e.currentTarget || !backdropDownRef.current) return
          backdropDownRef.current = false
          if (window.getSelection()?.toString()) return
          onClose()
        }}
      >
        <div
          className="flex h-[min(560px,90dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-salon-border px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Contact size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-salon-text">Select Customer</h2>
              <p className="text-xs text-salon-muted">Search by name or mobile for this job</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-salon-muted hover:bg-salon-bg"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </header>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-salon-border bg-[#F7F5F6] px-4 py-2.5">
            <div className="relative min-w-[180px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
              />
              <input
                ref={inputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or mobile number…"
                className="h-10 w-full rounded-xl border border-salon-border bg-white pl-9 pr-3 text-sm outline-none focus:border-salon-primary"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setEntryPrefill(prefillFromSearch(search))
                setEntryOpen(true)
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-salon-primary px-3 text-sm font-bold text-white"
            >
              <Plus size={16} /> New
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                onClose()
              }}
              className={[
                'flex w-full items-center gap-3 border-b border-salon-border px-4 py-3 text-left',
                'hover:bg-salon-primary/5',
                !selectedId ? 'bg-salon-primary/10' : 'bg-white',
              ].join(' ')}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-salon-bg text-salon-muted">
                <UserRound size={18} />
              </span>
              <div>
                <div className="font-bold text-salon-text">Walk-in</div>
                <div className="text-xs text-salon-muted">No customer on this bill</div>
              </div>
            </button>

            {loading && rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-salon-muted">Searching…</div>
            ) : rows.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-salon-muted">
                No customers found — try another search or New
              </div>
            ) : (
              <ul className="m-0 list-none p-0">
                {rows.map((row) => {
                  const selected = row.id === selectedId
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(row)
                          onClose()
                        }}
                        className={[
                          'flex w-full items-center gap-3 border-b border-salon-border px-4 py-3 text-left',
                          'hover:bg-salon-primary/5',
                          selected ? 'bg-salon-primary/10' : '',
                        ].join(' ')}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-salon-primary-light text-sm font-bold text-salon-primary">
                          {row.name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-bold text-salon-text">{row.name}</div>
                          <div className="truncate text-xs text-salon-muted">
                            {[row.mobile, row.code].filter(Boolean).join(' · ') || '—'}
                          </div>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <CustomerEntryModal
        open={entryOpen}
        onClose={() => {
          setEntryOpen(false)
          setEntryPrefill(null)
        }}
        prefill={entryPrefill}
        onSaved={(customer) => {
          setEntryOpen(false)
          setEntryPrefill(null)
          onInfoRef.current?.('Customer saved')
          const raw = (customer ?? {}) as Record<string, unknown>
          const id = String(raw.id ?? raw.customerId ?? raw.CustomerID ?? '').trim()
          const name = String(raw.name ?? raw.customerName ?? raw.CustomerName ?? '').trim()
          const mobile = String(raw.mobile ?? raw.mobileNo ?? raw.MobileNo ?? '').trim()
          if (id && name) {
            onSelectRef.current({ id, name, mobile: mobile || undefined })
            onCloseRef.current()
          } else if (name) {
            onSelectRef.current({ id: id || '0', name, mobile: mobile || undefined })
            onCloseRef.current()
          }
          void load(search)
        }}
        onError={(msg) => onErrorRef.current?.(msg)}
      />
    </>
  )
}
