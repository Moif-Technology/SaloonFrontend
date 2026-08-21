/**
 * Admin-only POS setup — bill headings, tax number, footers (parameter table).
 */
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, Save, Settings2, X } from 'lucide-react'
import {
  fetchReceiptSettings,
  peekReceiptSettingsCache,
  saveReceiptSettings,
  type ReceiptSettings,
} from '../../utils/receiptSettings'
import { isPosAdmin } from '../../utils/posAdmin'
import Button from '../common/Button'

interface PosSetupDialogProps {
  open: boolean
  onClose: () => void
  onError?: (message: string) => void
  onSaved?: (message: string) => void
}

const empty: ReceiptSettings = {
  heading1: '',
  heading2: '',
  heading3: '',
  heading4: '',
  heading5: '',
  footer1: '',
  footer2: '',
  taxRegNo: '',
  tax1: 0,
}

const inputClass =
  'mt-1 h-11 w-full rounded-xl border border-salon-border bg-white px-3 text-sm font-medium text-salon-text outline-none focus:border-salon-primary'

const FIELDS: { key: keyof ReceiptSettings; label: string; hint?: string }[] = [
  { key: 'heading1', label: 'Heading 1', hint: 'Shop / company name on bill' },
  { key: 'heading2', label: 'Heading 2', hint: 'Address line' },
  { key: 'heading3', label: 'Heading 3', hint: 'City / phone' },
  { key: 'heading4', label: 'Heading 4' },
  { key: 'heading5', label: 'Heading 5' },
  { key: 'taxRegNo', label: 'Tax Registration No (TRN)' },
  { key: 'footer1', label: 'Footer 1', hint: 'Thank-you line' },
  { key: 'footer2', label: 'Footer 2' },
]

export default function PosSetupDialog({
  open,
  onClose,
  onError,
  onSaved,
}: PosSetupDialogProps) {
  const [form, setForm] = useState<ReceiptSettings>(empty)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const backdropDownRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const onErrorRef = useRef(onError)
  onCloseRef.current = onClose
  onErrorRef.current = onError

  // Load once when opened — do not depend on parent callback identity (that resets typing)
  useEffect(() => {
    if (!open) return
    if (!isPosAdmin()) {
      onErrorRef.current?.('Only admin can open POS Setup')
      onCloseRef.current()
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setForm(peekReceiptSettingsCache() ?? empty)
    void fetchReceiptSettings(true)
      .then((s) => {
        if (!cancelled) setForm(s)
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load settings')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSave(e?: FormEvent) {
    e?.preventDefault()
    if (saving || !isPosAdmin()) return
    setSaving(true)
    setError(null)
    try {
      await saveReceiptSettings(form)
      onSaved?.('Bill settings saved')
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not save settings'
      setError(message)
      onError?.(message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
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
        className="flex h-[min(680px,94dvh)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl"
        onMouseDown={() => {
          backdropDownRef.current = false
        }}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-salon-border bg-gradient-to-b from-salon-primary/95 to-salon-primary-dark px-4 py-3 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Settings2 size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold">POS Setup</h2>
            <p className="text-xs text-white/75">
              {loading ? 'Loading current settings…' : 'Bill headings, tax number & footers'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/15"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(e) => void handleSave(e)}>
          <div className="min-h-0 flex-1 space-y-3 overflow-auto px-4 py-3">
            {loading ? (
              <div className="flex justify-center py-16 text-salon-muted">
                <Loader2 className="animate-spin" size={22} />
              </div>
            ) : (
              FIELDS.map((f) => (
                <label key={f.key} className="block text-xs font-semibold text-salon-muted">
                  {f.label}
                  {f.hint ? (
                    <span className="ml-1 font-normal text-salon-muted/80">· {f.hint}</span>
                  ) : null}
                  <input
                    className={inputClass}
                    value={form[f.key]}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    maxLength={f.key === 'taxRegNo' ? 50 : 200}
                    autoComplete="off"
                  />
                </label>
              ))
            )}
            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}
          </div>

          <footer className="flex shrink-0 gap-2 border-t border-salon-border px-4 py-3">
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
              disabled={loading || saving}
              icon={saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
