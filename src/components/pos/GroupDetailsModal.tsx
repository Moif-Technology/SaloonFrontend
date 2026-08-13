import { useEffect, useRef, useState, type FormEvent } from 'react'
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

/** Sequential system codes: GRP-001, GRP-002, … */
const GROUP_CODE_PREFIX = 'GRP-'
const GROUP_CODE_SEQ_KEY = 'salon-pos-group-code-seq'

function formatGroupSystemCode(seq: number): string {
  return `${GROUP_CODE_PREFIX}${String(seq).padStart(3, '0')}`
}

function readGroupCodeSeq(): number {
  try {
    const n = Number(localStorage.getItem(GROUP_CODE_SEQ_KEY))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
  } catch {
    return 1
  }
}

/** Next unused sequential code (does not advance the counter). */
function peekNextSystemGroupCode(): string {
  return formatGroupSystemCode(readGroupCodeSeq())
}

/**
 * After a successful create, keep the sequence ahead of any GRP-### code used
 * so the next open still gets a free number.
 */
function advanceGroupCodeSeqAfterSave(code: string) {
  const match = code
    .trim()
    .toUpperCase()
    .match(/^GRP-(\d+)$/)
  if (!match) return
  const used = Number(match[1])
  if (!Number.isFinite(used) || used < 1) return
  try {
    const next = Math.max(readGroupCodeSeq(), used + 1)
    localStorage.setItem(GROUP_CODE_SEQ_KEY, String(next))
  } catch {
    // ignore storage failures
  }
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
  /** Auto = system sequential code (locked); Manual = free-form entry */
  const [codeMode, setCodeMode] = useState<'auto' | 'manual'>('auto')
  const sessionKeyRef = useRef<string | null>(null)
  const backdropDownRef = useRef(false)

  const isEdit = Boolean(initialGroup?.id)

  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null
      return
    }
    const key = initialGroup?.id ?? 'new'
    if (sessionKeyRef.current === key) return
    sessionKeyRef.current = key
    if (initialGroup) {
      setForm({
        name: initialGroup.name ?? '',
        code: initialGroup.code ?? '',
        active: initialGroup.active ?? true,
        sortOrder: initialGroup.sortOrder,
      })
      // Edit: Manual so existing system/custom codes stay editable as-is
      setCodeMode('manual')
    } else {
      setForm({
        ...emptyForm,
        code: peekNextSystemGroupCode(),
      })
      setCodeMode('auto')
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

  function updateField<K extends keyof GroupFormValues>(
    key: K,
    value: GroupFormValues[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  function handleNameChange(name: string) {
    updateField('name', name)
  }

  function handleCodeChange(code: string) {
    updateField('code', code)
  }

  function handleCodeModeChange(mode: 'auto' | 'manual') {
    setCodeMode(mode)
    setFieldError(null)
    if (mode === 'auto') {
      // System sequential code — never derived from group name
      updateField('code', peekNextSystemGroupCode())
    }
    // Manual: keep current code so user can edit it
  }

  async function handleSave() {
    const code = (form.code ?? '').trim()
    if (!code) {
      const message = 'Code is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    const name = form.name.trim()
    if (!name) {
      const message = 'Group name is required'
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
        name,
        code,
        active: form.active,
        sortOrder:
          form.sortOrder === undefined || Number.isNaN(Number(form.sortOrder))
            ? undefined
            : Number(form.sortOrder),
      }

      const result =
        isEdit && initialGroup
          ? await updateGroup(initialGroup.id, payload)
          : await createGroup(payload)

      if (!isEdit) {
        advanceGroupCodeSeqAfterSave(code)
      }

      onSaved?.(result)
      onClose()
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Could not save group'
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

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-entry-title"
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
        className="flex w-full max-h-[min(640px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
        onMouseDown={() => {
          backdropDownRef.current = false
        }}
      >
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
            {/* Code — above Group Name; Auto locks sequential system code */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="group-code"
                  className="text-sm font-semibold text-salon-text"
                >
                  Code <span className="text-salon-danger">*</span>
                </label>

                <div
                  className="inline-flex h-9 shrink-0 items-center rounded-lg border-2 border-salon-border bg-salon-bg p-0.5"
                  role="group"
                  aria-label="Code entry mode"
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
                id="group-code"
                type="text"
                autoComplete="off"
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
                  codeMode === 'auto' ? 'Generating…' : 'e.g. GRP-001 or custom'
                }
                aria-required="true"
              />
              {codeMode === 'auto' ? (
                <p className="mt-1.5 text-xs font-medium text-salon-muted">
                  System-generated sequential code. Switch to Manual to type a
                  custom code.
                </p>
              ) : (
                <p className="mt-1.5 text-xs font-medium text-salon-muted">
                  Enter a unique code, or switch to Auto for{' '}
                  <span className="font-semibold text-salon-primary">
                    {GROUP_CODE_PREFIX}###
                  </span>
                  .
                </p>
              )}
            </div>

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
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="e.g. Hair Care"
                aria-required="true"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="group-sort"
                className="text-sm font-semibold text-salon-text"
              >
                Display order
              </label>
              <input
                id="group-sort"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.sortOrder ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  updateField('sortOrder', v === '' ? undefined : Number(v))
                }}
                className={inputClass}
                placeholder="e.g. 1"
              />
              <p className="mt-1.5 text-xs font-medium text-salon-muted">
                Lower numbers appear first on POS / Counter.
              </p>
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
