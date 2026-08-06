/**
 * Group List — search, New / Edit. Double-click opens Group Entry.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FolderPlus, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react'
import { fetchGroups } from '../../api/groups'
import GroupDetailsModal from './GroupDetailsModal'
import type { CatalogueGroup } from '../../types/group'

type GroupRow = {
  id: string
  code: string
  name: string
  active: boolean
  sortOrder?: number
}

interface GroupListDialogProps {
  open: boolean
  onClose: () => void
  onError?: (message: string) => void
  onInfo?: (message: string) => void
  /** Refresh POS catalogue after save */
  onCatalogueChanged?: () => void
}

function toRow(g: CatalogueGroup): GroupRow {
  return {
    id: g.id,
    code: g.code ?? '',
    name: g.name,
    active: g.active !== false,
    sortOrder: g.sortOrder,
  }
}

function toCatalogue(row: GroupRow): CatalogueGroup {
  return {
    id: row.id,
    name: row.name,
    code: row.code || undefined,
    active: row.active,
    sortOrder: row.sortOrder,
  }
}

export default function GroupListDialog({
  open,
  onClose,
  onError,
  onInfo,
  onCatalogueChanged,
}: GroupListDialogProps) {
  const [rows, setRows] = useState<GroupRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<CatalogueGroup | null>(null)
  const backdropDownRef = useRef(false)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await fetchGroups()
      setRows(list.map(toRow))
    } catch (e) {
      onErrorRef.current?.(e instanceof Error ? e.message : 'Failed to load groups')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Reset + load only when dialog opens — not when parent re-renders
  useEffect(() => {
    if (!open) return
    setSearch('')
    setSelectedId(null)
    setEntryOpen(false)
    setEditGroup(null)
    void load()
  }, [open, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q),
    )
  }, [rows, search])

  function openCreate() {
    setEditGroup(null)
    setEntryOpen(true)
  }

  function openEdit(row: GroupRow) {
    setEditGroup(toCatalogue(row))
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
          className="flex h-[min(640px,92dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-salon-border px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <FolderPlus size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-salon-text">Group List</h2>
              <p className="text-xs text-salon-muted">{filtered.length} groups</p>
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
                placeholder="Search name, code…"
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
            {loading && rows.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-salon-muted">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-salon-muted">No groups found</div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#F7F5F6]">
                  <tr>
                    {['#', 'Code', 'Name', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="border-b border-salon-border px-3 py-2.5 text-left text-[11px] font-extrabold uppercase tracking-wide text-salon-muted"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const selected = row.id === selectedId
                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        onDoubleClick={() => openEdit(row)}
                        className={[
                          'cursor-pointer border-b border-salon-border',
                          selected ? 'bg-salon-primary/10' : i % 2 ? 'bg-[#FAFAFA]' : 'bg-white',
                          'hover:bg-salon-primary/5',
                        ].join(' ')}
                      >
                        <td className="px-3 py-2.5 tabular-nums text-salon-muted">{i + 1}</td>
                        <td className="px-3 py-2.5 font-semibold tabular-nums">{row.code || '—'}</td>
                        <td className="px-3 py-2.5 font-semibold text-salon-text">{row.name}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={[
                              'inline-flex rounded-lg px-2 py-0.5 text-xs font-bold',
                              row.active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-salon-bg text-salon-muted',
                            ].join(' ')}
                          >
                            {row.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          <footer className="shrink-0 border-t border-salon-border px-4 py-2 text-xs text-salon-muted">
            Double-click a row (or select + Edit) to open Group Entry. Uncheck Active to hide from POS.
          </footer>
        </div>
      </div>

      <GroupDetailsModal
        open={entryOpen}
        onClose={() => {
          setEntryOpen(false)
          setEditGroup(null)
        }}
        initialGroup={editGroup}
        onSaved={() => {
          setEntryOpen(false)
          setEditGroup(null)
          onInfo?.(editGroup ? 'Group updated' : 'Group saved')
          void load()
          onCatalogueChanged?.()
        }}
        onError={onError}
      />
    </>
  )
}
