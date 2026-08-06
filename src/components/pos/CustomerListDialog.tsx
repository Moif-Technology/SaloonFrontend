/**
 * Customer List — essential columns only. Double-click to edit.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Contact, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react'
import { apiService } from '../../api/apiService'
import CustomerEntryModal from './CustomerEntryModal'

type CustomerRow = {
  id: string
  code: string
  name: string
  mobile: string
  address: string
  email: string
  raw: Record<string, unknown>
}

interface CustomerListDialogProps {
  open: boolean
  onClose: () => void
  onError?: (message: string) => void
  onInfo?: (message: string) => void
}

function mapCustomer(raw: Record<string, unknown>): CustomerRow {
  const id = String(raw.CustomerID ?? raw.customerId ?? '').trim()
  return {
    id,
    code: String(raw.CustomerCode ?? raw.customerCode ?? '').trim(),
    name: String(raw.CustomerName ?? raw.customerName ?? '').trim(),
    mobile: String(raw.MobileNo ?? raw.mobileNo ?? raw.Telephone ?? '').trim(),
    address: String(raw.Address ?? raw.address ?? '').trim(),
    email: String(raw.email ?? raw.Email ?? '').trim(),
    raw,
  }
}

export default function CustomerListDialog({
  open,
  onClose,
  onError,
  onInfo,
}: CustomerListDialogProps) {
  const [rows, setRows] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<CustomerRow | null>(null)
  const backdropDownRef = useRef(false)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const searchRef = useRef(search)
  searchRef.current = search

  const load = useCallback(async (q?: string) => {
    const query = q !== undefined ? q : searchRef.current
    setLoading(true)
    try {
      const list = await apiService.fetchCustomers({
        limit: 500,
        search: query.trim() || undefined,
      })
      setRows(list.map((r) => mapCustomer(r)))
    } catch (e) {
      onErrorRef.current?.(e instanceof Error ? e.message : 'Failed to load customers')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedId(null)
    setEntryOpen(false)
    setEditCustomer(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => void load(search), search ? 250 : 0)
    return () => window.clearTimeout(t)
  }, [open, search, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.mobile.toLowerCase().includes(q),
    )
  }, [rows, search])

  function openCreate() {
    setEditCustomer(null)
    setEntryOpen(true)
  }

  function openEdit(row: CustomerRow) {
    setEditCustomer(row)
    setEntryOpen(true)
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          // Only treat as backdrop dismiss if press started on the overlay
          // (avoids closing when mouse-selecting text and releasing outside).
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
          className="flex h-[min(640px,92dvh)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-salon-border px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Contact size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-salon-text">Customer List</h2>
              <p className="text-xs text-salon-muted">{filtered.length} customers</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-salon-muted hover:bg-salon-bg"
              aria-label="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
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
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-salon-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, mobile…"
                className="h-10 w-full rounded-xl border border-salon-border bg-white pl-9 pr-3 text-sm outline-none focus:border-salon-primary"
              />
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-salon-primary px-3 text-sm font-bold text-white"
            >
              <Plus size={16} /> New
            </button>
            <button
              type="button"
              disabled={!selectedId}
              onClick={() => {
                const row = rows.find((r) => r.id === selectedId)
                if (row) openEdit(row)
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-salon-border bg-white px-3 text-sm font-semibold text-salon-primary disabled:opacity-40"
            >
              <Pencil size={16} /> Edit
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 bg-salon-primary text-white">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Code</th>
                  <th className="px-3 py-2.5 font-semibold">Name</th>
                  <th className="px-3 py-2.5 font-semibold">Mobile</th>
                  <th className="px-3 py-2.5 font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-salon-muted">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-salon-muted">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => {
                    const selected = row.id === selectedId
                    return (
                      <tr
                        key={row.id || `${row.code}-${i}`}
                        className={[
                          'cursor-pointer border-b border-salon-border/70',
                          selected
                            ? 'bg-salon-primary-light'
                            : i % 2
                              ? 'bg-[#FAFAFA]'
                              : 'bg-white',
                          'hover:bg-salon-primary-light/60',
                        ].join(' ')}
                        onClick={() => setSelectedId(row.id)}
                        onDoubleClick={() => openEdit(row)}
                      >
                        <td className="px-3 py-2.5 font-medium tabular-nums">{row.code || '—'}</td>
                        <td className="px-3 py-2.5 font-semibold text-salon-text">{row.name || '—'}</td>
                        <td className="px-3 py-2.5 tabular-nums">{row.mobile || '—'}</td>
                        <td className="max-w-[240px] truncate px-3 py-2.5 text-salon-muted">
                          {row.address || '—'}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="shrink-0 border-t border-salon-border px-4 py-2 text-xs text-salon-muted">
            Double-click a row to edit
          </footer>
        </div>
      </div>

      <CustomerEntryModal
        open={entryOpen}
        onClose={() => {
          setEntryOpen(false)
          setEditCustomer(null)
        }}
        initialCustomer={
          editCustomer
            ? {
                id: editCustomer.id,
                name: editCustomer.name,
                mobile: editCustomer.mobile,
                email: editCustomer.email,
                address: editCustomer.address,
              }
            : null
        }
        onSaved={() => {
          setEntryOpen(false)
          setEditCustomer(null)
          onInfo?.(editCustomer ? 'Customer updated' : 'Customer saved')
          void load()
        }}
        onError={onError}
      />
    </>
  )
}
