/**
 * Product List — essential columns. Double-click / Edit opens Product Entry.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Boxes, Pencil, Plus, RefreshCw, Search, X } from 'lucide-react'
import { apiService } from '../../api/apiService'
import ProductDetailsModal from './ProductDetailsModal'
import type { CatalogueProduct } from '../../types/product'
import { fmtMoney } from '../../utils/posSession'

type ProductRow = {
  id: string
  code: string
  name: string
  groupId: string
  groupName: string
  price: number
  productType: string
  active: boolean
  cost?: number
  stockQty?: number
}

interface ProductListDialogProps {
  open: boolean
  onClose: () => void
  onError?: (message: string) => void
  onInfo?: (message: string) => void
  /** Refresh POS catalogue after save */
  onCatalogueChanged?: () => void
}

function mapProduct(raw: Record<string, unknown>, groupNames: Map<string, string>): ProductRow {
  const inv =
    raw.inventory && typeof raw.inventory === 'object'
      ? (raw.inventory as Record<string, unknown>)
      : {}
  const id = String(raw.ProductID ?? raw.productId ?? '').trim()
  const groupId = String(raw.GroupID ?? raw.groupId ?? '').trim()
  const productType = String(raw.ProductType ?? raw.productType ?? raw.LineType ?? '').trim()
  const price = Number(raw.UnitPrice ?? inv.unitPrice ?? raw.unitPrice ?? 0) || 0
  const name = String(
    raw.ProductName ?? raw.productName ?? raw.ShortDescription ?? '',
  ).trim()
  const status = String(raw.productStatus ?? raw.recordStatus ?? 'ACTIVE').toUpperCase()

  return {
    id,
    code: String(raw.ProductCode ?? raw.productCode ?? '').trim(),
    name,
    groupId,
    groupName: groupNames.get(groupId) || groupId || '—',
    price,
    productType: productType || '—',
    active: status === 'ACTIVE' || status === '',
    cost: inv.averageCost != null ? Number(inv.averageCost) : undefined,
    stockQty: inv.qtyOnHand != null ? Number(inv.qtyOnHand) : undefined,
  }
}

function toCatalogueProduct(row: ProductRow): CatalogueProduct {
  return {
    id: row.id,
    name: row.name,
    code: row.code || undefined,
    groupId: row.groupId,
    price: row.price,
    cost: row.cost,
    stockQty: row.stockQty,
    active: row.active,
    showOnBackOffice: true,
  }
}

export default function ProductListDialog({
  open,
  onClose,
  onError,
  onInfo,
  onCatalogueChanged,
}: ProductListDialogProps) {
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [entryOpen, setEntryOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<CatalogueProduct | null>(null)
  const backdropDownRef = useRef(false)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError
  const searchRef = useRef(search)
  searchRef.current = search

  const load = useCallback(async (q?: string) => {
    const query = q !== undefined ? q : searchRef.current
    setLoading(true)
    try {
      const [groupRows, productRows] = await Promise.all([
        apiService.fetchGroups(),
        apiService.fetchProducts({
          limit: 2000,
          search: query.trim() || undefined,
        }),
      ])
      const names = new Map<string, string>()
      for (const g of groupRows) {
        const id = String(g.GroupID ?? '').trim()
        const name = String(g.GroupDescription ?? '').trim()
        if (id) names.set(id, name || id)
      }
      setRows(productRows.map((r) => mapProduct(r, names)))
    } catch (e) {
      onErrorRef.current?.(e instanceof Error ? e.message : 'Failed to load products')
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
    setEditProduct(null)
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
        r.groupName.toLowerCase().includes(q) ||
        r.productType.toLowerCase().includes(q),
    )
  }, [rows, search])

  function openCreate() {
    setEditProduct(null)
    setEntryOpen(true)
  }

  function openEdit(row: ProductRow) {
    setEditProduct(toCatalogueProduct(row))
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
          className="flex h-[min(640px,92dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
          onMouseDown={() => {
            backdropDownRef.current = false
          }}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-salon-border px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Boxes size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-salon-text">Product List</h2>
              <p className="text-xs text-salon-muted">{filtered.length} products</p>
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
                placeholder="Search code, name, group…"
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
                  <th className="px-3 py-2.5 font-semibold">Group</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Price</th>
                </tr>
              </thead>
              <tbody>
                {loading && filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-salon-muted">
                      Loading…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-10 text-center text-salon-muted">
                      No products found
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
                        <td className="px-3 py-2.5">{row.groupName}</td>
                        <td className="px-3 py-2.5 uppercase text-salon-muted">{row.productType}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                          {fmtMoney(row.price)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="shrink-0 border-t border-salon-border px-4 py-2 text-xs text-salon-muted">
            Double-click a row (or select + Edit) to open Product Entry
          </footer>
        </div>
      </div>

      <ProductDetailsModal
        open={entryOpen}
        onClose={() => {
          setEntryOpen(false)
          setEditProduct(null)
        }}
        initialProduct={editProduct}
        onSaved={() => {
          setEntryOpen(false)
          setEditProduct(null)
          onInfo?.(editProduct ? 'Product updated' : 'Product saved')
          void load()
          onCatalogueChanged?.()
        }}
        onError={onError}
      />
    </>
  )
}
