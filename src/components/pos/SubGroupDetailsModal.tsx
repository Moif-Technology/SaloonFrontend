import { useEffect, useState, type FormEvent } from 'react'
import { X, Layers, Save, Tag, RotateCcw } from 'lucide-react'
import Button from '../common/Button'
import { createSubGroup, updateSubGroup } from '../../api/subGroups'
import { fetchGroups } from '../../api/groups'
import type { CatalogueGroup } from '../../types/group'
import type {
  CatalogueSubGroup,
  SubGroupFormValues,
} from '../../types/subGroup'

export interface SubGroupDetailsModalProps {
  open: boolean
  onClose: () => void
  /** Pass when editing; omit for create */
  initialSubGroup?: CatalogueSubGroup | null
  onSaved?: (subGroup: CatalogueSubGroup) => void
  onError?: (message: string) => void
}

const emptyForm: SubGroupFormValues = {
  parentGroupId: '',
  code: '',
  name: '',
  nameAr: '',
  showOnBackOffice: false,
}

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-base font-medium text-salon-text outline-none focus:border-salon-primary'

const selectClass = inputClass

export default function SubGroupDetailsModal({
  open,
  onClose,
  initialSubGroup = null,
  onSaved,
  onError,
}: SubGroupDetailsModalProps) {
  const [form, setForm] = useState<SubGroupFormValues>(emptyForm)
  const [groups, setGroups] = useState<CatalogueGroup[]>([])
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(false)

  const isEdit = Boolean(initialSubGroup?.id)

  function resetForm(from?: CatalogueSubGroup | null) {
    if (from) {
      setForm({
        parentGroupId: from.parentGroupId ?? '',
        code: from.code ?? '',
        name: from.name ?? '',
        nameAr: from.nameAr ?? '',
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
    resetForm(initialSubGroup)
  }, [open, initialSubGroup])

  // Load parent groups — copy of ProductDetailsModal loadGroups
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

  function updateField<K extends keyof SubGroupFormValues>(
    key: K,
    value: SubGroupFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  function handleNew() {
    resetForm(null)
  }

  async function handleSave() {
    if (!form.parentGroupId) {
      const message = 'Parent group is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    const code = form.code.trim()
    if (!code) {
      const message = 'Sub group code is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    const name = form.name.trim()
    if (!name) {
      const message = 'Sub group name is required'
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

    setSaving(true)
    try {
      const payload = {
        parentGroupId: form.parentGroupId,
        code,
        name,
        nameAr: form.nameAr.trim() || undefined,
        showOnBackOffice: form.showOnBackOffice,
      }

      const result =
        isEdit && initialSubGroup
          ? await updateSubGroup(initialSubGroup.id, payload)
          : await createSubGroup(payload)

      onSaved?.(result)
      onClose()
    } catch {
      const message = 'Could not save sub group'
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

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sub-group-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(640px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* Header — same as GroupDetailsModal ~130–157 */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <Layers size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="sub-group-entry-title"
                className="text-xl font-bold text-salon-text"
              >
                {isEdit ? 'Edit Sub Group' : 'Sub Group Entry'}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                {isEdit
                  ? 'Update sub-category under a main group'
                  : 'Create a new sub-category under a main group'}
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
            {/* Parent Group — mandatory */}
            <div>
              <label
                htmlFor="sub-group-parent"
                className="text-sm font-semibold text-salon-text"
              >
                Parent Group <span className="text-salon-danger">*</span>
              </label>
              <select
                id="sub-group-parent"
                value={form.parentGroupId}
                onChange={(e) => updateField('parentGroupId', e.target.value)}
                className={selectClass}
                disabled={loadingGroups}
              >
                <option value="">
                  {loadingGroups ? 'Loading groups…' : 'Select a parent group'}
                </option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Code / ID — mandatory + tag icon */}
            <div>
              <label
                htmlFor="sub-group-code"
                className="text-sm font-semibold text-salon-text"
              >
                Sub Group Code / ID{' '}
                <span className="text-salon-danger">*</span>
              </label>
              <div className="relative mt-1.5">
                <input
                  id="sub-group-code"
                  type="text"
                  autoComplete="off"
                  value={form.code}
                  onChange={(e) => updateField('code', e.target.value)}
                  className={`${inputClass} mt-0 pr-12`}
                  placeholder="e.g. HT"
                />
                <span
                  className="pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-center text-salon-primary"
                  aria-hidden
                >
                  <Tag size={20} />
                </span>
              </div>
            </div>

            {/* Name * */}
            <div>
              <label
                htmlFor="sub-group-name"
                className="text-sm font-semibold text-salon-text"
              >
                Sub Group Name <span className="text-salon-danger">*</span>
              </label>
              <input
                id="sub-group-name"
                type="text"
                autoFocus
                autoComplete="off"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Hair Spa"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Arabic name */}
            <div>
              <label
                htmlFor="sub-group-name-ar"
                className="text-sm font-semibold text-salon-text"
              >
                Sub Group Name Arabic{' '}
                <span className="font-normal text-salon-muted">(optional)</span>
              </label>
              <input
                id="sub-group-name-ar"
                type="text"
                autoComplete="off"
                dir="rtl"
                value={form.nameAr}
                onChange={(e) => updateField('nameAr', e.target.value)}
                className={inputClass}
                placeholder="الاسم بالعربية"
              />
            </div>

            {/* BackOffice only */}
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

          {/* Footer: New | Cancel | Save — same as ProductDetailsModal ~440–475 */}
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