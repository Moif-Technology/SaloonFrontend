import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Package,
  Pencil,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import Button from '../common/Button'

export interface ProductListModalProps {
  open: boolean
  onClose: () => void
}

type ProductRow = {
  id: string
  name: string
  category: string
  sku: string
  unitPrice: number
  stockQty: number
}

const MOCK_PRODUCTS: ProductRow[] = [
  {
    id: '1',
    name: 'Keratin Shampoo',
    category: 'Haircare',
    sku: 'HC-001',
    unitPrice: 450,
    stockQty: 24,
  },
  {
    id: '2',
    name: 'Vitamin C Serum',
    category: 'Skincare',
    sku: 'SC-014',
    unitPrice: 890,
    stockQty: 12,
  },
  {
    id: '3',
    name: 'Nail Polish Remover',
    category: 'Nailcare',
    sku: 'NC-003',
    unitPrice: 180,
    stockQty: 40,
  },
]

export default function ProductListModal({
  open,
  onClose,
}: ProductListModalProps) {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [formCategoryDropdownOpen, setFormCategoryDropdownOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formSku, setFormSku] = useState('')
  const [skuMode, setSkuMode] = useState<'auto' | 'manual'>('auto')
  const [formUnitPrice, setFormUnitPrice] = useState('')
  const [formStockQty, setFormStockQty] = useState('')
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const rows = products.filter((p) => {
    if (category !== 'All' && p.category !== category) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (!showToast) return

    const timer = window.setTimeout(() => {
      setShowToast(false)
    }, 3000)

    return () => window.clearTimeout(timer)
  }, [showToast])

  function generateSku(productCategory: string) {
    const prefixMap: Record<string, string> = {
      Haircare: 'HC',
      Skincare: 'SC',
      Nailcare: 'NC',
    }

    const prefix = prefixMap[productCategory] ?? 'PROD'

    const categoryProducts = products.filter(
      (product) => product.category === productCategory,
    )

    const nextNumber = categoryProducts.length + 1

    return `${prefix}-${String(nextNumber).padStart(3, '0')}`
  }

  function resetForm() {
    setEditingId(null)
    setFormName('')
    setFormCategory('')
    setSkuMode('auto')
    setFormSku('')
    setFormUnitPrice('')
    setFormStockQty('')
    setFormCategoryDropdownOpen(false)
    setSubmitted(false)
  }

  function openAddForm() {
    resetForm()
    setFormOpen(true)
  }

  function openEditForm(p: ProductRow) {
    setEditingId(p.id)
    setFormName(p.name)
    setFormCategory(p.category)
    setSkuMode('manual')
    setFormSku(p.sku)
    setFormUnitPrice(String(p.unitPrice))
    setFormStockQty(String(p.stockQty))
    setFormOpen(true)
    setSubmitted(false)
  }

  function handleSave() {
    setSubmitted(true)

    if (
      !formName.trim() ||
      !formSku.trim() ||
      !formCategory.trim() ||
      !formUnitPrice.trim() ||
      !formStockQty.trim()
    ) {
      return
    }

    const unitPrice = Number(formUnitPrice)
    const stockQty = Number(formStockQty)

    if (!Number.isFinite(unitPrice) || !Number.isFinite(stockQty)) {
      return
    }

    const isEditing = Boolean(editingId)

    if (editingId) {
      setProducts((prev) =>
        prev.map((row) =>
          row.id === editingId
            ? {
                ...row,
                name: formName.trim(),
                category: formCategory,
                sku: formSku.trim(),
                unitPrice,
                stockQty,
              }
            : row,
        ),
      )
    } else {
      setProducts((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          name: formName.trim(),
          category: formCategory,
          sku: formSku.trim(),
          unitPrice,
          stockQty,
        },
      ])
    }

    setToastMessage(
      isEditing
        ? 'Product updated successfully'
        : 'Product added successfully',
    )

    setShowToast(true)

    resetForm()
    setFormOpen(false)
  }

  function confirmDelete() {
    if (!deleteTarget) return

    setProducts((prev) =>
      prev.filter((row) => row.id !== deleteTarget.id),
    )

    setDeleteTarget(null)

    setToastMessage('Product deleted successfully')
    setShowToast(true)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-list-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Toast Notification placed at the bottom right */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-xl bg-[#6b1d2f] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
            ✓
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative flex h-full max-h-[min(800px,92dvh)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 flex-col gap-3 border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
                <Package size={22} />
              </span>
              <div className="min-w-0">
                <h2
                  id="product-list-title"
                  className="text-xl font-bold text-salon-text"
                >
                  Product List
                </h2>
                <p className="mt-0.5 text-sm font-medium text-salon-muted">
                  Manage salon retail and professional products
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={openAddForm}
                className="h-10 rounded-xl bg-[#6b1d2f] px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                + Add New Product
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
                aria-label="Close"
              >
                <X size={22} />
              </button>
            </div>
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
                placeholder="Search product name or SKU…"
                className="h-10 w-full rounded-xl border border-salon-border bg-white py-2 pl-10 pr-3 text-sm font-medium outline-none transition focus:border-salon-primary focus:ring-2 focus:ring-[#6b1d2f]/10"
              />
            </label>
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() =>
                  setCategoryDropdownOpen((prev) => !prev)
                }
                className="flex h-10 min-w-[160px] items-center justify-between gap-3 rounded-xl border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-900 shadow-sm transition hover:bg-rose-50 focus:outline-none"
                aria-haspopup="listbox"
                aria-expanded={categoryDropdownOpen}
              >
                <span>
                  {category === 'All' ? 'All categories' : category}
                </span>

                <ChevronDown
                  size={16}
                  className={`text-[#6b1d2f] transition-transform ${
                    categoryDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {categoryDropdownOpen && (
                <div
                  className="absolute right-0 top-11 z-30 w-full min-w-[160px] overflow-hidden rounded-xl border border-rose-200 bg-white p-1.5 shadow-xl"
                  role="listbox"
                >
                  {[
                    { value: 'All', label: 'All categories' },
                    { value: 'Haircare', label: 'Haircare' },
                    { value: 'Skincare', label: 'Skincare' },
                    { value: 'Nailcare', label: 'Nailcare' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setCategory(option.value)
                        setCategoryDropdownOpen(false)
                      }}
                      className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                        category === option.value
                          ? 'bg-[#6b1d2f] text-white'
                          : 'text-rose-900 hover:bg-rose-50'
                      }`}
                      role="option"
                      aria-selected={category === option.value}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto bg-slate-50/80 px-4 pb-3 md:px-5">
          {rows.length === 0 ? (
            <p className="py-12 text-center text-sm font-medium text-salon-muted">
              No products match your search.
            </p>
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-salon-border bg-salon-surface text-[11px] font-bold uppercase tracking-wide text-salon-muted">
                  <th className="px-2 py-2">Product Name</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">SKU</th>
                  <th className="px-2 py-2">Unit Price</th>
                  <th className="px-2 py-2">Stock Qty</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-salon-border text-salon-text"
                  >
                    <td className="px-2 py-2 font-semibold">{p.name}</td>
                    <td className="px-2 py-2">{p.category}</td>
                    <td className="px-2 py-2 tabular-nums text-salon-muted">
                      {p.sku}
                    </td>
                    <td className="px-2 py-2 tabular-nums">₹{p.unitPrice}</td>
                    <td className="px-2 py-2 tabular-nums">{p.stockQty}</td>
                    <td className="px-2 py-2">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEditForm(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-salon-muted hover:bg-salon-primary-light hover:text-salon-primary"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget(p)}
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
            <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#6b1d2f]/10 bg-white shadow-xl">
              <div className="flex shrink-0 items-center justify-between border-b border-[#6b1d2f]/10 bg-gradient-to-r from-[#6b1d2f]/8 to-transparent px-5 py-4">
                <h3 className="text-lg font-bold text-salon-text">
                  {editingId ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    resetForm()
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-salon-muted transition hover:bg-[#6b1d2f]/10 hover:text-[#6b1d2f]"
                  aria-label="Close form"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 p-5 sm:p-6">
                <label className="block text-sm font-semibold text-salon-text">
                  Product Name *
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Keratin Shampoo"
                    className={[
                      'mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      submitted && !formName.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-salon-border focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />
                </label>

                <div className="relative block text-sm font-semibold text-salon-text">
                  <span>Category *</span>

                  <button
                    type="button"
                    onClick={() =>
                      setFormCategoryDropdownOpen((prev) => !prev)
                    }
                    className={[
                      'mt-1 flex h-10 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-sm font-medium shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#6b1d2f]/10',
                      submitted && !formCategory.trim()
                        ? 'border-red-400 text-rose-900 focus:border-red-500'
                        : 'border-rose-200 text-rose-900 hover:bg-rose-50',
                    ].join(' ')}
                  >
                    <span>{formCategory || 'Select category'}</span>

                    <ChevronDown
                      size={16}
                      className={`text-[#6b1d2f] transition-transform ${
                        formCategoryDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {formCategoryDropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-[4.5rem] z-30 overflow-hidden rounded-xl border border-rose-200 bg-white p-1.5 shadow-xl"
                      role="listbox"
                    >
                      {['Haircare', 'Skincare', 'Nailcare'].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => {
                            setFormCategory(option)

                            if (skuMode === 'auto') {
                              setFormSku(generateSku(option))
                            }

                            setFormCategoryDropdownOpen(false)
                          }}
                          className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                            formCategory === option
                              ? 'bg-[#6b1d2f] text-white'
                              : 'text-rose-900 hover:bg-rose-50'
                          }`}
                          role="option"
                          aria-selected={formCategory === option}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="block text-sm font-semibold text-salon-text">
                  <div className="flex items-center justify-between">
                    <span>SKU *</span>

                    <div className="flex items-center rounded-lg border border-rose-200 bg-rose-50 p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSkuMode('auto')
                        
                          if (formCategory) {
                            setFormSku(generateSku(formCategory))
                          } else {
                            setFormSku('')
                          }
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          skuMode === 'auto'
                            ? 'bg-[#6b1d2f] text-white'
                            : 'text-rose-900 hover:bg-white'
                        }`}
                      >
                        Auto
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSkuMode('manual')
                        }}
                        className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                          skuMode === 'manual'
                            ? 'bg-[#6b1d2f] text-white'
                            : 'text-rose-900 hover:bg-white'
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    disabled={skuMode === 'auto'}
                    placeholder={skuMode === 'auto' ? 'Auto-generated SKU' : 'e.g. HC-004'}
                    className={[
                      'mt-1 h-10 w-full rounded-xl border px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      skuMode === 'auto'
                        ? 'cursor-not-allowed border-rose-100 bg-rose-50 text-rose-800'
                        : submitted && !formSku.trim()
                          ? 'border-red-400 bg-white focus:border-red-500'
                          : 'border-salon-border bg-white focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />

                  <p className="mt-1 text-[11px] font-medium text-salon-muted">
                    {skuMode === 'auto'
                      ? 'SKU will be generated automatically.'
                      : 'Enter a custom SKU manually.'}
                  </p>
                </div>

                <label className="block text-sm font-semibold text-salon-text">
                  Unit Price *
                  <input
                    type="number"
                    min={0}
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    placeholder="e.g. 450"
                    className={[
                      'mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      submitted && !formUnitPrice.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-salon-border focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />
                </label>

                <label className="block text-sm font-semibold text-salon-text">
                  Stock Qty *
                  <input
                    type="number"
                    min={0}
                    value={formStockQty}
                    onChange={(e) => setFormStockQty(e.target.value)}
                    placeholder="e.g. 24"
                    className={[
                      'mt-1 h-10 w-full rounded-xl border bg-white px-3 text-sm font-medium outline-none transition focus:ring-2 focus:ring-[#6b1d2f]/10',
                      submitted && !formStockQty.trim()
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-salon-border focus:border-[#6b1d2f]',
                    ].join(' ')}
                  />
                </label>

                <div className="mt-6 flex gap-3 pt-2">
                  <Button
                    variant="secondary"
                    size="compact"
                    fullWidth
                    onClick={() => {
                      setFormOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="compact"
                    fullWidth
                    onClick={handleSave}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-2xl border border-rose-200 bg-white p-5 shadow-xl">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                  <Trash2 size={20} />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-bold text-rose-950">
                    Delete Product?
                  </h3>

                  <p className="mt-1 text-sm leading-5 text-salon-muted">
                    Are you sure you want to delete{' '}
                    <span className="font-semibold text-salon-text">
                      {deleteTarget.name}
                    </span>
                    ? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <Button
                  variant="secondary"
                  size="compact"
                  fullWidth
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>

                <button
                  type="button"
                  onClick={confirmDelete}
                  className="h-9 w-full rounded-lg bg-[#6b1d2f] px-4 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}