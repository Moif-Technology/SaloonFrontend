import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X, PackagePlus, Save, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import { createProduct, updateProduct } from '../../api/products'
import { fetchGroups } from '../../api/groups'
import type { CatalogueGroup } from '../../types/group'
import type {
  CatalogueProduct,
  ProductFormValues,
} from '../../types/product'
/** Sequential system codes: PRD-001, PRD-002, … */
const PRODUCT_CODE_PREFIX = 'PRD-'
const PRODUCT_CODE_SEQ_KEY = 'salon-pos-product-code-seq'

function formatProductSystemCode(seq: number): string {
  return `${PRODUCT_CODE_PREFIX}${String(seq).padStart(3, '0')}`
}

function readProductCodeSeq(): number {
  try {
    const n = Number(localStorage.getItem(PRODUCT_CODE_SEQ_KEY))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
  } catch {
    return 1
  }
}

function peekNextSystemProductCode(): string {
  return formatProductSystemCode(readProductCodeSeq())
}

function advanceProductCodeSeqAfterSave(code: string) {
  const match = code
    .trim()
    .toUpperCase()
    .match(/^PRD-(\d+)$/)
  if (!match) return
  const used = Number(match[1])
  if (!Number.isFinite(used) || used < 1) return
  try {
    const next = Math.max(readProductCodeSeq(), used + 1)
    localStorage.setItem(PRODUCT_CODE_SEQ_KEY, String(next))
  } catch {
    // ignore
  }
}
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
  const [codeMode, setCodeMode] = useState<'auto' | 'manual'>('auto')
  const isEdit = Boolean(initialProduct?.id)
  const backdropDownRef = useRef(false)
  const sessionKeyRef = useRef<string | null>(null)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

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
      setCodeMode('manual')
    } else {
      setForm({
        ...emptyForm,
        code: peekNextSystemProductCode(),
      })
      setCodeMode('auto')
    }
    setFieldError(null)
    setSaving(false)
  }

  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null
      return
    }
    const key = initialProduct?.id ?? 'new'
    if (sessionKeyRef.current === key) return
    sessionKeyRef.current = key
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
        if (!cancelled) onErrorRef.current?.('Could not load groups')
      } finally {
        if (!cancelled) setLoadingGroups(false)
      }
    }
    void loadGroups()
    return () => {
      cancelled = true
    }
  }, [open])

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
  function handleCodeChange(code: string) {
    updateField('code', code)
  }
  
  function handleCodeModeChange(mode: 'auto' | 'manual') {
    setCodeMode(mode)
    setFieldError(null)
    if (mode === 'auto') {
      updateField('code', peekNextSystemProductCode())
    }
  }

  function handleNew() {
    resetForm(null)
  }
  async function handleSave() {
    const code = (form.code ?? '').trim()
    if (!code) {
      const message = 'Product code / barcode is required'
      setFieldError(message)
      onError?.(message)
      return
    }
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
        code,
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

if (!isEdit) {
  advanceProductCodeSeqAfterSave(code)
}

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
        className="flex w-full max-h-[min(720px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
        onMouseDown={() => {
          backdropDownRef.current = false
        }}
      >
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
         {/* Code / Barcode */}
<div>
  <div className="flex flex-wrap items-center justify-between gap-2">
    <label
      htmlFor="product-code"
      className="text-sm font-semibold text-salon-text"
    >
      Product Code / Barcode <span className="text-salon-danger">*</span>
    </label>

    <div
      className="inline-flex h-9 shrink-0 items-center rounded-lg border-2 border-salon-border bg-salon-bg p-0.5"
      role="group"
      aria-label="Barcode entry mode"
    >
      <button
        type="button"
        onClick={() => handleCodeModeChange('auto')}
        className={`h-full min-w-[4.5rem] rounded-md px-3 text-xs font-bold transition-colors ${
          codeMode === 'auto'
            ? 'bg-salon-primary text-white shadow-sm'
            : 'text-salon-muted hover:text-salon-text'
        }`}
        aria-pressed={codeMode === 'auto'}
      >
        Auto
      </button>
      <button
        type="button"
        onClick={() => handleCodeModeChange('manual')}
        className={`h-full min-w-[4.5rem] rounded-md px-3 text-xs font-bold transition-colors ${
          codeMode === 'manual'
            ? 'bg-salon-primary text-white shadow-sm'
            : 'text-salon-muted hover:text-salon-text'
        }`}
        aria-pressed={codeMode === 'manual'}
      >
        Manual
      </button>
    </div>
  </div>

  <input
    id="product-code"
    type="text"
    autoComplete="off"
    autoFocus={codeMode === 'manual'}
    required
    value={form.code ?? ''}
    onChange={(e) => handleCodeChange(e.target.value)}
    readOnly={codeMode === 'auto'}
    tabIndex={codeMode === 'auto' ? -1 : 0}
    className={`${inputClass} ${
      codeMode === 'auto'
        ? 'cursor-not-allowed bg-salon-bg font-semibold tracking-wide text-salon-primary'
        : ''
    }`}
    placeholder={
      codeMode === 'auto'
        ? 'Generating…'
        : 'Scan barcode or type custom code'
    }
    aria-required="true"
  />
  {codeMode === 'auto' ? (
    <p className="mt-1.5 text-xs font-medium text-salon-muted">
      System-generated sequential code. Switch to Manual to type or scan a
      custom barcode.
    </p>
  ) : (
    <p className="mt-1.5 text-xs font-medium text-salon-muted">
      Type or scan a unique barcode, or switch to Auto for{' '}
      <span className="font-semibold text-salon-primary">
        {PRODUCT_CODE_PREFIX}###
      </span>
      .
    </p>
  )}
</div>

{/* Name */}
<div>
  <label
    htmlFor="product-name"
    className="text-sm font-semibold text-salon-text"
  >
    Product Name / Description <span className="text-salon-danger">*</span>
  </label>
  <input
    id="product-name"
    type="text"
    autoFocus={codeMode === 'auto'}
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


{/* Name — second */}
<div>
  <label htmlFor="product-name" className="text-sm font-semibold text-salon-text">
    Product Name / Description <span className="text-salon-danger">*</span>
  </label>
  <input
    id="product-name"
    type="text"
    /* remove autoFocus here */
    autoComplete="off"
    value={form.name}
    onChange={(e) => updateField('name', e.target.value)}
    className={inputClass}
    placeholder="e.g. Shampoo 250ml"
  />
  {fieldError && (
    <p className="mt-1.5 text-sm font-medium text-salon-danger">{fieldError}</p>
  )}
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