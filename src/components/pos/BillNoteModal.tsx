import { useEffect, useState } from 'react'
import { X, StickyNote } from 'lucide-react'
import Button from '../common/Button'

/** Common salon instructions — tap to append into the note */
export const BILL_NOTE_PRESETS = [
  'Sensitive scalp',
  'VIP Client',
  'Client requested gentle shampoo',
  'Allergy — check products',
  'Prefer quiet chair',
  'Running late',
  'Use organic products only',
  'First visit',
] as const

export interface BillNoteModalProps {
  open: boolean
  onClose: () => void
  /** Currently saved bill note (empty string = none) */
  currentNote: string
  onSave: (note: string) => void
}

export default function BillNoteModal({
  open,
  onClose,
  currentNote,
  onSave,
}: BillNoteModalProps) {
  const [draft, setDraft] = useState('')

  // Seed from saved note when modal opens
  useEffect(() => {
    if (!open) return
    setDraft(currentNote ?? '')
  }, [open, currentNote])

  // Escape closes
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  function appendPreset(text: string) {
    setDraft((prev) => {
      const t = prev.trim()
      if (!t) return text
      // Avoid exact duplicate last fragment
      if (t === text || t.endsWith(text)) return prev
      return `${t}; ${text}`
    })
  }

  function handleClear() {
    setDraft('')
  }

  function handleSave() {
    onSave(draft.trim())
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-note-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="flex w-full max-h-[min(640px,92dvh)] max-w-[560px] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl">
        {/* ── Header ── */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-salon-border px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h2
              id="bill-note-title"
              className="text-xl font-bold text-salon-text"
            >
              Add Bill Note / Instructions
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Visible to staff working this bill
            </p>
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

        {/* ── Body ── */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
          {/* Quick presets */}
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-salon-muted">
              Quick notes
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BILL_NOTE_PRESETS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => appendPreset(label)}
                  className={[
                    'min-h-[48px] rounded-xl border-2 border-salon-border bg-salon-bg px-3 py-2.5',
                    'text-left text-sm font-semibold text-salon-text',
                    'transition-colors hover:border-salon-primary/40 hover:bg-salon-primary-light/50',
                    'active:bg-salon-primary-light',
                    'focus-visible:outline-none focus-visible:border-salon-primary',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Custom text */}
          <section>
            <label
              htmlFor="bill-note-textarea"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-salon-muted"
            >
              Custom note
            </label>
            <textarea
              id="bill-note-textarea"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="Type remarks about the client or service…"
              className={[
                'w-full resize-y rounded-xl border-2 border-salon-border bg-white',
                'px-4 py-3 text-base font-medium text-salon-text',
                'outline-none placeholder:text-salon-muted',
                'focus:border-salon-primary min-h-[120px]',
              ].join(' ')}
            />
            <p className="mt-1 text-right text-xs text-salon-muted tabular-nums">
              {draft.length}/500
            </p>
          </section>
        </div>

        {/* ── Footer ── */}
        <footer className="flex shrink-0 flex-col gap-2 border-t border-salon-border p-4 sm:flex-row sm:gap-3 sm:p-5">
          <Button
            variant="secondary"
            size="secondary"
            onClick={handleClear}
            className="min-h-[56px] w-full sm:flex-1"
          >
            Clear
          </Button>
          <Button
            variant="primary"
            size="secondary"
            icon={<StickyNote size={22} />}
            onClick={handleSave}
            className="min-h-[56px] w-full sm:flex-[1.4]"
          >
            Save Note
          </Button>
        </footer>
      </div>
    </div>
  )
}