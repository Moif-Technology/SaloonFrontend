import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { X, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import Button from '../common/Button'
import type { CustomerFormValues, CustomerWizardStep } from '../../types/customer'
import {
  canSaveCustomer,
  getEmailError,
  getMobileError,
  getNameError,
  isValidCustomerName,
  isValidEmail,
  isValidMobile,
} from '../../utils/customerValidation'
import { createCustomer } from '../../api/customers.ts'
import NumericKeypad from '../common/NumericKeypad'
import { applyNumericKey, type NumericKey } from '../../utils/numericInput'


interface CustomerEntryModalProps {
  open: boolean
  onClose: () => void
  /** Called after successful create — parent can set Walk-in → name, refresh list, etc. */
  onSaved?: (customer: unknown) => void
  /** Optional: show errors via snackbar from parent */
  onError?: (message: string) => void
}

const STEP_LABELS = ['Customer Name', 'Mobile Number', 'Email', 'Address'] as const

const emptyForm: CustomerFormValues = {
  name: '',
  mobile: '',
  email: '',
  address: '',
}

export default function CustomerEntryModal({
  open,
  onClose,
  onSaved,
  onError,
}: CustomerEntryModalProps) {
  const [step, setStep] = useState<CustomerWizardStep>(1)
  const [form, setForm] = useState<CustomerFormValues>(emptyForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Reset when opened
  useEffect(() => {
    if (!open) return
    setStep(1)
    setForm(emptyForm)
    setFieldError(null)
    setSaving(false)
  }, [open])

  // Auto-focus active field whenever step changes / modal opens
  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => {
      inputRef.current?.focus()
      // Keep field above keyboard on touch devices
      inputRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, 50)
    return () => window.clearTimeout(t)
  }, [open, step])

  // Android soft keyboard: pin footer using visualViewport
  useEffect(() => {
    if (!open || step === 2 || !window.visualViewport) return
    const vv = window.visualViewport
  
    function sync() {
      const el = panelRef.current
      if (!el) return
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      el.style.transform = inset > 0 ? `translateY(-${Math.min(inset, 120)}px)` : ''
    }
  
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    sync()
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
      if (panelRef.current) panelRef.current.style.transform = ''
    }
  }, [open])

  function handleMobileKey(key: NumericKey) {
    setForm((prev) => ({
      ...prev,
      mobile: applyNumericKey(prev.mobile, key, {
        allowDecimal: false,
        allowLeadingZeros: true, // phone can have leading 0 in some locales; IN 10-digit usually not
        maxLength: 10,
      }),

    }))
    setFieldError(null)
  }
  if (!open) return null

  function updateField<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldError(null)
  }

  function canGoNextFromStep(s: CustomerWizardStep): boolean {
    if (s === 1) return isValidCustomerName(form.name)
    if (s === 2) return isValidMobile(form.mobile)
    if (s === 3) return isValidEmail(form.email) // empty OK
    return true
  }

  function goNext() {
    if (step === 1) {
      const err = getNameError(form.name)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(2)
      return
    }
    if (step === 2) {
      const err = getMobileError(form.mobile)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(3)
      return
    }
    if (step === 3) {
      const err = getEmailError(form.email)
      if (err) {
        setFieldError(err)
        return
      }
      setStep(4)
    }
  }

  function goPrevious() {
    setFieldError(null)
    if (step > 1) setStep((s) => (s - 1) as CustomerWizardStep)
  }

  function skipOptional() {
    // Skip only on steps 3 and 4
    if (step === 3) {
      updateField('email', '')
      setFieldError(null)
      setStep(4)
      return
    }
    if (step === 4) {
      updateField('address', '')
      void handleSave()
    }
  }

  async function handleSave() {
    if (!canSaveCustomer(form) || saving) return
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        mobile: form.mobile,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      }
      const customer = await createCustomer(payload)
      onSaved?.(customer)
      onClose()
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Failed to save customer'
      onError?.(message)
      setFieldError(message)
    } finally {
      setSaving(false)
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter') return
    // Textarea: allow Shift+Enter for newline; plain Enter advances/saves
    if (step === 4 && e.shiftKey) return
    e.preventDefault()
    if (step < 3) {
      goNext()
    } else if (step === 3) {
      if (canGoNextFromStep(3)) goNext()
    } else {
      if (canSaveCustomer(form)) void handleSave()
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (step < 4) goNext()
    else void handleSave()
  }

  const nextDisabled =
    (step === 1 && !isValidCustomerName(form.name)) ||
    (step === 2 && !isValidMobile(form.mobile)) ||
    (step === 3 && !isValidEmail(form.email))

  const saveDisabled = !canSaveCustomer(form) || saving

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-entry-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
      className={[
  'flex w-full max-h-[min(720px,90dvh)] flex-col overflow-hidden rounded-2xl border border-salon-border bg-white shadow-xl transition-transform duration-200',
  step === 2 ? 'max-w-[900px]' : 'max-w-[560px]',
].join(' ')}
 >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-salon-border px-5 py-4">
          <div>
            <h2 id="customer-entry-title" className="text-xl font-bold text-salon-text">
              Customer Entry
            </h2>
            <p className="mt-0.5 text-sm font-medium text-salon-muted">
              Step {step} of 4 · {STEP_LABELS[step - 1]}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-salon-muted hover:bg-black/5"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </header>

        {/* Step pills */}
        <div className="flex shrink-0 gap-2 px-5 pt-4">
          {([1, 2, 3, 4] as const).map((n) => (
            <div
              key={n}
              className={[
                'h-1.5 flex-1 rounded-full transition-colors duration-300',
                n <= step ? 'bg-salon-primary' : 'bg-salon-border',
              ].join(' ')}
              aria-hidden
            />
          ))}
        </div>

        {/* Body: one field */}
        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
         <div className="flex min-h-0 flex-1 flex-col justify-start px-5 pt-5 pb-4">
            <div
              key={step}
              className="animate-[fadeIn_0.2s_ease-out]"
            >
              {step === 1 && (
                <FieldBlock
                  label="Customer Name"
                  required
                  error={fieldError}
                >
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    autoComplete="name"
                    enterKeyHint="next"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    onKeyDown={onKeyDown}
                    className={inputClass}
                    placeholder="Enter full name"
                  />
                </FieldBlock>
              )}

{step === 2 && (
  <div className="flex min-h-[320px] items-start gap-4">
    {/* LEFT: active field only */}
    <div className="flex w-[45%] flex-col justify-start">
      <FieldBlock label="Mobile Number" required error={fieldError}>
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          readOnly
          inputMode="none"
          autoComplete="off"
          value={form.mobile}
          onKeyDown={onKeyDown}
          className={inputClass}
          placeholder="10-digit mobile"
        />
      </FieldBlock>
    </div>

    {/* RIGHT: keypad */}
    <div className="w-[55%] rounded-xl bg-salon-bg p-3">
      <NumericKeypad
        allowDecimal={false}
        doneLabel="Next"
        onKey={handleMobileKey}
        onDone={goNext}
      />
    </div>
  </div>
)}

{step === 3 && (
  <FieldBlock label="Email" required={false} error={fieldError}>
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type="email"
      inputMode="email"
      autoComplete="email"
      enterKeyHint="next"
      value={form.email}
      onChange={(e) => updateField('email', e.target.value)}
      onKeyDown={onKeyDown}
      className={inputClass}
      placeholder="Optional"
    />
  </FieldBlock>
)}

              {step === 4 && (
                <FieldBlock label="Address" required={false} error={fieldError}>
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    rows={3}
                    enterKeyHint="done"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    onKeyDown={onKeyDown}
                    className={`${inputClass} resize-none`}
                    placeholder="Optional"
                  />
                </FieldBlock>
              )}
            </div>
          </div>

          {/* Fixed footer navigation — always visible */}
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-salon-border bg-salon-bg/80 px-4 py-3 backdrop-blur-sm md:gap-3 md:px-5 md:py-4">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="secondary"
                icon={<ChevronLeft size={22} />}
                onClick={goPrevious}
                className="min-w-[120px] flex-1"
              >
                Previous
              </Button>
            )}

            {(step === 3 || step === 4) && (
              <Button
                type="button"
                variant="outline"
                size="secondary"
                onClick={skipOptional}
                disabled={saving}
                className="min-w-[100px] flex-1"
              >
                Skip
              </Button>
            )}

            {step < 4 && (
              <Button
                type="button"
                variant="primary"
                size="secondary"
                icon={<ChevronRight size={22} />}
                onClick={goNext}
                disabled={nextDisabled}
                className="min-w-[120px] flex-[1.4]"
              >
                Next
              </Button>
            )}

            {step === 4 && (
              <Button
                type="button"
                variant="primary"
                size="secondary"
                icon={<Save size={22} />}
                onClick={() => void handleSave()}
                disabled={saveDisabled}
                className="min-w-[120px] flex-[1.4]"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            )}
          </footer>
        </form>
      </div>
    </div>
  )
}

const inputClass =
  'mt-2 w-full rounded-xl border-2 border-salon-border bg-white px-4 py-3.5 text-xl font-medium text-salon-text outline-none transition-colors placeholder:text-salon-muted/60 focus:border-salon-primary'

  function FieldBlock({
    label,
    required,
    error,
    children,
  }: {
    label: string
    required: boolean
    error: string | null
    children: React.ReactNode
  }) {
    return (
      <label className="block">
        <span className="text-base font-semibold text-salon-text">
          {label}
          {required ? (
            <span className="text-salon-danger"> *</span>
          ) : (
            <span className="font-medium text-salon-muted"> (optional)</span>
          )}
        </span>
        {children}
        {error && (
          <p className="mt-2 text-sm font-medium text-salon-danger" role="alert">
            {error}
          </p>
        )}
      </label>
    )
  }
