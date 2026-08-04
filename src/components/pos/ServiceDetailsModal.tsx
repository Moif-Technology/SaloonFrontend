import { useEffect, useState, type FormEvent } from 'react'
import { X, Scissors, Save, Tag, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import { createService, updateService } from '../../api/services'
import { fetchGroups } from '../../api/groups'
import { fetchSubGroups } from '../../api/subGroups'
import type { CatalogueGroup } from '../../types/group'
import type { CatalogueSubGroup } from '../../types/subGroup'
import type {
  CatalogueService,
  ServiceFormValues,
} from '../../types/service'

export interface ServiceDetailsModalProps {
  open: boolean
  onClose: () => void
  initialService?: CatalogueService | null
  onSaved?: (service: CatalogueService) => void
  onError?: (message: string) => void
}

const emptyForm: ServiceFormValues = {
  code: '',
  name: '',
  nameAr: '',
  groupId: '',
  subGroupId: '',
  price: undefined,
  durationMinutes: undefined,
  showOnBackOffice: false,
}

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-base font-medium text-salon-text outline-none focus:border-salon-primary'

const selectClass = inputClass

export default function ServiceDetailsModal({
  open,
  onClose,
  initialService = null,
  onSaved,
  onError,
}: ServiceDetailsModalProps) {
  const [form, setForm] = useState<ServiceFormValues>(emptyForm)
  const [groups, setGroups] = useState<CatalogueGroup[]>([])
  const [subGroups, setSubGroups] = useState<CatalogueSubGroup[]>([])
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [loadingSubGroups, setLoadingSubGroups] = useState(false)

  const isEdit = Boolean(initialService?.id)

  function resetForm(from?: CatalogueService | null) {
    if (from) {
      setForm({
        code: from.code ?? '',
        name: from.name ?? '',
        nameAr: from.nameAr ?? '',
        groupId: from.groupId ?? '',
        subGroupId: from.subGroupId ?? '',
        price: from.price,
        durationMinutes: from.durationMinutes,
        showOnBackOffice: from.showOnBackOffice ?? false,
      })
    } else {
      setForm(emptyForm)
    }
    setFieldError(null)
    setSaving(false)
  }

  useEffect(() => {
    if (!open) return
    resetForm(initialService)
  }, [open, initialService])

  // Load groups — same as ProductDetailsModal loadGroups
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

  // Load sub-groups when group changes
  useEffect(() => {
    if (!open || !form.groupId) {
      setSubGroups([])
      return
    }
    let cancelled = false
    async function loadSubGroups() {
      setLoadingSubGroups(true)
      try {
        const list = await fetchSubGroups(form.groupId)
        if (cancelled) return
        setSubGroups(list)
      } catch {
        if (!cancelled) onError?.('Could not load sub groups')
      } finally {
        if (!cancelled) setLoadingSubGroups(false)
      }
    }
    void loadSubGroups()
    return () => {
      cancelled = true
    }
  }, [open, form.groupId, onError])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function updateField<K extends keyof ServiceFormValues>(
    key: K,
    value: ServiceFormValues[K],
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value }
      // Reset dependent sub-group when group changes
      if (key === 'groupId') next.subGroupId = ''
      return next
    })
    setFieldError(null)
  }

  function handleNew() {
    resetForm(null)
  }

  async function handleSave() {
    const code = form.code.trim()
    if (!code) {
      const message = 'Service code is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    const name = form.name.trim()
    if (!name) {
      const message = 'Service name is required'
      setFieldError(message)
      onError?.(message)
      return
    }
    if (name.length < 2) {
      const message = 'Name must be at least 2 characters'
      setFieldError(message)
      onError?.(message)
      return
    }
    if (!form.groupId) {
      const message = 'Group is required'
      setFieldError(message)
      onError?.(message)
      return
    }
    if (!form.subGroupId) {
      const message = 'Sub group is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    const price = Number(form.price)
    if (form.price === undefined || Number.isNaN(price) || price < 0) {
      const message = 'Service price is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    setSaving(true)
    try {
      const payload = {
        code,
        name,
        nameAr: form.nameAr.trim() || undefined,
        groupId: form.groupId,
        subGroupId: form.subGroupId,
        price,
        durationMinutes:
          form.durationMinutes === undefined ||
          Number.isNaN(Number(form.durationMinutes))
            ? undefined
            : Number(form.durationMinutes),
        showOnBackOffice: form.showOnBackOffice,
      }

      const result =
        isEdit && initialService
          ? await updateService(initialService.id, payload)
          : await createService(payload)

      onSaved?.(result)
      onClose()
    } catch {
      const message = 'Could not save service'
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
    key: 'price' | 'durationMinutes',
  ) {
    updateField(key, value === '' ? undefined : Number(value))
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="service-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(720px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* Header — same as GroupDetailsModal ~130–157 */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Scissors size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="service-entry-title"
                className="text-xl font-bold text-salon-text"
              >
                {isEdit ? 'Edit Service' : 'Service Entry'}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                {isEdit
                  ? 'Update salon service item'
                  : 'Create a new salon service item'}
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
            {/* Service Code * + Tag icon (like SubGroupDetailsModal code field) */}
            <div>
              <label
                htmlFor="service-code"
                className="text-sm font-semibold text-salon-text"
              >
                Service Code / ID <span className="text-salon-danger">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="service-code"
                  type="text"
                  autoFocus
                  autoComplete="off"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  className={`${inputClass} mt-0 pr-12`}
                  placeholder="e.g. SVC-001"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-salon-primary"
                  aria-hidden
                >
                  <Tag size={20} />
                </span>
              </div>
            </div>

            {/* Service Name * */}
            <div>
              <label
                htmlFor="service-name"
                className="text-sm font-semibold text-salon-text"
              >
                Service Name / Description{' '}
                <span className="text-salon-danger">*</span>
              </label>
              <input
                id="service-name"
                type="text"
                autoComplete="off"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Advanced Hair Spa"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Service Name Arabic */}
            <div>
              <label
                htmlFor="service-name-ar"
                className="text-sm font-semibold text-salon-text"
              >
                Service Name Arabic{' '}
                <span className="font-normal text-salon-muted">(optional)</span>
              </label>
              <input
                id="service-name-ar"
                type="text"
                autoComplete="off"
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => updateField('nameAr', e.target.value)}
                className={inputClass}
                placeholder="اسم الخدمة"
              />
            </div>

            {/* Group * */}
            <div>
              <label
                htmlFor="service-group"
                className="text-sm font-semibold text-salon-text"
              >
                Group <span className="text-salon-danger">*</span>
              </label>
              <select
                id="service-group"
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

            {/* Sub-Group * */}
            <div>
              <label
                htmlFor="service-sub-group"
                className="text-sm font-semibold text-salon-text"
              >
                Sub Group <span className="text-salon-danger">*</span>
              </label>
              <select
                id="service-sub-group"
                value={form.subGroupId}
                onChange={(e) => updateField('subGroupId', e.target.value)}
                className={selectClass}
                disabled={!form.groupId || loadingSubGroups}
              >
                <option value="">
                  {!form.groupId
                    ? 'Select a group first'
                    : loadingSubGroups
                      ? 'Loading sub groups…'
                      : 'Select a sub group'}
                </option>
                {subGroups.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price & Duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="service-price"
                  className="text-sm font-semibold text-salon-text"
                >
                  Price <span className="text-salon-danger">*</span>
                </label>
                <input
                  id="service-price"
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
                  htmlFor="service-duration"
                  className="text-sm font-semibold text-salon-text"
                >
                  Duration (minutes){' '}
                  <span className="font-normal text-salon-muted">(optional)</span>
                </label>
                <input
                  id="service-duration"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form.durationMinutes ?? ''}
                  onChange={(e) =>
                    optionalNumber(e.target.value, 'durationMinutes')
                  }
                  className={inputClass}
                  placeholder="e.g. 45"
                />
              </div>
            </div>

            {/* BackOffice — same checkbox pattern as GroupDetailsModal Active ~229–239 */}
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
                Show only on BackOffice
              </span>
            </label>
          </div>

          {/* Footer — same as ProductDetailsModal ~440–475 */}
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