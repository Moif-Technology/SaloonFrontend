import { useEffect, useState, type FormEvent } from 'react'
import { X, FolderPlus, Save } from 'lucide-react'
import Button from '../common/Button'
import { createGroup, updateGroup } from '../../api/groups'
import type { CatalogueGroup, GroupFormValues } from '../../types/group'

export interface GroupDetailsModalProps {
  open: boolean
  onClose: () => void
  /** Pass when editing; omit for create */
  initialGroup?: CatalogueGroup | null
  onSaved?: (group: unknown) => void
  onError?: (message: string) => void
}

const emptyForm: GroupFormValues = {
  name: '',
  code: '',
  active: true,
  sortOrder: undefined,
}

const inputClass =
  'mt-1.5 h-12 w-full rounded-xl border-2 border-salon-border bg-white px-4 text-base font-medium text-salon-text outline-none focus:border-salon-primary'

export default function GroupDetailsModal({
  open,
  onClose,
  initialGroup = null,
  onSaved,
  onError,
}: GroupDetailsModalProps) {
  const [form, setForm] = useState<GroupFormValues>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const isEdit = Boolean(initialGroup?.id)

  useEffect(() => {
    if (!open) return
    if (initialGroup) {
      setForm({
        name: initialGroup.name ?? '',
        code: initialGroup.code ?? '',
        active: initialGroup.active ?? true,
        sortOrder: initialGroup.sortOrder,
      })
    } else {
      setForm(emptyForm)
    }
    setFieldError(null)
    setSaving(false)
  }, [open, initialGroup])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function updateField<K extends keyof GroupFormValues>(
    key: K,
    value: GroupFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  async function handleSave() {
    const name = form.name.trim()
    if (!name) {
      setFieldError('Group name is required')
      onError?.('Group name is required')
      return
    }
    if (name.length < 2) {
      setFieldError('Name must be at least 2 characters')
      onError?.('Name must be at least 2 characters')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name,
        code: form.code?.trim() || undefined,
        active: form.active,
        sortOrder:
          form.sortOrder === undefined || Number.isNaN(Number(form.sortOrder))
            ? undefined
            : Number(form.sortOrder),
      }

      const result = isEdit && initialGroup
        ? await updateGroup(initialGroup.id, payload)
        : await createGroup(payload)

      onSaved?.(result)
      onClose()
    } catch {
      const message = 'Could not save group'
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
      aria-labelledby="group-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(640px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-salon-primary-light text-salon-primary">
              <FolderPlus size={22} />
            </span>
            <div className="min-w-0">
              <h2
                id="group-entry-title"
                className="text-xl font-bold text-salon-text"
              >
                {isEdit ? 'Edit Group' : 'Group Entry'}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-salon-muted">
                {isEdit
                  ? 'Update catalogue group details'
                  : 'Create a new service / product group'}
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
            <div>
              <label
                htmlFor="group-name"
                className="text-sm font-semibold text-salon-text"
              >
                Group Name <span className="text-salon-danger">*</span>
              </label>
              <input
                id="group-name"
                type="text"
                autoFocus
                autoComplete="off"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. Hair Care"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="group-code"
                className="text-sm font-semibold text-salon-text"
              >
                Code <span className="font-normal text-salon-muted">(optional)</span>
              </label>
              <input
                id="group-code"
                type="text"
                autoComplete="off"
                value={form.code ?? ''}
                onChange={(e) => updateField('code', e.target.value)}
                className={inputClass}
                placeholder="e.g. HC"
              />
            </div>

            <div>
              <label
                htmlFor="group-sort"
                className="text-sm font-semibold text-salon-text"
              >
                Sort order{' '}
                <span className="font-normal text-salon-muted">(optional)</span>
              </label>
              <input
                id="group-sort"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.sortOrder ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateField(
                    'sortOrder',
                    v === '' ? undefined : Number(v),
                  )
                }}
                className={inputClass}
                placeholder="0"
              />
            </div>

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
          </div>

          <footer className="flex shrink-0 gap-3 border-t border-salon-border px-4 py-3.5 sm:px-5">
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
          </footer>
        </form>
      </div>
    </div>
  )
}