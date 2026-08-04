import { useEffect, useState, type FormEvent } from 'react'
import { X, PackagePlus, Save, ScanBarcode, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import { createProduct, updateProduct } from '../../api/products'
import { fetchGroups } from '../../api/groups'
import type { CatalogueGroup } from '../../types/group'
import type {
  CatalogueProduct,
  ProductFormValues,
} from '../../types/product'

export interface ProductDetailsModalProps {
  open: boolean
  onClose: () => void
  /** Pass when editing; omit for create */
  initialProduct?: CatalogueProduct | null
  onSaved?: (product: CatalogueProduct) => void
  onError?: (message: string) => void
}

const emptyForm: ProductFormValues = {
  name: '',
  code: '',
  groupId: '',
  price: undefined,
  cost: undefined,
  stockQty: undefined,
  lowStockThreshold: undefined,
  active: true,
  showOnBackOffice: true,
}

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-base font-medium text-salon-text outline-none focus:border-salon-primary'

const selectClass = inputClass

export default function ProductDetailsModal({
  open,
  onClose,
  initialProduct = null,
  onSaved,
  onError,
}: ProductDetailsModalProps) {
  const [form, setForm] = useState<ProductFormValues>(emptyForm)
  const [groups, setGroups] = useState<CatalogueGroup[]>([])
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  const isEdit = Boolean(initialProduct?.id)

  function resetForm(from?: CatalogueProduct | null) {
    if (from) {
      setForm({
        name: from.name ?? '',
        code: from.code ?? '',
        groupId: from.groupId ?? '',
        price: from.price,
        cost: from.cost,
        stockQty: from.stockQty,
        lowStockThreshold: from.lowStockThreshold,
        active: from.active ?? true,
        showOnBackOffice: from.showOnBackOffice ?? true,
      })
    } else {
      setForm(emptyForm)
    }
    setFieldError(null)
    setSaving(false)
  }

  useEffect(() => {
    if (!open) return
    resetForm(initialProduct)
  }, [open, initialProduct])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadGroups() {
      setLoadingGroups(true)
      try {
        const list = await fetchGroups()
        if (cancelled) return
        setGroups(list.filter((g) => g.active !== false))
      } catch {
        if (!cancelled) onError?.('Could not load groups')
      } finally {
        if (!cancelled) setLoadingGroups(false)
      }
    }
    void loadGroups()
    return () => {
      cancelled = true
    }
  }, [open, onError])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function updateField<K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  function handleNew() {
    resetForm(null)
  }

  async function handleSave() {
    const name = form.name.trim()
    if (!name) {
      setFieldError('Product name is required')
      onError?.('Product name is required')
      return
    }
    if (name.length < 2) {
      setFieldError('Name must be at least 2 characters')
      onError?.('Name must be at least 2 characters')
      return
    }
    if (!form.groupId) {
      setFieldError('Category / group is required')
      onError?.('Category / group is required')
      return
    }
    const price = Number(form.price)
    if (form.price === undefined || Number.isNaN(price) || price < 0) {
      setFieldError('Retail price is required')
      onError?.('Retail price is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        code: form.code?.trim() || undefined,
        groupId: form.groupId,
        price,
        cost:
          form.cost === undefined || Number.isNaN(Number(form.cost))
            ? undefined
            : Number(form.cost),
        stockQty:
          form.stockQty === undefined || Number.isNaN(Number(form.stockQty))
            ? undefined
            : Number(form.stockQty),
        lowStockThreshold:
          form.lowStockThreshold === undefined ||
          Number.isNaN(Number(form.lowStockThreshold))
            ? undefined
            : Number(form.lowStockThreshold),
        active: form.active,
        showOnBackOffice: form.showOnBackOffice,
      }

      const result =
        isEdit && initialProduct
          ? await updateProduct(initialProduct.id, payload)
          : await createProduct(payload)

      onSaved?.(result)
      onClose()
    } catch {
      const message = 'Could not save product'
      setFieldError(message)
      onError?.(message)
    } finally {
      setSaving(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void handleSave()
  }

  function optionalNumber(
    value: string,
    key: keyof Pick<
      ProductFormValues,
      'price' | 'cost' | 'stockQty' | 'lowStockThreshold'
    >,
  ) {
    updateField(key, value === '' ? undefined : Number(value))
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(720px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* Header — same pattern as GroupDetailsModal ~lines 130–157 */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <PackagePlus size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="product-entry-title"
                className="text-xl font-bold text-salon-text"
              >
                {isEdit ? 'Edit Product' : 'Product Entry'}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                {isEdit
                  ? 'Update retail or back-bar product'
                  : 'Create a new retail or back-bar product'}
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
        </header>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            {/* Name * */}
            <div>
              <label
                htmlFor="product-name"
                className="text-sm font-semibold text-salon-text"
              >
                Product Name / Description{' '}
                <span className="text-salon-danger">*</span>
              </label>
              <input
                id="product-name"
                type="text"
                autoFocus
                autoComplete="off"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Shampoo 250ml"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Code / Barcode + scanner icon */}
            <div>
              <label
                htmlFor="product-code"
                className="text-sm font-semibold text-salon-text"
              >
                Product Code / Barcode{' '}
                <span className="font-normal text-salon-muted">(optional)</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="product-code"
                  type="text"
                  autoComplete="off"
                  value={form.code ?? ''}
                  onChange={(e) => updateField('code', e.target.value)}
                  className={`${inputClass} mt-0 pr-12`}
                  placeholder="Scan or type barcode"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-salon-primary"
                  aria-hidden
                >
                  <ScanBarcode size={20} />
                </span>
              </div>
            </div>

            {/* Category / Group */}
            <div>
              <label
                htmlFor="product-group"
                className="text-sm font-semibold text-salon-text"
              >
                Category / Group <span className="text-salon-danger">*</span>
              </label>
              <select
                id="product-group"
                value={form.groupId}
                onChange={(e) => updateField('groupId', e.target.value)}
                className={selectClass}
                disabled={loadingGroups}
              >
                <option value="">
                  {loadingGroups ? 'Loading groups…' : 'Select a group'}
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price & Cost */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="product-price"
                  className="text-sm font-semibold text-salon-text"
                >
                  Retail price <span className="text-salon-danger">*</span>
                </label>
                <input
                  id="product-price"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.price ?? ''}
                  onChange={(e) => optionalNumber(e.target.value, 'price')}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label
                  htmlFor="product-cost"
                  className="text-sm font-semibold text-salon-text"
                >
                  Purchase cost{' '}
                  <span className="font-normal text-salon-muted">(optional)</span>
                </label>
                <input
                  id="product-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  value={form.cost ?? ''}
                  onChange={(e) => optionalNumber(e.target.value, 'cost')}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Stock */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="product-stock"
                  className="text-sm font-semibold text-salon-text"
                >
                  Initial stock{' '}
                  <span className="font-normal text-salon-muted">(optional)</span>
                </label>
                <input
                  id="product-stock"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.stockQty ?? ''}
                  onChange={(e) => optionalNumber(e.target.value, 'stockQty')}
                  className={inputClass}
                  placeholder="0"
                />
              </div>
              <div>
                <label
                  htmlFor="product-low-stock"
                  className="text-sm font-semibold text-salon-text"
                >
                  Low-stock alert{' '}
                  <span className="font-normal text-salon-muted">(optional)</span>
                </label>
                <input
                  id="product-low-stock"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.lowStockThreshold ?? ''}
                  onChange={(e) =>
                    optionalNumber(e.target.value, 'lowStockThreshold')
                  }
                  className={inputClass}
                  placeholder="5"
                />
              </div>
            </div>

            {/* Toggles — same checkbox row style as Active in GroupDetailsModal ~lines 229–239 */}
            <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-salon-border px-4">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField('active', e.target.checked)}
                className="h-5 w-5 accent-[var(--color-salon-primary,#521C1D)]"
              />
              <span className="text-base font-semibold text-salon-text">
                Active
              </span>
            </label>

            <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl border-2 border-salon-border px-4">
              <input
                type="checkbox"
                checked={form.showOnBackOffice}
                onChange={(e) =>
                  updateField('showOnBackOffice', e.target.checked)
                }
                className="h-5 w-5 accent-[var(--color-salon-primary,#521C1D)]"
              />
              <span className="text-base font-semibold text-salon-text">
                Show on Back Office
              </span>
            </label>
          </div>

          {/* Footer: New | Cancel | Save */}
          <footer className="flex shrink-0 flex-wrap items-center gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
            {!isEdit && (
              <Button
                type="button"
                variant="outline"
                size="compact"
                onClick={handleNew}
                disabled={saving}
                icon={<RotateCcw size={18} />}
              >
                New
              </Button>
            )}
            <div className="ml-auto flex min-w-0 flex-1 gap-3 sm:flex-initial sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="compact"
                fullWidth
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="compact"
                fullWidth
                disabled={saving}
                icon={<Save size={18} />}
              >
                {saving ? 'Saving…' : isEdit ? 'Update' : 'Save'}
              </Button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}