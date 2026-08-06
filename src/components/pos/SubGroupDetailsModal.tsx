import { useEffect, useRef, useState, type FormEvent } from 'react'
import { X, Layers, Save } from 'lucide-react'
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

/** Sequential system codes: SGRP-001, SGRP-002, … (not derived from name) */
const SUBGROUP_CODE_PREFIX = 'SGRP-'
const SUBGROUP_CODE_SEQ_KEY = 'salon-pos-subgroup-code-seq'

function formatSubGroupSystemCode(seq: number): string {
  return `${SUBGROUP_CODE_PREFIX}${String(seq).padStart(3, '0')}`
}

function readSubGroupCodeSeq(): number {
  try {
    const n = Number(localStorage.getItem(SUBGROUP_CODE_SEQ_KEY))
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1
  } catch {
    return 1
  }
}

/** Next unused sequential code (does not advance the counter). */
function peekNextSystemSubGroupCode(): string {
  return formatSubGroupSystemCode(readSubGroupCodeSeq())
}

/**
 * After a successful create, keep the sequence ahead of any SGRP-### code used.
 */
function advanceSubGroupCodeSeqAfterSave(code: string) {
  const match = code
    .trim()
    .toUpperCase()
    .match(/^SGRP-(\d+)$/)
  if (!match) return
  const used = Number(match[1])
  if (!Number.isFinite(used) || used < 1) return
  try {
    const next = Math.max(readSubGroupCodeSeq(), used + 1)
    localStorage.setItem(SUBGROUP_CODE_SEQ_KEY, String(next))
  } catch {
    // ignore storage failures
  }
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
  /** Auto = system sequential code (locked); Manual = free-form entry */
  const [codeMode, setCodeMode] = useState<'auto' | 'manual'>('auto')

  const isEdit = Boolean(initialSubGroup?.id)
  const sessionKeyRef = useRef<string | null>(null)
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    if (!open) {
      sessionKeyRef.current = null
      return
    }
    const key = initialSubGroup?.id ?? 'new'
    if (sessionKeyRef.current === key) return
    sessionKeyRef.current = key
    if (initialSubGroup) {
      setForm({
        parentGroupId: initialSubGroup.parentGroupId ?? '',
        code: initialSubGroup.code ?? '',
        name: initialSubGroup.name ?? '',
        nameAr: initialSubGroup.nameAr ?? '',
        showOnBackOffice: initialSubGroup.showOnBackOffice ?? false,
      })
      // Edit: Manual so existing system/custom codes stay editable
      setCodeMode('manual')
    } else {
      setForm({
        ...emptyForm,
        code: peekNextSystemSubGroupCode(),
      })
      setCodeMode('auto')
    }
    setFieldError(null)
    setSaving(false)
  }, [open, initialSubGroup])

  // Load parent groups once when opened
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

  function updateField<K extends keyof SubGroupFormValues>(
    key: K,
    value: SubGroupFormValues[K],
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
      // System sequential code — never derived from name or parent group
      updateField('code', peekNextSystemSubGroupCode())
    }
    // Manual: keep current code so user can edit it
  }

  /** Parent selection only — never mutates code or codeMode */
  function handleParentGroupChange(parentGroupId: string) {
    updateField('parentGroupId', parentGroupId)
  }

  async function handleSave() {
    const code = (form.code ?? '').trim()
    if (!code) {
      const message = 'Code is required'
      setFieldError(message)
      onError?.(message)
      return
    }

    if (!form.parentGroupId) {
      const message = 'Parent group is required'
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

      if (!isEdit) {
        advanceSubGroupCodeSeqAfterSave(code)
      }

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

  if (!open) return null

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
            {/* 1. Code — Auto/Manual; independent of parent & name */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="sub-group-code"
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
                id="sub-group-code"
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
                  codeMode === 'auto'
                    ? 'Generating…'
                    : 'e.g. SGRP-001 or custom'
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
                    {SUBGROUP_CODE_PREFIX}###
                  </span>
                  .
                </p>
              )}
            </div>

            {/* 2. Parent Group */}
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
                onChange={(e) => handleParentGroupChange(e.target.value)}
                className={selectClass}
                disabled={loadingGroups}
                aria-required="true"
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

            {/* 3. Sub Group Name */}
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
                aria-required="true"
              />
              {fieldError && (
                <p className="mt-1.5 text-sm font-medium text-salon-danger">
                  {fieldError}
                </p>
              )}
            </div>

            {/* Sub Group Name Arabic (optional) */}
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
